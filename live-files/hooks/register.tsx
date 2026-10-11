import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Commit, GitInfo, Now, Touched, TouchStatus, View } from '../types'
import { ACCENT, PILL, nowCard, touchedParts } from './card'
import {
  ancestors,
  basename,
  clip,
  dirname,
  fmtSize,
  fmtTime,
  isCommitCommand,
  isInside,
  join,
  keyOf,
  lineDiff,
  norm,
  parseNumstat,
  parseStatus,
  plural,
  relTo,
  tagFor,
} from './model'
import { MAX_SHOWN, treeParts } from './tree'
import type { TreeRow } from './tree'

const PANE = 'live-files'

const READY: Now = {
  isLive: false,
  label: 'RIGHT NOW',
  title: 'Claude is ready',
  sub: 'waiting for your next message',
  accent: 'grey',
  icon: 'check',
  added: 0,
  removed: 0,
  stamp: 0,
}
const NO_GIT: GitInfo = { isRepo: false, branch: '', ahead: 0, files: {}, added: 0, removed: 0 }
const NEW_VIEW: View = { root: '', showSizes: false, hideHidden: false, query: '', expanded: [], follow: true }

const nowA = atom({ plugin: 'live-files', key: 'now' } as const, READY)
const touchedA = atom({ plugin: 'live-files', key: 'touched' } as const, [] as Touched[])
const gitA = atom({ plugin: 'live-files', key: 'git' } as const, NO_GIT)
const viewA = atom({ plugin: 'live-files', key: 'view' } as const, NEW_VIEW)
const projectA = atom({ plugin: 'live-files', key: 'project' } as const, '')
const commitA = atom({ plugin: 'live-files', key: 'commit' } as const, { hash: '', count: 0 } as Commit)

const EDIT_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])
const SEARCH_TOOLS = new Set(['Grep', 'Glob'])
const SHELL_TOOLS = new Set(['Bash', 'PowerShell'])
const GIT_CANDIDATES = ['git', 'C:\\Program Files\\Git\\cmd\\git.exe', 'C:\\Program Files (x86)\\Git\\cmd\\git.exe']
const SKIP_DIRS = new Set(['node_modules', '.git'])
const MAX_ROWS = 400
/** How long a row jumped to from the touched card shines. */
const FLASH_MS = 4000
/** How long a reading/editing state stays on screen at least, so it can be seen. */
const HOLD_MS = 1500
/** Pixels per cell the cards are drawn at; the surface scales a wider drawing down to the pane. */
const PX_PER_COL = 8.4

// Module state; a reload starts it over, the atoms above stay.
let gitExe: string | null | undefined
let gitTimer: { cancel: () => void } | undefined
let settleTimer: { cancel: () => void } | undefined
let shownUntil = 0
let turnSeq = 0
const active = new Map<string, Now>()
/** The tree rows last drawn, so a click on a row finds it. */
let drawnRows: TreeRow[] = []
/** The row just jumped to, shining until `until` (clock ms). */
let flash: { key: string; until: number } | undefined
let flashTimer: { cancel: () => void } | undefined

type Shell = { exitCode: number; stdout: string }

async function findGit($: EngineInterface): Promise<string | null> {
  if (gitExe !== undefined) return gitExe
  for (const exe of GIT_CANDIDATES) {
    const ran = await $.process.run([exe, '--version'], { timeoutMs: 4000 }).catch(() => undefined)
    if (ran && ran.exitCode === 0) return (gitExe = exe)
  }
  return (gitExe = null)
}

async function git($: EngineInterface, cwd: string, args: string[]): Promise<Shell | undefined> {
  const exe = await findGit($)
  if (!exe) return undefined
  return $.process
    .run([exe, '-C', cwd, ...args], { timeoutMs: 8000, env: { GIT_OPTIONAL_LOCKS: '0' } })
    .catch(() => undefined)
}

/**
 * The project folder's place inside its repository (`""` at the top), or
 * undefined outside one. Git reports paths relative to the repository top; the
 * top's absolute spelling can differ from ours (the Store app's folders are
 * redirected), so paths are always rebuilt from the project folder.
 */
