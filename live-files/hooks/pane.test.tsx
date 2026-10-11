import { describe, expect, mock, test } from 'claude-code/testing'

const ROOT = 'C:/demo'
const T = new Date(2026, 9, 10, 15, 40).getTime()
const PROPS = {
  title: 'Files',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 60 },
  view: {},
} as never

const DIRS: Record<string, [string, 'dir' | 'file'][]> = {
  'c:/demo': [['src', 'dir'], ['tests', 'dir'], ['package.json', 'file'], ['.gitignore', 'file']],
  'c:/demo/src': [['api', 'dir'], ['index.js', 'file']],
  'c:/demo/src/api': [['client.js', 'file'], ['stations.js', 'file']],
  'c:/demo/tests': [['client.test.js', 'file']],
}

function world(on: any, run?: (argv: string[]) => string, tool: object = { result: 'ok' }) {
  const clock = mock.clock(on, { now: T })
  on('session.start', async (_$: unknown, e: unknown) => e)
  on('session.cwd', async () => ({ value: ROOT }))
  on('command.register', async () => ({ value: undefined }))
  on('ui.open', async () => ({ value: { isPlaced: true } }))
  on('process.run', async (_$: unknown, e: { argv: string[] }) => run ? { value: { exitCode: 0, stdout: run(e.argv), stderr: '' } } : { value: { exitCode: 1, stdout: '', stderr: 'no git' } })
  on('fs.read', async () => ({ value: 'export const MAX_RETRIES = 2;\n' }))
  on('fs.list', async (_$: unknown, e: { path?: string }) => {
    const key = String(e.path ?? ROOT).replace(/\\/g, '/').toLowerCase()
    return { value: (DIRS[key] ?? []).map(([name, kind]) => ({ name, kind, size: 120, mtimeMs: T, isLink: false })) }
  })
  on('turn.start', async (_$: unknown, e: { turnId: string }) => ({ turnId: e.turnId }))
  on('tool.call', async () => tool)
  return clock
}

