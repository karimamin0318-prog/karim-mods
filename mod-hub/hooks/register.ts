import type { CommandInfo, EngineInterface, Register, RenderInput } from 'claude-code'

// One panel for every installed mod: what it does, its views and commands as
// buttons, and an on/off switch. The plugin list comes from the claude CLI,
// read when the panel opens; nothing runs while it is closed.

const SELF = 'mod-hub'
const PANE = 'mod-hub'
const CLAUDE = 'claude'

export type Mod = { id: string; name: string; version: string; enabled: boolean; description: string; isOwn: boolean }
type Action = { key: string; label: string; command: string; args: string; isView: boolean; fill?: boolean }

/** Plain words for the mods we know; any other mod shows its manifest's first sentence. */
const BLURB: Record<string, string> = {
  'cache-tax': 'Warns before an expensive cold-cache message and keeps the cache warm.',
  'done-chime': 'Plays a chime when Claude finishes a longer task.',
  'live-files': 'Files pane: what Claude is doing and the files it touched.',
  'savvy-progress': 'Agents panel: a live view of helper agents.',
  'skins': 'Restyles the chat: colors, spinner, footer words.',
  'crab-buddy': 'A little crab above the prompt: types while Claude works, plays when idle.',
}

/** Commands that open a view, by name, and their button label. */
const VIEWS: Record<string, string> = { files: 'Open Files', 'agents-info': 'Open Agents', skin: 'Skin settings' }

/** Commands that need words after them, as ready-made buttons: [label, args]. */
const PRESETS: Record<string, Array<[string, string]>> = {
  'cache-tax': [['Status', ''], ['Preview', 'preview'], ['Size S', 'size small'], ['Size M', 'size medium'], ['Size L', 'size large']],
  keepwarm: [['Keepwarm status', 'status']],
  chime: [['Test chime', 'test'], ['Chime on', 'on'], ['Chime off', 'off']],
  crab: [['Show / hide', ''], ['Weights', 'weights'], ['Rasengan', 'rasengan'], ['Clones', 'clones'], ['Ball', 'ball'], ['Dance', 'dance'], ['Nap', 'nap'], ['Chill', 'chill'], ['Naruto run', 'naruto'], ['Kamehameha', 'kamehameha'], ['Super Saiyan', 'saiyan'], ['Pistol', 'pistol'], ['Water', 'water'], ['JoJo', 'jojo'], ['Ramen', 'ramen'], ['Sharingan', 'sharingan'], ['Sailor', 'sailor'], ['Onigiri', 'onigiri'], ['Totoro', 'totoro'], ['Titan', 'titan'], ['Ghoul', 'ghoul'], ['Bankai', 'bankai'], ['Stand vs DIO', 'stand'], ['Thunder', 'thunder'], ['Domain', 'domain'], ['One Punch', 'onepunch'], ['Smash', 'smash'], ['Jajanken', 'jajanken'], ['Chainsaw', 'chainsaw'], ['Death Note', 'deathnote'], ['Fusion', 'fusion'], ['No-Face', 'noface'], ['ODM gear', 'odm'], ['Size S', 'size small'], ['Size M', 'size medium'], ['Size L', 'size large']],
}

type Hub = {
  mods: Mod[]
  commands: CommandInfo[]
  loading: boolean
  error: string
  /** Mods switched in this run, which apply after a restart. */
  changed: Set<string>
  busy: string
  /** The gear sits in the skins row this session. */
  inSkins?: boolean
}

export const nameOf = (id: string) => id.split('@')[0] ?? id

/** The first sentence of a manifest description, kept short. */
export function blurb(name: string, description: string): string {
  if (BLURB[name]) return BLURB[name]
  const first = description.split(/(?<=\.)\s/)[0] ?? ''
  return first.length > 110 ? first.slice(0, 107).trimEnd() + '…' : first
}

/** The buttons for one mod: its views first, then its commands. */
export function actionsOf(name: string, commands: readonly CommandInfo[]): Action[] {
  const own = commands.filter(c => c.plugin !== undefined && nameOf(c.plugin) === name)
  const out: Action[] = []
  for (const c of own) {
    const view = VIEWS[c.name] ?? (/\b(pane|panel)\b/i.test(c.description) ? `Open ${c.name}` : undefined)
    if (view) out.push({ key: `${c.name}`, label: view, command: c.name, args: '', isView: true })
  }
  for (const c of own) {
    if (VIEWS[c.name] || out.some(a => a.command === c.name)) continue
    const presets = PRESETS[c.name]
    if (presets) for (const [label, args] of presets) out.push({ key: `${c.name}-${args || 'bare'}`, label, command: c.name, args, isView: false })
    // Anything else may need words after it: it goes into the prompt box to finish.
    else out.push({ key: `${c.name}-fill`, label: `/${c.name}…`, command: c.name, args: '', isView: false, fill: true })
  }
  return out
}