async function repoPrefix($: EngineInterface, project: string): Promise<string | undefined> {
  const ran = await git($, project, ['rev-parse', '--show-prefix'])
  if (!ran || ran.exitCode !== 0) return undefined
  return ran.stdout.trim()
}

function fromRepo(project: string, prefix: string, path: string): string | undefined {
  if (!path.startsWith(prefix)) return undefined
  return join(project, path.slice(prefix.length))
}

async function refreshGit($: EngineInterface): Promise<void> {
  const project = await read($, projectA)
  if (!project) return
  const prefix = await repoPrefix($, project)
  if (prefix === undefined) {
    await update($, gitA, () => NO_GIT)
    return
  }
  const status = await git($, project, ['status', '--porcelain=v1', '-b', '-uall'])
  const parsed = parseStatus(status?.stdout ?? '')
  const unstaged = await git($, project, ['diff', '--numstat'])
  const staged = await git($, project, ['diff', '--numstat', '--cached'])
  const counts = parseNumstat(`${unstaged?.stdout ?? ''}\n${staged?.stdout ?? ''}`)
  const files: GitInfo['files'] = {}
  let added = 0
  let removed = 0
  for (const entry of parsed.entries) {
    const abs = fromRepo(project, prefix, entry.path)
    if (!abs) continue
    const c = counts[entry.path] ?? { added: 0, removed: 0 }
    files[keyOf(abs)] = { added: c.added, removed: c.removed, code: entry.code }
    added += c.added
    removed += c.removed
  }
  await update($, gitA, () => ({ isRepo: true, branch: parsed.branch, ahead: parsed.ahead, files, added, removed }))
}

function scheduleGit($: EngineInterface): void {
  if (gitTimer) return
  gitTimer = $.clock.after(450, () => {
    gitTimer = undefined
    void refreshGit($).catch(() => undefined)
  })
}

/** Runs `fn` at `at` (clock ms), at once when that has passed. */
async function at($: EngineInterface, when: number, fn: () => Promise<void>): Promise<void> {
  const wait = when - (await $.clock.now())
  if (wait <= 0) await fn()
  else $.clock.after(wait, () => void fn().catch(() => undefined))
}

async function setNow($: EngineInterface, now: Omit<Now, 'stamp'>): Promise<void> {
  const stamp = await $.clock.now()
  await update($, nowA, () => ({ ...now, stamp }))
}

function thinkingSub(touched: Touched[]): string {
  let opened = 0
  let edited = 0
  for (const t of touched) {
    if (t.status === 'edited' || t.status === 'created' || t.status === 'editing') edited += 1
    else opened += 1
  }
  if (!opened && !edited) return 'no files touched yet'
  const parts: string[] = []
  if (edited) parts.push(`edited ${plural(edited, 'file')}`)
  if (opened) parts.push(`opened ${plural(opened, 'file')}`)
  return parts.join(', ')
}

/** Shows the newest running tool; with none, "thinking" once the last one has had its time. */
async function settleNow($: EngineInterface): Promise<void> {
  settleTimer?.cancel()
  settleTimer = undefined
  const last = [...active.values()].pop()
  if (last) {
    shownUntil = Math.max(shownUntil, last.stamp + HOLD_MS)
    await update($, nowA, () => last)
    return
  }
  const wait = shownUntil - (await $.clock.now())
  if (wait > 0) {
    settleTimer = $.clock.after(wait, () => void settleNow($).catch(() => undefined))
    return
  }
  const touched = await read($, touchedA)
  await setNow($, { isLive: true, label: 'RIGHT NOW', title: 'Claude is thinking', sub: thinkingSub(touched), accent: 'grey', icon: 'spark', added: 0, removed: 0 })
}

