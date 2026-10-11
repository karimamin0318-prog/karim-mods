import type { EngineInterface, Register } from 'claude-code'

const SOUND = 'sounds/chime.wav'
const DEFAULT_SECONDS = 15

type Prefs = { isOn: boolean; minSeconds: number }

async function loadPrefs($: EngineInterface): Promise<Prefs> {
  const saved = (await $.store.get('prefs')) as Partial<Prefs> | undefined
  return {
    isOn: saved?.isOn ?? true,
    minSeconds: saved?.minSeconds ?? DEFAULT_SECONDS,
  }
}

// Windows has no player behind $.audio.play in a terminal, so play the file
// through .NET's SoundPlayer there; elsewhere let the engine play it.
async function chime($: EngineInterface): Promise<void> {
  if ((await $.env.get('OS')) === 'Windows_NT') {
    const path = `${$.plugin.root}/${SOUND}`.replace(/\//g, '\\').replace(/'/g, "''")
    const ran = await $.process.run(
      [
        'powershell.exe',
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `(New-Object Media.SoundPlayer '${path}').PlaySync()`,
      ],
      { timeoutMs: 10_000 },
    )
    if (ran.exitCode !== 0) {
      throw new Error(`powershell exited ${ran.exitCode}: ${ran.stderr.trim().slice(0, 300)}`)
    }
    return
  }
  await $.audio.play({ asset: SOUND })
}

function play($: EngineInterface): void {
  chime($).catch(err => $.ui.log(`could not play the chime: ${String(err)}`))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'chime',
      description: 'Done chime: on, off, test, or a number of seconds',
    })
    return next(e)
  })

  on('command.run', { command: 'chime' }, async ($, e) => {
    const arg = (e.args ?? '').trim().toLowerCase()
    const prefs = await loadPrefs($)

    if (arg === 'test') {
      try {
        await chime($)
        return { text: 'Played the chime.' }
      } catch (err) {
        return { text: `Could not play the chime: ${String(err)}` }
      }
    }
    if (arg === 'on' || arg === 'off') {
      await $.store.set('prefs', { ...prefs, isOn: arg === 'on' })
      return { text: `Done chime is ${arg}.` }
    }
    if (/^\d+$/.test(arg)) {
      const minSeconds = Number(arg)
      await $.store.set('prefs', { ...prefs, isOn: true, minSeconds })
      return { text: `Done chime plays after tasks of ${minSeconds}s or longer.` }
    }
    return {
      text:
        `Done chime is ${prefs.isOn ? 'on' : 'off'}, for tasks of ${prefs.minSeconds}s or longer. ` +
        'Use /chime on, /chime off, /chime test, or /chime <seconds>.',
    }
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const isMainAnswer = e.agentId === undefined && e.reason === 'answer'
    if (isMainAnswer) {
      const prefs = await loadPrefs($)
      if (prefs.isOn && e.durationMs >= prefs.minSeconds * 1000) play($)
    }
    return result
  })
}