/** `claude plugin list --json` as mods, own (karim-mods) first. */
export function parseList(stdout: string): Array<Omit<Mod, 'description'> & { installPath: string }> {
  const rows = JSON.parse(stdout) as Array<{ id: string; version?: string; enabled?: boolean; installPath?: string }>
  return rows
    .map(r => ({ id: r.id, name: nameOf(r.id), version: r.version ?? '', enabled: r.enabled !== false, installPath: r.installPath ?? '', isOwn: r.id.endsWith('@karim-mods') }))
    .filter(m => m.name !== SELF)
    .sort((a, b) => Number(b.isOwn) - Number(a.isOwn) || a.name.localeCompare(b.name))
}

const why = (err: unknown) => (err instanceof Error ? err.message : String(err))

async function load($: EngineInterface, hub: Hub) {
  hub.loading = true
  hub.error = ''
  $.ui.invalidate('ui.render')
  try {
    const r = await $.process.run([CLAUDE, 'plugin', 'list', '--json'], { timeoutMs: 30000 })
    if (r.exitCode !== 0) throw new Error(r.stderr.trim().split('\n')[0] || `claude exited ${r.exitCode}`)
    const rows = parseList(r.stdout)
    hub.mods = await Promise.all(rows.map(async ({ installPath, ...m }) => {
      let description = ''
      try {
        description = String((JSON.parse(await $.fs.read(`${installPath}/.claude-plugin/plugin.json`)) as { description?: unknown }).description ?? '')
      } catch { /* no manifest to read: the built-in words or nothing */ }
      return { ...m, description: blurb(m.name, description) }
    }))
    hub.commands = (await $.command.list()).filter(c => c.source === 'plugin')
  } catch (err) {
    hub.error = `could not read the mod list: ${why(err)}`
  }
  hub.loading = false
  $.ui.invalidate('ui.render')
}

async function togglePane($: EngineInterface, hub: Hub): Promise<string> {
  if ((await $.ui.panes()).some(p => p.id === PANE)) {
    await $.ui.close({ id: PANE })
    return 'Mods panel closed.'
  }
  await $.ui.open({ id: PANE, title: 'Mods' })
  void load($, hub)
  return 'Mods panel opened.'
}

async function toggleMod($: EngineInterface, hub: Hub, mod: Mod) {
  if (hub.busy) return
  hub.busy = mod.name
  $.ui.invalidate('ui.render')
  const verb = mod.enabled ? 'disable' : 'enable'
  try {
    const r = await $.process.run([CLAUDE, 'plugin', verb, mod.id], { timeoutMs: 60000 })
    if (r.exitCode !== 0) throw new Error(r.stderr.trim().split('\n')[0] || `claude exited ${r.exitCode}`)
    mod.enabled = !mod.enabled
    if (hub.changed.has(mod.name)) hub.changed.delete(mod.name)
    else hub.changed.add(mod.name)
    $.ui.toast(`${mod.name} turned ${mod.enabled ? 'on' : 'off'}. Restart the app to apply.`)
  } catch (err) {
    $.ui.toast(`mod-hub: could not ${verb} ${mod.name} (${why(err)}). In a terminal: claude plugin ${verb} ${mod.id}`)
  }
  hub.busy = ''
  $.ui.invalidate('ui.render')
}

async function act($: EngineInterface, a: Action) {
  if (a.fill) {
    await $.prompt.fill({ text: `/${a.command} ` }).catch(() => undefined)
    return
  }
  try {
    const r = await $.command.run({ command: a.command, args: a.args })
    if (r.text && !a.isView) $.ui.toast(r.text.length > 300 ? r.text.slice(0, 297) + '…' : r.text)
  } catch (err) {
    $.ui.toast(`mod-hub: /${a.command} ${a.args} failed (${why(err)})`)
  }
}

const GREEN = '#4ade80'
const RED = '#f87171'
const GREY = '#8e8e96'
const ORANGE = '#e8875f'