async function touch($: EngineInterface, path: string, status: TouchStatus, diff?: { added: number; removed: number }): Promise<void> {
  const project = await read($, projectA)
  const key = keyOf(path)
  const inside = project !== '' && isInside(project, path)
  const rel = inside ? relTo(project, path) : norm(path)
  const dir = inside ? (rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '') : basename(dirname(path))
  await update($, touchedA, list => {
    const prev = list.find(t => t.key === key)
    const keepEdit = prev && (prev.status === 'edited' || prev.status === 'created') && (status === 'reading' || status === 'opened')
    const next: Touched = {
      key,
      path: norm(path),
      name: basename(path),
      dir,
      status: keepEdit ? prev!.status : status,
      added: (prev?.added ?? 0) + (diff?.added ?? 0),
      removed: (prev?.removed ?? 0) + (diff?.removed ?? 0),
    }
    return prev ? list.map(t => (t.key === key ? next : t)) : [...list, next]
  })
  const view = await read($, viewA)
  const root = view.root || project
  if (view.follow !== false && !isInside(root, path)) {
    // Follow Claude: the tree moves to the folder it works in, opened to the file.
    const next = project && isInside(project, path) ? project : await workRoot($, path)
    const open = ancestors(next, path).map(keyOf)
    await update($, viewA, v => ({ ...v, root: next, query: '', expanded: open }))
    return
  }
  const open = ancestors(root, path).map(keyOf)
  if (open.some(k => !view.expanded.includes(k))) {
    await update($, viewA, v => ({ ...v, expanded: [...new Set([...v.expanded, ...open])] }))
  }
}

const ROOT_MARKS = ['.git', 'package.json', '.claude-plugin', 'pyproject.toml', 'composer.json']

