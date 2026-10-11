// Pure helpers: paths, file tags, line counts, git output parsing, formatting.

export const norm = (p: string): string => p.replace(/\\/g, '/').replace(/(.)\/+$/, '$1')
export const keyOf = (p: string): string => norm(p).toLowerCase()
export const join = (dir: string, name: string): string => `${norm(dir)}/${name}`

export function basename(p: string): string {
  const n = norm(p)
  return n.slice(n.lastIndexOf('/') + 1)
}

export function dirname(p: string): string {
  const n = norm(p)
  const cut = n.lastIndexOf('/')
  if (cut <= 0) return n
  const parent = n.slice(0, cut)
  return /^[A-Za-z]:$/.test(parent) ? `${parent}/` : parent
}

export function isInside(root: string, p: string): boolean {
  const r = keyOf(root)
  const k = keyOf(p)
  return k === r || k.startsWith(r.endsWith('/') ? r : `${r}/`)
}

/** Path of `p` relative to `root`, forward slashes; `p` itself when outside. */
export function relTo(root: string, p: string): string {
  if (!isInside(root, p)) return norm(p)
  const r = norm(root)
  return norm(p).slice(r.length).replace(/^\/+/, '')
}

/** Ancestor folders of `p` strictly below `root`, outermost first. */
export function ancestors(root: string, p: string): string[] {
  if (!isInside(root, p)) return []
  const parts = relTo(root, p).split('/').slice(0, -1)
  const out: string[] = []
  let cur = norm(root)
  for (const part of parts) {
    cur = join(cur, part)
    out.push(cur)
  }
  return out
}

function lines(text: string): string[] {
  if (text === '') return []
  return text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')
}

/** Lines added and removed going from `before` to `after`, counted as multisets. */
export function lineDiff(before: string, after: string): { added: number; removed: number } {
  const counts = new Map<string, number>()
  for (const line of lines(before)) counts.set(line, (counts.get(line) ?? 0) + 1)
  let added = 0
  for (const line of lines(after)) {
    const left = counts.get(line) ?? 0
    if (left > 0) counts.set(line, left - 1)
    else added += 1
  }
  let removed = 0
  for (const left of counts.values()) removed += left
  return { added, removed }
}

export type Tag = { label: string; color: string; bg: string }

const ENV: Tag = { label: 'ENV', color: '#e9c46a', bg: '#3a3320' }

/** Extensions (space-separated) → label, text colour, background. */
const TAGS: Record<string, Tag> = { env: ENV }
for (const [exts, label, color, bg] of [
  ['js mjs cjs', 'JS', '#e9c46a', '#3a3320'],
  ['jsx', 'JSX', '#61dafb', '#1d3540'],
  ['ts', 'TS', '#6cb6ff', '#1f2f42'],
  ['tsx', 'TSX', '#6cb6ff', '#1f2f42'],
  ['json webmanifest', '{ }', '#8bd17c', '#243320'],
  ['md', 'MD', '#6cb6ff', '#1f2d3d'],
  ['pdf', 'PDF', '#ff7b72', '#3d2224'],
  ['csv', 'CSV', '#8bd17c', '#243320'],
  ['doc docx', 'DOC', '#6cb6ff', '#1f2d3d'],
  ['xls xlsx', 'XLS', '#5ee08a', '#1d3b27'],
  ['html htm', 'HTML', '#f0883e', '#3d2a1c'],
  ['css', 'CSS', '#79b8ff', '#1f2d3d'],
  ['php', 'PHP', '#b392f0', '#2e2540'],
  ['py', 'PY', '#6cb6ff', '#1f2d3d'],
  ['png jpg jpeg gif webp', 'IMG', '#d2a8ff', '#2e2540'],
  ['svg', 'SVG', '#ffab70', '#3d2a1c'],
  ['txt', 'TXT', '#b0b0b8', '#2c2c30'],
  ['bat', 'BAT', '#8bd17c', '#243320'],
  ['ps1', 'PS', '#79b8ff', '#1f2d3d'],
  ['sh', 'SH', '#8bd17c', '#243320'],
  ['lock', 'LOCK', '#8b8b93', '#2a2a2e'],
  ['yml yaml', 'YML', '#ff7b72', '#3d2224'],
  ['sql', 'SQL', '#e9c46a', '#3a3320'],
] as const) {
  for (const ext of exts.split(' ')) TAGS[ext] = { label, color, bg }
}

export function tagFor(name: string): Tag {
  const lower = name.toLowerCase()
  if (lower.startsWith('.git')) return { label: 'GIT', color: '#f0883e', bg: '#3d2a1c' }
  if (lower.startsWith('.env')) return ENV
  if (lower === '.htaccess') return { label: 'CFG', color: '#b0b0b8', bg: '#2c2c30' }
  const dot = lower.lastIndexOf('.')
  const ext = dot > 0 ? lower.slice(dot + 1) : ''
  return TAGS[ext] ?? { label: ext ? ext.slice(0, 3).toUpperCase() : 'FILE', color: '#a1a1a8', bg: '#2a2a2e' }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "15:40" for today, "20 Sep" otherwise. */
export function fmtTime(ms: number, nowMs: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  const n = new Date(nowMs)
  const isToday = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
  if (isToday) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type StatusLine = { branch: string; ahead: number; entries: { code: string; path: string }[] }

/** Parses `git status --porcelain=v1 -b`. */
export function parseStatus(text: string): StatusLine {
  let branch = ''
  let ahead = 0
  const entries: { code: string; path: string }[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue
    if (line.startsWith('## ')) {
      const head = line.slice(3)
      const noCommits = head.match(/^No commits yet on (.+)$/)
      branch = noCommits?.[1] ?? head.split('...')[0]?.split(' ')[0] ?? ''
      if (branch === 'HEAD') branch = 'detached'
      const m = head.match(/ahead (\d+)/)
      ahead = m ? Number(m[1]) : 0
      continue
    }
    const code = line.slice(0, 2)
    let path = line.slice(3)
    const arrow = path.indexOf(' -> ')
    if (arrow >= 0) path = path.slice(arrow + 4)
    entries.push({ code, path: path.replace(/^"(.*)"$/, '$1') })
  }
  return { branch, ahead, entries }
}

/** Parses `git diff --numstat` into per-path added/removed counts. */
export function parseNumstat(text: string): Record<string, { added: number; removed: number }> {
  const out: Record<string, { added: number; removed: number }> = {}
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/)
    if (!m) continue
    const [, plus = '-', minus = '-', raw = ''] = m
    // A rename reads `a/{old => new}/b` or `old => new`: count it under the new path.
    const brace = raw.match(/^(.*)\{.* => (.*)\}(.*)$/)
    const path = brace ? `${brace[1]}${brace[2]}${brace[3]}` : (raw.split(' => ')[1] ?? raw)
    const prev = out[path] ?? { added: 0, removed: 0 }
    out[path] = {
      added: prev.added + (plus === '-' ? 0 : Number(plus)),
      removed: prev.removed + (minus === '-' ? 0 : Number(minus)),
    }
  }
  return out
}

export const isCommitCommand = (cmd: string): boolean => /\bgit\b[^\n|;&]*\bcommit\b/.test(cmd)

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function clip(text: string, max: number): string {
  if (max <= 1) return text.slice(0, Math.max(0, max))
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}
