import type { EngineInterface, Register } from 'claude-code'

const SOUND = 'sounds/chime.wav'
const ASK_SOUND = 'sounds/ask.wav'
const DEFAULT_SECONDS = 15
// One question can raise several signals (the tool, then its permission dialog).
const ASK_QUIET_MS = 5_000

type Prefs = { isOn: boolean; minSeconds: number; askIsOn: boolean }

async function loadPrefs($: EngineInterface): Promise<Prefs> {
  const saved = (await $.store.get('prefs')) as Partial<Prefs> | undefined
  return {
    isOn: saved?.isOn ?? true,
    minSeconds: saved?.minSeconds ?? DEFAULT_SECONDS,
    askIsOn: saved?.askIsOn ?? true,
  }
}

// Windows has no player behind $.audio.play in a terminal, so play the file
// through .NET's SoundPlayer there; elsewhere let the engine play it.
async function chime($: EngineInterface, sound = SOUND): Promise<void> {
  if ((await $.env.get('OS')) === 'Windows_NT') {
    const path = `${$.plugin.root}/${sound}`.replace(/\//g, '\\').replace(/'/g, "''")
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
  await $.audio.play({ asset: sound })
}

function play($: EngineInterface, sound = SOUND): void {
  chime($, sound).catch(err => $.ui.log(`could not play the chime: ${String(err)}`))
}

let lastAskAt = -Infinity

// Claude is waiting for the person: a question, a plan to approve, a permission.
async function askChime($: EngineInterface): Promise<void> {
  const prefs = await loadPrefs($)
  if (!prefs.isOn || !prefs.askIsOn) return
  const now = await $.clock.now()
  if (now - lastAskAt < ASK_QUIET_MS) return
  lastAskAt = now
  play($, ASK_SOUND)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'chime',
      description: 'Done chime: on, off, test, <seconds>, or ask on|off|test',
    })
    return next(e)
  })

  on('command.run', { command: 'chime' }, async ($, e) => {
    const arg = (e.args ?? '').trim().toLowerCase()
    const prefs = await loadPrefs($)

    if (arg === 'ask test') {
      try {
        await chime($, ASK_SOUND)
        return { text: 'Played the question chime.' }
      } catch (err) {
        return { text: `Could not play the question chime: ${String(err)}` }
      }
    }
    if (arg === 'ask on' || arg === 'ask off') {
      await $.store.set('prefs', { ...prefs, askIsOn: arg === 'ask on' })
      return { text: `Question chime is ${arg.slice(4)}.` }
    }
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
        `Question chime is ${prefs.askIsOn ? 'on' : 'off'}. ` +
        'Use /chime on, /chime off, /chime test, /chime <seconds>, or /chime ask on|off|test.',
    }
  })

  on('tool.call', { tool: ['AskUserQuestion', 'ExitPlanMode'] }, async ($, e, next) => {
    await askChime($).catch(() => {})
    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    await askChime($).catch(() => {})
    return next(e)
  })

  on('classic.Elicitation', async ($, e, next) => {
    await askChime($).catch(() => {})
    return next(e)
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