describe('live-files pane', () => {
  test('draws on the desktop and the terminal after Claude reads a file', async ($, on) => {
    world(on)
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'look', turnId: 't1' })
    await $.tool.call({ tool: 'Read', file_path: 'C:/demo/src/api/client.js' } as never)

    for (const surface of ['desktop', 'terminal'] as const) {
      const ui = await $.ui.mount({ plugin: 'live-files', surface, component: 'Pane', requestId: 'live-files', props: PROPS })
      const drawn = JSON.stringify(await ui.drawn())
      expect(drawn).toContain(surface === 'desktop' ? 'Claude touched 1 file' : 'client.js')
      await ui.unmount()
    }
  })

  test('each row has its own click target and a lit picture for hover', async ($, on) => {
    world(on)
    await $.session.start({ cwd: ROOT } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).not.toContain('client.test.js')
    // Rows: src, tests, .gitignore, package.json; each with its own target and lit picture.
    for (const i of [0, 1, 2, 3]) expect(drawn).toContain(`hit-${i}`)
    expect(drawn).toContain('#26262b')
    // Row 1 is tests: a click anywhere on its target opens it, a second closes it.
    const at = { x: 5, y: 0, in: 'hit-1' }
    await ui.pointer({ type: 'down', button: 'left', ...at })
    expect(JSON.stringify(await ui.drawn())).toContain('client.test.js')
    await ui.pointer({ type: 'up', button: 'left', ...at })
    await ui.pointer({ type: 'down', button: 'left', x: 30, y: 2, in: 'hit-1' })
    expect(JSON.stringify(await ui.drawn())).not.toContain('client.test.js')
    await ui.unmount()
  })

  test('a click on a file in the touched card opens the tree to it', async ($, on) => {
    const clock = world(on)
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'look', turnId: 't1' })
    await $.tool.call({ tool: 'Read', file_path: 'C:/demo/src/api/client.js' } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    await ui.press({ key: 'b-Collapse all' })
    let drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('go-0')
    expect(drawn).not.toContain('stations.js')

    await ui.pointer({ type: 'down', button: 'left', x: 3, y: 0, in: 'go-0' })
    await clock.advance(500)
    drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('stations.js')
    // The file's row shines for a moment.
    expect(drawn).toContain('at:c:/demo/src/api/client.js')
    expect(drawn).toContain('fring')
    // It still shines after three seconds and is plain again after four.
    await clock.advance(2500)
    expect(JSON.stringify(await ui.drawn())).toContain('fring')
    await clock.advance(1500)
    expect(JSON.stringify(await ui.drawn())).not.toContain('fring')
    await ui.unmount()
  })

  test('a click on a file row puts @path in the message box', async ($, on) => {
    world(on)
    const filled: string[] = []
    on('prompt.fill', async (_$: unknown, e: { text: string }) => {
      filled.push(e.text)
      return { isFilled: true }
    })
    await $.session.start({ cwd: ROOT } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    // Rows: src, tests, .gitignore, package.json.
    await ui.pointer({ type: 'down', button: 'left', x: 3, y: 0, in: 'hit-3' })
    expect(filled).toEqual(['@package.json '])
    await ui.unmount()
  })

  test('the search box lists matching files from every folder', async ($, on) => {
    world(on)
    await $.session.start({ cwd: ROOT } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    await ui.input({ key: 'search', text: 'client' })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('MATCHING FILES')
    expect(drawn).toContain('src/api/client.js')
    expect(drawn).toContain('tests/client.test.js')
    expect(drawn).not.toContain('stations.js')
    await ui.unmount()
  })

  test('an edit that fails leaves the file as it was', async ($, on) => {
    world(on, undefined, { deny: 'refused' })
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'edit', turnId: 't1' })
    await $.tool.call({ tool: 'Edit', file_path: 'C:/demo/src/index.js', old_string: 'a', new_string: 'b' } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('index.js, Opened')
    expect(drawn).not.toContain('Edited')
    await ui.unmount()
  })

  test('follow mode moves the tree to a folder outside the project', async ($, on) => {
    world(on)
    on('fs.exists', async (_$: unknown, e: { path: string }) => ({ value: e.path.replace(/\\/g, '/').toLowerCase() === 'c:/mods/live/.claude-plugin' }))
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'edit the mod', turnId: 't1' })
    await $.tool.call({ tool: 'Read', file_path: 'C:\\mods\\live\\hooks\\register.tsx' } as never)
    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('LIVE')
    expect(drawn).toContain('Follow: on')
    await ui.unmount()
  })

  test('the tree opens the touched file folders, highlights the row and stays small', async ($, on) => {
    world(on)
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'look', turnId: 't1' })
    await $.tool.call({ tool: 'Read', file_path: 'C:/demo/src/api/client.js' } as never)

    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('stations.js')
    expect(drawn).toContain('#2f2442')
    expect(drawn).toContain('reading')
    expect(drawn).not.toContain('url(')
    await ui.unmount()
  })

  test('an edit then a commit turns the file green', async ($, on) => {
    world(on, argv => {
      const args = argv.slice(3).join(' ')
      return argv[1] === '--version' ? 'git version 2'
        : args.startsWith('log -1') ? 'bf16766'
        : args.startsWith('diff-tree') ? 'src/api/client.js\n'
        : ''
    })
    await $.session.start({ cwd: ROOT } as never)
    await $.turn.start({ text: 'edit', turnId: 't1' })
    await $.tool.call({ tool: 'Edit', file_path: 'C:\\demo\\src\\api\\client.js', old_string: 'a', new_string: 'b' } as never)
    await $.tool.call({ tool: 'PowerShell', command: 'git commit -am "x"' } as never)

    const ui = await $.ui.mount({ plugin: 'live-files', surface: 'desktop', component: 'Pane', requestId: 'live-files', props: PROPS })
    const drawn = JSON.stringify(await ui.drawn())
    expect(drawn).toContain('Committed')
    expect(drawn).toContain('#18301f')
    await ui.unmount()
  })
})
