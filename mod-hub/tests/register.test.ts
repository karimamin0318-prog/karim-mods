import { describe, expect, test } from 'claude-code/testing'
import type { CommandRunInput, On, RenderPropsOf, SessionStartInput } from 'claude-code'

import { actionsOf, besideCompact, blurb, colorOf, meterToCorner, parseList } from '../hooks/register'

const session: SessionStartInput = { surface: 'desktop', isInteractive: true, cwd: '/work' }
const PANE_PROPS = { title: 'Mods', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} } as never
const bandProps: RenderPropsOf['AbovePrompt'] = { bodyColumns: 80 } as never
const run = (command: string, args = ''): CommandRunInput => ({ command, args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

const LIST = [
  { id: 'cache-tax@karim-mods', version: '2.6.1', enabled: true, installPath: '/c/cache-tax' },
  { id: 'live-files@karim-mods', version: '0.1.0', enabled: true, installPath: '/c/live-files' },
  { id: 'skins@hellosverre-mods', version: '0.2.0', enabled: false, installPath: '/c/skins' },
  { id: 'savvy-progress@claude-kit', version: '1.2.0', enabled: true, installPath: '/c/savvy' },
  { id: 'mod-hub@karim-mods', version: '0.1.0', enabled: true, installPath: '/c/mod-hub' },
]

const COMMANDS = [
  { name: 'cache-tax', description: 'cache state', source: 'plugin' as const, plugin: 'cache-tax' },
  { name: 'keepwarm', description: 'keep warm', source: 'plugin' as const, plugin: 'cache-tax' },
  { name: 'files', description: 'Open or close the Files pane', source: 'plugin' as const, plugin: 'live-files' },
  { name: 'agents-info', description: 'Toggle the agents panel', source: 'plugin' as const, plugin: 'savvy-progress' },
  { name: 'mods', description: 'this', source: 'plugin' as const, plugin: 'mod-hub' },
  { name: 'compact', description: 'built in', source: 'builtin' as const },
]

function world(on: On, opts: { failToggle?: boolean; skinsRow?: 'compact' | 'working' } = {}) {
  const argvs: string[][] = []
  const ran: string[] = []
  const toasts: string[] = []
  const fills: string[] = []
  const open = new Set<string>()
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('command.list', () => ({ value: COMMANDS }))
  on('command.run', ($, e) => { ran.push(`${e.command} ${e.args}`.trim()); return { text: `ran ${e.command}` } })
  on('process.run', ($, e) => {
    argvs.push([...e.argv])
    const out = (exitCode: number, stdout: string, stderr = '') => ({ value: { exitCode, stdout, stderr, isStdoutTruncated: false, isStderrTruncated: false } })
    if (e.argv[2] === 'list') return out(0, JSON.stringify(LIST))
    return opts.failToggle ? out(1, '', 'nope') : out(0, 'ok')
  })
  on('fs.read', ($, e) => ({ value: JSON.stringify({ description: `Manifest of ${String(e.path).split('/')[2]}. More words.` }) }) as never)
  on('ui.open', ($, e) => { open.add(e.id); return { value: { isPlaced: true } } })
  on('ui.close', ($, e) => { open.delete(e.id); return { value: undefined } })
  on('ui.panes', () => ({ value: [...open].map(id => ({ id, title: id, isPlaced: true })) }) as never)
  on('ui.toast', ($, e) => { toasts.push(e.text); return { value: undefined } })
  on('prompt.fill', ($, e) => { fills.push(e.text); return { isFilled: true } })
  on('ui.render', ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    if (!opts.skinsRow) return Text({ children: [''] })
    // Shaped like the skins mod's usage row: meters, a spacer, then Compact (hidden mid-turn).
    return Box({ flexDirection: 'column', children: [Box({ flexDirection: 'row', children: [
      Text({ children: ['19% context'] }),
      Box({ flexGrow: 1 }),
      ...(opts.skinsRow === 'compact' ? [Button({ key: 'compact', label: 'Compact', onPress: () => undefined })] : []),
    ] })] })
  })
  return { argvs, ran, toasts, fills, open }
}

const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }

describe('mod-hub', () => {
  test('the band shows a Mods button that opens the panel; /mods toggles it', async ($, on) => {
    const w = world(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    expect((await band.find({ key: 'mh-open' }))?.props.label).toBe('⚙')
    await band.press({ key: 'mh-open' })
    await settle()
    expect(w.open.has('mod-hub')).toBe(true)
    expect((await $.command.run(run('mods'))).text).toBe('Mods panel closed.')
    expect(w.open.has('mod-hub')).toBe(false)
    expect((await $.command.run(run('mods'))).text).toBe('Mods panel opened.')
  })

  test('the panel lists every mod but itself, own first, with words, buttons and switches', async ($, on) => {
    const w = world(on)
    await $.session.start(session)
    await $.command.run(run('mods'))
    await settle()
    const ui = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'Pane', requestId: 'mod-hub', props: PANE_PROPS })
    const d = JSON.stringify(await ui.drawn())
    expect(d.indexOf('mh-card-cache-tax')).toBeLessThan(d.indexOf('mh-card-savvy-progress'))
    expect(d).not.toContain('mh-card-mod-hub')
    expect(d).not.toContain('mh-toggle-mod-hub')
    expect(d).toContain('Warns before an expensive cold-cache message')
    expect(d).toContain('3 of 4 on')
    // A mod that is off shows its switch and no command buttons.
    expect(await ui.find({ key: 'mh-toggle-skins' })).toBeDefined()
    expect(d).not.toContain('mh-skins-')
    await ui.press({ key: 'mh-live-files-files' })
    await ui.press({ key: 'mh-savvy-progress-agents-info' })
    await ui.press({ key: 'mh-cache-tax-cache-tax-size small' })
    expect(w.ran).toEqual(['files', 'agents-info', 'cache-tax size small'])
  })

  test('each mod has its own color; the switch is red to turn off and green to turn on', async ($, on) => {
    world(on)
    await $.session.start(session)
    await $.command.run(run('mods'))
    await settle()
    const ui = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'Pane', requestId: 'mod-hub', props: PANE_PROPS })
    expect((await ui.find({ key: 'mh-card-cache-tax' }))?.props.borderColor).toBe(colorOf('cache-tax'))
    expect(colorOf('done-chime')).toBe('#f5b83d')
    expect(new Set(['cache-tax', 'done-chime', 'live-files', 'savvy-progress', 'skins'].map(colorOf)).size).toBe(5)
    expect((await ui.find({ key: 'mh-pill-cache-tax' }))?.props.borderColor).toBe('#f87171')
    expect((await ui.find({ key: 'mh-pill-skins' }))?.props.borderColor).toBe('#4ade80')
    expect(colorOf('some-new-mod')).toMatch(/^#[0-9a-f]{6}$/)
  })

  test('turning a mod off runs claude plugin disable and asks for a restart', async ($, on) => {
    const w = world(on)
    await $.session.start(session)
    await $.command.run(run('mods'))
    await settle()
    const ui = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'Pane', requestId: 'mod-hub', props: PANE_PROPS })
    await ui.press({ key: 'mh-toggle-live-files' })
    await settle()
    expect(w.argvs.at(-1)).toEqual(['claude', 'plugin', 'disable', 'live-files@karim-mods'])
    const d = JSON.stringify(await ui.drawn())
    expect(d).toContain('Restart the app to apply: live-files')
    expect(d).toContain('off after restart')
    expect(w.toasts.at(-1)).toMatch(/live-files turned off/)
  })

  test('a failed switch says how to do it by hand and changes nothing', async ($, on) => {
    const w = world(on, { failToggle: true })
    await $.session.start(session)
    await $.command.run(run('mods'))
    await settle()
    const ui = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'Pane', requestId: 'mod-hub', props: PANE_PROPS })
    await ui.press({ key: 'mh-toggle-skins' })
    await settle()
    expect(w.toasts.at(-1)).toMatch(/claude plugin enable skins@hellosverre-mods/)
    expect(JSON.stringify(await ui.drawn())).not.toContain('Restart the app')
  })
})