/** The folder a file outside the project belongs to: the nearest one with a project marker, else its own. */
async function workRoot($: EngineInterface, path: string): Promise<string> {
  let dir = dirname(path)
  for (let i = 0; i < 6; i++) {
    for (const mark of ROOT_MARKS) {
      if (await $.fs.exists(join(dir, mark)).catch(() => false)) return dir
    }
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
  return dirname(path)
}

/** The key of a tree row's Box, what the shine finds it by. */
const rowKey = (row: TreeRow): string => `at:${row.key ?? keyOf(row.path ?? '')}`

/** Opens the tree at a touched file (moving to its folder first if it lies elsewhere) and makes its row shine. */
async function reveal($: EngineInterface, t: Touched): Promise<void> {
  const project = await read($, projectA)
  const view = await read($, viewA)
  const root = view.root || project
  const isHere = root !== '' && isInside(root, t.path)
  const next = isHere ? root : project && isInside(project, t.path) ? project : await workRoot($, t.path)
  const open = ancestors(next, t.path).map(keyOf)
  // Shine for a moment, then draw the row plain again.
  flash = { key: `at:${t.key}`, until: (await $.clock.now()) + FLASH_MS }
  flashTimer?.cancel()
  flashTimer = $.clock.after(FLASH_MS + 100, () => {
    flash = undefined
    void update($, viewA, v => ({ ...v })).catch(() => undefined)
  })
  await update($, viewA, v => ({ ...v, root: next, query: '', expanded: isHere ? [...new Set([...v.expanded, ...open])] : open }))
}

/** Moves a file on from a working status, unless something else changed it meanwhile. */
async function finish($: EngineInterface, key: string, from: TouchStatus, to: TouchStatus): Promise<void> {
  await update($, touchedA, list => list.map(t => (t.key === key && t.status === from ? { ...t, status: to } : t)))
}

function where(project: string, path: string): string {
  if (!project || !isInside(project, path)) return `in ${basename(dirname(path))}`
  const rel = relTo(project, path)
  return rel.includes('/') ? `in ${rel.slice(0, rel.lastIndexOf('/'))}` : 'in the project folder'
}

function editDiff(tool: string, a: Record<string, unknown>, before: string | null): { added: number; removed: number } {
  if (tool === 'Edit') return lineDiff(String(a.old_string ?? ''), String(a.new_string ?? ''))
  if (tool === 'MultiEdit' && Array.isArray(a.edits)) {
    let added = 0
    let removed = 0
    for (const ed of a.edits as Record<string, unknown>[]) {
      const d = lineDiff(String(ed.old_string ?? ''), String(ed.new_string ?? ''))
      added += d.added
      removed += d.removed
    }
    return { added, removed }
  }
  if (tool === 'Write') return lineDiff(before ?? '', String(a.content ?? ''))
  return { added: 0, removed: 0 }
}

async function onCommit($: EngineInterface): Promise<void> {
  const project = await read($, projectA)
  if (!project) return
  const head = await git($, project, ['log', '-1', '--format=%h'])
  const hash = head?.exitCode === 0 ? head.stdout.trim() : ''
  const prefix = await repoPrefix($, project)
  if (!hash || prefix === undefined) return
  const names = await git($, project, ['diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD'])
  const keys = new Set<string>()
  for (const p of (names?.stdout ?? '').split(/\r?\n/)) {
    const abs = p ? fromRepo(project, prefix, p) : undefined
    if (abs) keys.add(keyOf(abs))
  }
  await update($, touchedA, list => list.map((t): Touched => (keys.has(t.key) ? { ...t, status: 'committed' } : t)))
  await update($, commitA, () => ({ hash, count: keys.size }))
}

async function doneNow($: EngineInterface, isAborted: boolean): Promise<void> {
  const touched = await read($, touchedA)
  const commit = await read($, commitA)
  const project = await read($, projectA)
  const edited = touched.filter(t => t.status === 'edited' || t.status === 'created' || t.status === 'editing')
  const opened = touched.filter(t => t.status === 'opened' || t.status === 'reading')
  const base = { isLive: false, added: 0, removed: 0 }
  if (isAborted) {
    await setNow($, { ...base, label: 'STOPPED', title: 'Claude was interrupted', sub: thinkingSub(touched), accent: 'red', icon: 'stop' })
    return
  }
  if (commit.hash) {
    await setNow($, { ...base, label: 'DONE', title: `Claude committed ${plural(commit.count, 'file')}`, sub: commit.hash, accent: 'green', icon: 'check' })
    return
  }
  const [first] = edited
  if (first) {
    const folders = new Set(opened.map(t => t.dir))
    const openedNote = opened.length > 1 && folders.size === 1 ? `opened ${opened.length} ${basename([...folders][0] || 'files')}` : ''
    const one = edited.length === 1
    const names = one ? (project && isInside(project, first.path) ? relTo(project, first.path) : first.name) : edited.map(t => t.name).join(', ')
    await setNow($, {
      isLive: false,
      label: 'DONE',
      title: `Claude edited ${plural(edited.length, 'file')}`,
      sub: openedNote ? `${one ? first.name : names}, ${openedNote}` : names,
      accent: 'orange',
      icon: 'pencil',
      added: openedNote ? 0 : edited.reduce((n, t) => n + t.added, 0),
      removed: openedNote ? 0 : edited.reduce((n, t) => n + t.removed, 0),
    })
    return
  }
  if (opened.length) {
    await setNow($, { ...base, label: 'DONE', title: `Claude read ${plural(opened.length, 'file')}`, sub: 'nothing was changed', accent: 'purple', icon: 'eye' })
    return
  }
  await setNow($, { ...base, label: 'DONE', title: 'Claude answered', sub: 'no files touched', accent: 'grey', icon: 'check' })
}

async function togglePane($: EngineInterface): Promise<string> {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    await $.ui.close({ id: PANE })
    return 'Files pane closed.'
  }
  const project = await read($, projectA)
  await $.ui.open({ id: PANE, title: `Files: ${basename(project || 'project')}` })
  return 'Files pane opened.'
}

// ---------- tree rows ----------

const RANK: Record<TouchStatus, number> = { editing: 6, reading: 5, committed: 4, created: 3, edited: 3, opened: 2 }
const NAME_COLOR: Record<TouchStatus, string> = {
  editing: '#f5a35c',
  reading: '#c9a6ff',
  committed: '#5ee08a',
  created: '#f5a35c',
  edited: '#f5a35c',
  opened: '#c9a6ff',
}
const HIGHLIGHT: Partial<Record<TouchStatus, { bg: string; stroke: string }>> = {
  reading: { bg: '#2f2442', stroke: '#4a3a6b' },
  editing: { bg: '#3d2818', stroke: '#6b4526' },
  committed: { bg: '#18301f', stroke: '#2a5236' },
}
const PILL_TEXT: Partial<Record<TouchStatus, string>> = { reading: 'reading', editing: 'editing', committed: 'committed' }
const CHANGED_COLOR = '#e9c97a'