/** Each mod's own color, picked to fit what it does; any other mod gets one from the spare set by its name. */
const COLOR: Record<string, string> = {
  'cache-tax': '#5ab0ff', // ice blue: a cold or warm cache
  'done-chime': '#f5b83d', // gold: a bell
  'live-files': '#a78bfa', // violet: the files pane
  'savvy-progress': '#ff8a65', // crab coral: the agents' crabs
  'skins': '#f472b6', // pink: paint and style
  'crab-buddy': '#2dd4bf', // teal: sea water for the crab
}
const SPARE = ['#22d3ee', '#facc15', '#c084fc', '#2dd4bf', '#fb923c', '#e879f9']

export function colorOf(name: string): string {
  if (COLOR[name]) return COLOR[name]
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return SPARE[h % SPARE.length]!
}

function modCard($: EngineInterface, hub: Hub, e: RenderInput<'Pane'>, mod: Mod) {
  const { Box, Button, Text } = $.ui.resolve(e)
  const pending = hub.changed.has(mod.name)
  const color = colorOf(mod.name)
  const actions = mod.enabled && !pending ? actionsOf(mod.name, hub.commands) : []
  const state = hub.busy === mod.name ? 'switching…' : pending ? `${mod.enabled ? 'on' : 'off'} after restart` : mod.enabled ? 'on' : 'off'
  const stateColor = pending ? ORANGE : mod.enabled ? GREEN : RED
  // The switch says what a press does: red to turn off, green to turn on.
  const pill = mod.enabled ? RED : GREEN
  return Box({
    key: `mh-card-${mod.name}`,
    flexDirection: 'column',
    borderStyle: 'round',
    borderColor: mod.enabled ? color : GREY,
    paddingX: 1,
    children: [
      Box({ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', children: [
        Text({ children: [
          Text({ bold: true, color: stateColor, children: ['● '] }),
          Text({ bold: true, color, children: [mod.name] }),
          Text({ dimColor: true, children: [`  v${mod.version} · `] }),
          Text({ color: stateColor, children: [state] }),
        ] }),
        Box({ key: `mh-pill-${mod.name}`, borderStyle: 'round', borderColor: pill, flexShrink: 0, children: [
          Button({ key: `mh-toggle-${mod.name}`, label: mod.enabled ? 'Turn off' : 'Turn on', hover: { color: pill }, onPress: () => void toggleMod($, hub, mod) }),
        ] }),
      ] }),
      ...(mod.description ? [Text({ dimColor: true, children: [mod.description] })] : []),
      ...(actions.length ? [Box({ flexDirection: 'row', flexWrap: 'wrap', gap: 1, children: actions.map(a =>
        Button({ key: `mh-${mod.name}-${a.key}`, label: a.label, hover: { color }, ...(a.isView ? { variant: 'primary' as const } : {}), onPress: () => void act($, a) })) })] : []),
    ],
  })
}

function panel($: EngineInterface, hub: Hub, e: RenderInput<'Pane'>) {
  const { Box, Button, Text } = $.ui.resolve(e)
  const on = hub.mods.filter(m => m.enabled).length
  const head = Box({ flexDirection: 'row', justifyContent: 'space-between', children: [
    Text({ children: [Text({ bold: true, children: ['Mods'] }), Text({ dimColor: true, children: [hub.mods.length ? `  ${on} of ${hub.mods.length} on` : ''] })] }),
    Button({ key: 'mh-refresh', label: hub.loading ? 'Loading…' : 'Refresh', dimColor: true, onPress: () => void load($, hub) }),
  ] })
  const notes = [
    ...(hub.changed.size ? [Box({ key: 'mh-restart', borderStyle: 'round', borderColor: ORANGE, paddingX: 1, children: [Text({ color: ORANGE, children: [`Restart the app to apply: ${[...hub.changed].join(', ')}`] })] })] : []),
    ...(hub.error ? [Text({ color: ORANGE, children: [hub.error] })] : []),
    ...(!hub.mods.length && hub.loading ? [Text({ dimColor: true, children: ['Reading your mods…'] })] : []),
  ]
  return Box({ flexDirection: 'column', gap: 1, children: [head, ...notes, ...hub.mods.map(m => modCard($, hub, e, m))] })
}

type Node = { type?: string; props?: { key?: unknown; label?: unknown; flexGrow?: unknown; source?: unknown; [k: string]: unknown }; children?: unknown }