describe('helpers', () => {
  test('views first, presets as buttons, unknown commands go to the prompt box', () => {
    const cmds = [
      { name: 'files', description: 'Open or close the Files pane', source: 'plugin' as const, plugin: 'live-files@karim-mods' },
      { name: 'odd', description: 'needs words', source: 'plugin' as const, plugin: 'live-files' },
    ]
    expect(actionsOf('live-files', cmds).map(a => [a.label, a.isView, a.fill ?? false])).toEqual([['Open Files', true, false], ['/odd…', false, true]])
    expect(actionsOf('cache-tax', COMMANDS).map(a => a.label)).toEqual(['Status', 'Preview', 'Size S', 'Size M', 'Size L', 'Keepwarm status'])
  })

  test('the plugin list puts own mods first and leaves the hub out', () => {
    expect(parseList(JSON.stringify(LIST)).map(m => m.name)).toEqual(['cache-tax', 'live-files', 'savvy-progress', 'skins'])
  })

  test('an unknown mod shows its manifest\'s first sentence', () => {
    expect(blurb('other', 'Does a thing. Then more.')).toBe('Does a thing.')
    expect(blurb('done-chime', 'x')).toMatch(/chime/)
  })
})

describe('mod-hub band', () => {
  for (const row of ['compact', 'working'] as const) {
    test(`the Mods button joins the skins row (${row})`, async ($, on) => {
      world(on, { skinsRow: row })
      await $.session.start(session)
      const band = await $.ui.mount({ plugin: 'mod-hub', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
      const d = JSON.stringify(await band.drawn())
      // One row only: the Mods button sits in the same children list as the meters.
      expect(d).toMatch(row === 'compact' ? /"compact".*"mh-open"/ : /19% context.*"mh-open"/)
      expect(d).not.toContain('"justifyContent":"flex-end"')
      expect(await band.find({ key: 'mh-open' })).toBeDefined()
    })
  }

  test('without a skins row it keeps a row of its own', () => {
    expect(besideCompact({ type: 'Text', children: ['hi'] }, 'x')).toBeUndefined()
  })

  test('fixRow reshapes the row holding Compact, and only there', () => {
    const compact = { type: 'Button', props: { key: 'compact' } }
    const row = { type: 'Box', props: { flexDirection: 'row', paddingRight: 5 }, children: [compact] }
    const tree = { type: 'Box', props: { flexDirection: 'column', paddingRight: 3 }, children: [row] }
    expect(besideCompact(tree, 'x', row => ({ ...row, props: { ...row.props, paddingRight: 0 } }))).toEqual({
      ...tree,
      children: [{ ...row, props: { flexDirection: 'row', paddingRight: 0 }, children: [compact, 'x'] }],
    })
    expect(besideCompact(tree, 'x')?.children[0]?.props.paddingRight).toBe(5)
  })

  test('the meters lose the empty strip above their ring and sit at the row top', () => {
    const svg = { type: 'Svg', props: { alt: '14% context', height: 30, source: '<svg xmlns="x" width="396" height="30" viewBox="0 0 396 30"><circle cy="15"/></svg>' } }
    expect(meterToCorner(svg)).toEqual({
      type: 'Box',
      props: { alignSelf: 'flex-start' },
      children: [{ type: 'Svg', props: { alt: '14% context', height: 21, source: '<svg xmlns="x" width="396" height="21" viewBox="0 4.5 396 21"><circle cy="15"/></svg>' } }],
    })
    // Not the picture it knows: left alone.
    const other = { type: 'Svg', props: { source: '<svg height="40"></svg>' } }
    expect(meterToCorner(other)).toBe(other)
    expect(meterToCorner('text')).toBe('text')
  })
})
