import { describe, expect, mock, test } from 'claude-code/testing'

/** A Windows world: records each process the mod starts and answers it with `exitCode`. */
function windows(on: any, exitCode = 0) {
  const runs: string[][] = []
  mock.store(on)
  const clock = mock.clock(on, { now: 0 })
  on('env.get', async (_$: unknown, e: { name: string }) => ({ value: e.name === 'OS' ? 'Windows_NT' : undefined }))
  on('process.run', async (_$: unknown, e: { argv: string[] }) => {
    runs.push(e.argv)
    return { value: { exitCode, stdout: '', stderr: exitCode ? 'no audio device' : '' } }
  })
  on('turn.complete', async () => ({ text: '' }))
  return { runs, clock }
}

const finished = (durationMs: number, agentId?: string) =>
  ({ turnId: 't1', reason: 'answer', answer: 'done', isAborted: false, durationMs, agentId }) as never

describe('done-chime', () => {
  test('/chime alone reports the default settings', async ($, on) => {
    mock.store(on)
    const status = await $.command.run({ command: 'chime', args: '' } as never)
    expect(status.text).toContain('on, for tasks of 15s')
  })

  test('/chime off and a number of seconds are remembered', async ($, on) => {
    mock.store(on)
    const chime = (args: string) => $.command.run({ command: 'chime', args } as never)
    await chime('off')
    expect((await chime('')).text).toContain('is off')
    await chime('30')
    expect((await chime('')).text).toContain('on, for tasks of 30s')
  })

  test('/chime test plays the wav through PowerShell on Windows', async ($, on) => {
    const { runs } = windows(on)
    const out = await $.command.run({ command: 'chime', args: 'test' } as never)
    expect(out.text).toBe('Played the chime.')
    const [argv] = runs
    expect(argv?.[0]).toBe('powershell.exe')
    expect(argv?.at(-1)).toContain('sounds\\chime.wav')
    expect(argv?.at(-1)).toContain('PlaySync()')
  })

  test('/chime test says why when the sound cannot play', async ($, on) => {
    windows(on, 1)
    const out = await $.command.run({ command: 'chime', args: 'test' } as never)
    expect(out.text).toContain('no audio device')
  })

  test('chimes after a long answer only, never for a subagent or while off', async ($, on) => {
    const { runs, clock } = windows(on)
    await $.turn.complete(finished(3_000))
    await $.turn.complete(finished(60_000, 'agent-1'))
    await clock.settle()
    expect(runs).toHaveLength(0)

    await $.turn.complete(finished(20_000))
    await clock.settle()
    expect(runs).toHaveLength(1)

    await $.command.run({ command: 'chime', args: 'off' } as never)
    await $.turn.complete(finished(20_000))
    await clock.settle()
    expect(runs).toHaveLength(1)
  })
})