const isCompact = (x: unknown) => {
  const n = x as Node | null
  return n?.type === 'Button' && (/compact$/i.test(String(n.props?.key ?? '')) || /^compact/i.test(String(n.props?.label ?? '')))
}
// The skins row keeps an empty flexGrow Box between its meters and its button.
const isSpacer = (x: unknown) => {
  const n = x as Node | null
  return n?.type === 'Box' && n.props?.flexGrow === 1 && (n.children === undefined || (Array.isArray(n.children) && n.children.length === 0))
}

/**
 * Another mod's band tree with `extra` put right after its Compact button, or, while
 * that button hides (a turn is running), at the end of the row it sits in; undefined
 * when the tree has neither. `fixRow` reshapes that row. Copies only the path it changes.
 */
export function besideCompact<T>(tree: T, extra: unknown, fixRow: (row: Node) => Node = row => row): T | undefined {
  const walk = (x: unknown, test: (y: unknown) => boolean, atEnd: boolean): unknown => {
    if (Array.isArray(x)) {
      const i = x.findIndex(test)
      if (i >= 0) return atEnd ? [...x, extra] : [...x.slice(0, i + 1), extra, ...x.slice(i + 1)]
      for (let j = 0; j < x.length; j++) {
        const sub = walk(x[j], test, atEnd)
        if (sub !== undefined) return x.map((v, m) => (m === j ? sub : v))
      }
      return undefined
    }
    const n = x as Node | null
    if (!n || typeof n !== 'object' || n.children === undefined) return undefined
    const kids = n.children
    const sub = Array.isArray(kids) ? walk(kids, test, atEnd) : walk([kids], test, atEnd)
    if (sub === undefined) return undefined
    const isRow = (Array.isArray(kids) ? kids : [kids]).some(test)
    return isRow ? fixRow({ ...n, children: sub }) : { ...n, children: sub }
  }
  return (walk(tree, isCompact, false) ?? walk(tree, isSpacer, true)) as T | undefined
}

/**
 * The skins meters with the empty strip above their ring cut off, set at the row's
 * top: the ring then sits as far from the band's top as from its side. Anything
 * else, or a meter picture of another shape, stays as it is.
 */
export function meterToCorner(x: unknown): unknown {
  const n = x as Node | null
  const source = n?.props?.source
  if (n?.type !== 'Svg' || typeof source !== 'string') return x
  const cropped = source.replace(/ height="30" viewBox="0 0 (\d+) 30"/, ' height="21" viewBox="0 4.5 $1 21"')
  if (cropped === source) return x
  return { type: 'Box', props: { alignSelf: 'flex-start' }, children: [{ ...n, props: { ...n.props, source: cropped, height: 21 } }] }
}

/** The skins row keeps room for the terminal's [-]; the desktop has none, so its row reaches the band's edge. */
const toDesktopCorners = (row: Node): Node => ({
  ...row,
  props: { ...row.props, paddingRight: 0 },
  children: Array.isArray(row.children) ? row.children.map(meterToCorner) : row.children,
})

/** The gear that opens the Mods panel. */
function gear($: EngineInterface, hub: Hub, e: RenderInput<'AbovePrompt'>) {
  return $.ui.resolve(e).Button({ key: 'mh-open', label: '⚙', dimColor: true, onPress: () => void togglePane($, hub) })
}

export const register: Register = on => {
  const hub: Hub = { mods: [], commands: [], loading: false, error: '', changed: new Set(), busy: '', inSkins: false }

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.command.register({ name: 'mods', description: 'Open or close the Mods panel: every mod, its views and commands, on/off (mod-hub)' })
    return r
  })

  on('command.run', { command: 'mods' }, async $ => ({ text: await togglePane($, hub) }))

  // One small button above the prompt; the panel holds the rest.
  // Each mod draws its own row of the band, so the gear joins the skins row from a hook
  // on that row, and mod-hub's own row shows the gear only while the skins row has no place for it.
  on('ui.render', { component: 'AbovePrompt', plugin: 'skins' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return rest
    const placed = besideCompact(rest, gear($, hub, e), e.surface === 'desktop' ? toDesktopCorners : undefined)
    if ((placed !== undefined) !== hub.inSkins) {
      hub.inSkins = placed !== undefined
      $.ui.invalidate('ui.render')
    }
    return placed ?? rest
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (hub.inSkins || e.surface !== 'terminal' && e.surface !== 'desktop') return rest
    const { Box } = $.ui.resolve(e)
    return Box({ flexDirection: 'column', children: [
      rest,
      Box({ flexDirection: 'row', justifyContent: 'flex-end', children: [gear($, hub, e)] }),
    ] })
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => panel($, hub, e))
}