async function buildRows($: EngineInterface, root: string, view: View, touched: Touched[], gitInfo: GitInfo, nowMs: number): Promise<TreeRow[]> {
  const byKey = new Map(touched.map(t => [t.key, t]))
  const expanded = new Set(view.expanded)
  const rows: TreeRow[] = []
  const gitKeys = Object.keys(gitInfo.files)

  const folderInfo = (dirKey: string) => {
    const prefix = `${dirKey}/`
    let best: Touched | undefined
    for (const t of touched) if (t.key.startsWith(prefix) && (!best || RANK[t.status] > RANK[best.status])) best = t
    const changed = gitInfo.isRepo
      ? gitKeys.filter(k => k.startsWith(prefix)).length
      : touched.filter(t => t.key.startsWith(prefix) && (t.status === 'edited' || t.status === 'created' || t.status === 'editing')).length
    return { best, changed }
  }

  const fileRow = (abs: string, name: string, depth: number, size: number, mtime: number, label = name): TreeRow => {
    const key = keyOf(abs)
    const t = byKey.get(key)
    const g = gitInfo.files[key]
    let nameColor = '#e4e4e7'
    let right: [string, string][] = [[view.showSizes ? fmtSize(size) : fmtTime(mtime, nowMs), '#86868e']]
    let pill: TreeRow['pill']
    if (t) {
      nameColor = NAME_COLOR[t.status]
      const text = PILL_TEXT[t.status]
      if (text) {
        const accent = ACCENT[PILL[t.status].accent]
        pill = { text, fg: accent.fg, bg: accent.bg }
      } else if (t.added || t.removed) {
        right = [[`+${t.added}`, '#7ee787'], [`-${t.removed}`, '#ff7b72']]
      }
    } else if (g) {
      nameColor = CHANGED_COLOR
      if (g.added || g.removed) right = [[`+${g.added}`, '#7ee787'], [`-${g.removed}`, '#ff7b72']]
      else if (g.code.includes('?')) right = [['new', CHANGED_COLOR]]
    }
    return {
      path: norm(abs),
      depth,
      isDir: false,
      isOpen: false,
      name: label,
      nameColor,
      isBold: Boolean(t),
      tag: tagFor(name),
      folderColor: '',
      right,
      pill,
      highlight: t ? HIGHLIGHT[t.status] : undefined,
      isActive: t?.status === 'reading' || t?.status === 'editing',
    }
  }

  if (view.query.trim()) {
    const q = view.query.trim().toLowerCase()
    const walk = async (dir: string, depth: number): Promise<void> => {
      if (rows.length >= 200 || depth > 8) return
      const entries = await $.fs.list(dir).catch(() => [])
      for (const en of entries) {
        if (rows.length >= 200) return
        if (view.hideHidden && en.name.startsWith('.')) continue
        const abs = join(dir, en.name)
        if (en.kind === 'dir') {
          if (!SKIP_DIRS.has(en.name)) await walk(abs, depth + 1)
        } else if (en.name.toLowerCase().includes(q)) {
          rows.push(fileRow(abs, en.name, 0, en.size, en.mtimeMs, relTo(root, abs)))
        }
      }
    }
    await walk(root, 0)
    return rows
  }

  const walk = async (dir: string, depth: number): Promise<void> => {
    const entries = await $.fs.list(dir).catch(() => [])
    const sorted = entries
      .filter(en => !(view.hideHidden && en.name.startsWith('.')))
      .sort((a, b) => ((a.kind === 'dir') === (b.kind === 'dir') ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) : a.kind === 'dir' ? -1 : 1))
    for (const en of sorted) {
      if (rows.length >= MAX_ROWS) return
      const abs = join(dir, en.name)
      if (en.kind !== 'dir') {
        rows.push(fileRow(abs, en.name, depth, en.size, en.mtimeMs))
        continue
      }
      const key = keyOf(abs)
      const isOpen = expanded.has(key)
      const { best, changed } = folderInfo(key)
      const color = best ? NAME_COLOR[best.status] : changed ? CHANGED_COLOR : '#e4e4e7'
      rows.push({
        key,
        depth,
        isDir: true,
        isOpen,
        name: en.name,
        nameColor: color,
        isBold: false,
        folderColor: en.name === '.git' ? '#6e6e76' : best ? color : '#6cb6ff',
        right: changed ? [[`${changed} changed`, best ? NAME_COLOR[best.status] : CHANGED_COLOR]] : [],
        isActive: false,
      })
      if (isOpen) await walk(abs, depth + 1)
    }
  }
  await walk(root, 0)
  return rows
}

// ---------- hooks ----------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'files', description: 'Open or close the Files pane' })
    const project = norm(await $.session.cwd())
    const prev = await read($, projectA)
    await update($, projectA, () => project)
    if (prev !== project) await update($, viewA, () => ({ ...NEW_VIEW, root: project }))
    void refreshGit($).catch(() => undefined)
    void $.ui.open({ id: PANE, title: `Files: ${basename(project)}` }).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: 'files' }, async $ => ({ text: await togglePane($) }))

  on('turn.start', async ($, e, next) => {
    turnSeq += 1
    active.clear()
    shownUntil = 0
    await update($, touchedA, () => [])
    await update($, commitA, () => ({ hash: '', count: 0 }))
    // Following: start each turn tidy; the folders Claude works in open again.
    await update($, viewA, v => (v.follow !== false ? { ...v, expanded: [] } : v))
    await settleNow($)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const tool = String(e.tool)
    const a = e as unknown as Record<string, unknown>
    const file = typeof a.file_path === 'string' ? a.file_path : typeof a.notebook_path === 'string' ? a.notebook_path : ''
    const project = await read($, projectA)
    const id = e.tool_use_id
    const started = await $.clock.now()
    const live = (now: Omit<Now, 'stamp' | 'isLive' | 'label' | 'added' | 'removed'>): Now =>
      ({ ...now, isLive: true, label: 'RIGHT NOW', added: 0, removed: 0, stamp: started })

    if (tool === 'Read' && file) {
      const key = keyOf(file)
      active.set(id, live({ title: `Claude is reading ${basename(file)}`, sub: where(project, file), accent: 'purple', icon: 'eye' }))
      await touch($, file, 'reading')
      await settleNow($)
      try {
        return await next(e)
      } finally {
        active.delete(id)
        await at($, started + HOLD_MS, () => finish($, key, 'reading', 'opened'))
        await settleNow($)
      }
    }

    if (EDIT_TOOLS.has(tool) && file) {
      const key = keyOf(file)
      const before = tool === 'Write' ? await $.fs.read(file).catch(() => null) : null
      const prev = (await read($, touchedA)).find(t => t.key === key)
      active.set(id, live({ title: `Claude is editing ${basename(file)}`, sub: where(project, file), accent: 'orange', icon: 'pencil' }))
      await touch($, file, 'editing')
      await settleNow($)
      let ran: Awaited<ReturnType<typeof next>> | undefined
      try {
        ran = await next(e)
        return ran
      } finally {
        active.delete(id)
        const failed = !ran || ('deny' in ran && ran.deny !== undefined) || (ran as { isError?: boolean }).isError === true
        if (failed) {
          const back: TouchStatus = prev && prev.status !== 'editing' ? prev.status : 'opened'
          await finish($, key, 'editing', back)
        } else {
          await touch($, file, 'editing', editDiff(tool, a, before))
          const isNew = tool === 'Write' && before === null && !prev
          await at($, started + HOLD_MS, () => finish($, key, 'editing', isNew ? 'created' : 'edited'))
        }
        scheduleGit($)
        await settleNow($)
      }
    }

    if (SEARCH_TOOLS.has(tool)) {
      active.set(id, live({ title: 'Claude is searching', sub: clip(`for ${String(a.pattern ?? '')}`, 60), accent: 'blue', icon: 'search' }))
      await settleNow($)
      try {
        return await next(e)
      } finally {
        active.delete(id)
        await settleNow($)
      }
    }

    if (SHELL_TOOLS.has(tool)) {
      const cmd = String(a.command ?? '')
      const desc = typeof a.description === 'string' && a.description ? a.description : cmd
      active.set(id, live({ title: 'Claude is running a command', sub: clip(desc.replace(/\s+/g, ' '), 70), accent: 'blue', icon: 'terminal' }))
      await settleNow($)
      try {
        return await next(e)
      } finally {
        active.delete(id)
        if (isCommitCommand(cmd)) await onCommit($).catch(() => undefined)
        scheduleGit($)
        await settleNow($)
      }
    }

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined) return result
    const seq = turnSeq
    active.clear()
    settleTimer?.cancel()
    settleTimer = undefined
    await at($, shownUntil + 50, async () => {
      if (seq !== turnSeq) return
      await update($, touchedA, list =>
        list.map((t): Touched => (t.status === 'reading' ? { ...t, status: 'opened' } : t.status === 'editing' ? { ...t, status: 'edited' } : t)),
      )
      await doneNow($, e.isAborted)
    })
    scheduleGit($)
    return result
  })

  on('ui.message', async ($, e, next) => {
    const isTree = e.element.startsWith('hit-')
    if (!isTree && !e.element.startsWith('go-')) return next(e)
    const data = e.data as { t?: string; i?: number }
    const i = typeof data?.i === 'number' ? data.i : -1
    if (!isTree) {
      const t = data?.t === 'click' ? (await read($, touchedA))[i] : undefined
      if (t) await reveal($, t)
      return {}
    }
    const row = data?.t === 'click' ? drawnRows[i] : undefined
    if (row?.isDir && row.key) {
      const key = row.key
      await update($, viewA, v => ({
        ...v,
        expanded: v.expanded.includes(key) ? v.expanded.filter(k => k !== key && !k.startsWith(`${key}/`)) : [...v.expanded, key],
      }))
    } else if (row?.path) {
      const project = await read($, projectA)
      const rel = project && isInside(project, row.path) ? relTo(project, row.path) : row.path
      await $.prompt.fill({ text: `@${rel} `, mode: 'insert' }).catch(() => undefined)
    }
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const now = await read($, nowA)
    const touched = await read($, touchedA)
    const gitInfo = await read($, gitA)
    const view = await read($, viewA)
    const project = await read($, projectA)
    const commit = await read($, commitA)
    const root = view.root || project
    const cols = e.props.bodyColumns
    const nowMs = await $.clock.now()
    const rows = root ? await buildRows($, root, view, touched, gitInfo, nowMs) : []

    const setView = (fn: (v: View) => View) => () => void update($, viewA, fn)
    const buttons: [string, () => void][] = [
      ['Refresh', () => void refreshGit($).then(() => update($, viewA, v => ({ ...v }))).catch(() => undefined)],
      ['Collapse all', setView(v => ({ ...v, expanded: [] }))],
      [view.showSizes ? 'Show dates' : 'Show sizes', setView(v => ({ ...v, showSizes: !v.showSizes }))],
      [view.follow !== false ? 'Follow: on' : 'Follow: off', setView(v => ({ ...v, follow: v.follow === false }))],
      ['Project', setView(v => ({ ...v, root: project }))],
      [view.hideHidden ? 'Show hidden' : 'Hide hidden', setView(v => ({ ...v, hideHidden: !v.hideHidden }))],
    ]

    if (e.surface === 'desktop') {
      const { Box, Button, Client, Input, Svg } = $.ui.resolve(e)
      const px = Math.max(300, Math.round(cols * PX_PER_COL))
      const card = nowCard(now, gitInfo, px)
      const list = touchedParts(touched, px)
      const shining = flash && flash.until > nowMs ? flash.key : undefined
      const tree = treeParts(
        shining ? rows.map(r => (rowKey(r) === shining ? { ...r, isFlashing: true } : r)) : rows,
        { left: view.query ? 'MATCHING FILES' : 'ALL FILES', right: basename(root).toUpperCase() },
        commit.hash ? { hash: commit.hash } : null,
        px,
        view.query ? 'No file matches.' : 'This folder is empty.',
      )
      drawnRows = rows.slice(0, MAX_SHOWN)
      // Drawn as plain images: a sandboxed frame (isInteractive) starts at a
      // default size and reloads when scrolled, which made the pane jump.
      const buttonRow = (part: [string, () => void][]) => (
        <Box flexDirection="row">
          {part.map(([label, press]) => (
            <Box width="33%" paddingRight={1}>
              <Button key={`b-${label}`} label={label} onPress={press} />
            </Box>
          ))}
        </Box>
      )
      // Each row is its own picture in its own keyed Box. The app lights the
      // hovered row itself (the lit picture revealed over it), and a click
      // target per row names its row, so nothing depends on pointer positions.
      // The target is taller than a row and clipped to it, wherever the app
      // seats it inside the row. `target` is the Client key: hit-<i> in the
      // tree, go-<i> in the "Claude touched" card.
      const pickRow = (boxKey: string, target: string, i: number, r: { source: string; hover?: string; alt: string }) => (
        <Box key={boxKey} position="relative" flexDirection="column" overflow="hidden">
          <Svg key={`${target}-pic`} source={r.source} alt={r.alt} />
          {r.hover ? (
            <Box position="absolute" top={0} left={0} right={0} bottom={0} display="none" hover={{ display: 'flex' }}>
              <Svg key={`${target}-lit`} source={r.hover} alt={r.alt} />
            </Box>
          ) : null}
          <Box position="absolute" top={0} left={0} right={0} bottom={0}>
            <Client key={target} module="./hit.tsx" props={{ i }} width="100%" height={4} />
          </Box>
        </Box>
      )
      const treeRows = tree.rows.map((r, i) => pickRow(rowKey(drawnRows[i]!), `hit-${i}`, i, r))
      const touchedRows = list.rows.map((r, i) => pickRow(`touched-${i}`, `go-${i}`, i, r))
      return (
        <Box flexDirection="column" gap={1}>
          <Svg key="now" source={card.source} alt={`${now.label}: ${now.title}. ${now.sub}`} />
          <Input key="search" placeholder="Find a file" value={view.query} onInput={value => void update($, viewA, v => ({ ...v, query: value }))} onSubmit={value => void update($, viewA, v => ({ ...v, query: value }))} />
          <Box flexDirection="column" gap={1}>
            {buttonRow(buttons.slice(0, 3))}
            {buttonRow(buttons.slice(3))}
          </Box>
          <Box flexDirection="column">
            <Svg key="touched-top" source={list.top} alt={`Claude touched ${plural(touched.length, 'file')}`} />
            {touchedRows}
            <Svg key="touched-bottom" source={list.bottom} alt="end of the list" />
          </Box>
          <Box flexDirection="column">
            <Svg key="tree-head" source={tree.header} alt={`Files in ${basename(root)}`} />
            {treeRows}
            <Svg key="tree-foot" source={tree.footer} alt={commit.hash ? `committed ${commit.hash}` : 'end of the tree'} />
          </Box>
        </Box>
      )
    }

    // Terminal and other surfaces: the same information as plain text.
    const { Box, Text, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text color={ACCENT[now.accent].fg} bold>{now.label}</Text>
        <Text bold>{now.title}</Text>
        <Text dimColor>{now.sub}</Text>
        {gitInfo.isRepo ? <Text color="#79b8ff">⎇ {gitInfo.branch}  {Object.keys(gitInfo.files).length ? `${Object.keys(gitInfo.files).length} changed` : 'clean'}</Text> : null}
        <Text> </Text>
        <Text dimColor bold>CLAUDE TOUCHED ({touched.length})</Text>
        {touched.map(t => (
          <Text color={NAME_COLOR[t.status]}>
            {t.name} {t.dir ? `· ${t.dir}` : ''} [{PILL[t.status].text}]
          </Text>
        ))}
        <Text> </Text>
        <Box flexDirection="row" flexWrap="wrap" columnGap={1}>
          {buttons.slice(0, 3).map(([label, press]) => (
            <Button key={`b-${label}`} label={label} onPress={press} />
          ))}
        </Box>
        {rows.slice(0, 200).map(r => (
          <Text color={r.nameColor}>
            {' '.repeat(r.depth * 2)}
            {r.isDir ? (r.isOpen ? '▾ ' : '▸ ') : '  '}
            {r.name}
          </Text>
        ))}
      </Box>
    )
  })
}
