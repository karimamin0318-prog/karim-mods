import { describe, expect, mock, test } from 'claude-code/testing'
import type { CommandRunInput, On, RenderPropsOf, SessionStartInput } from 'claude-code'

import { build, nextSpot, nextTrick, TRICKS, type Kind } from '../hooks/scenes'

const session: SessionStartInput = { surface: 'desktop', isInteractive: true, cwd: '/work' }
const bandProps: RenderPropsOf['AbovePrompt'] = { bodyColumns: 100 } as never
const run = (args = ''): CommandRunInput => ({ command: 'crab', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve() }

function world(on: On, skinsRow = false) {
  const store = new Map<string, unknown>()
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }) as never)
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('store.get', ($, e) => ({ value: store.get(e.key) }) as never)
  on('store.set', ($, e) => { store.set(e.key, e.value); return { value: undefined } })
  on('ui.render', ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    if (!skinsRow) return Text({ children: ['OTHER ROW'] })
    // Shaped like the skins mod's context row: meters, a spacer, Compact.
    return Box({ flexDirection: 'column', children: [Box({ flexDirection: 'row', children: [Text({ children: ['19% context'] }), Box({ flexGrow: 1 }), Text({ children: ['Compact'] })] })] })
  })
  return { store }
}

/** The alt text of the crab's drawing in the band, or undefined when it is hidden. */
async function drawn(band: { drawn: () => Promise<unknown> }): Promise<string | undefined> {
  return /"alt":"(Claude crab[^"]*)"/.exec(JSON.stringify(await band.drawn()))?.[1]
}

describe('crab-buddy', () => {
  test('every scene builds a small, valid SVG', () => {
    const kinds: Kind[] = ['run', 'naruto', 'chill', 'work', 'done', ...TRICKS]
    for (const kind of kinds) {
      const b = build({ kind, x: 100, to: 400, seq: 1 }, 800)
      expect(b.source.startsWith('<svg')).toBe(true)
      expect(b.source.length).toBeLessThan(131072)
      expect(b.alt).toContain('Claude crab')
    }
  })

  test('tricks never repeat back to back, and runs go somewhere new', () => {
    let r = 0
    const rand = () => (r = (r * 9301 + 49297) % 233280) / 233280
    let last = nextTrick(undefined, rand)
    for (let i = 0; i < 30; i++) {
      const t = nextTrick(last, rand)
      expect(t).not.toBe(last)
      last = t
    }
    expect(Math.abs(nextSpot(100, 900, rand) - 100)).toBeGreaterThan(100)
  })

  test('it types while Claude works, celebrates, then plays; /crab hides it', async ($, on) => {
    const w = world(on)
    const clock = mock.clock(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    expect(await drawn(band)).toMatch(/scuttling|Naruto|chilling|looking around|humming/)

    await $.turn.start({ text: 'hi', turnId: 't1' })
    await settle()
    expect(await drawn(band)).toBe('Claude crab typing on a laptop')
    await clock.advance(60_000)
    expect(await drawn(band)).toBe('Claude crab typing on a laptop')

    await $.turn.complete({ turnId: 't1', answer: 'ok', durationMs: 1000, isAborted: false } as never)
    await settle()
    expect(await drawn(band)).toBe('Claude crab celebrating: done!')
    await clock.advance(4000)
    await settle()
    expect(await drawn(band)).toMatch(/scuttling|Naruto|chilling|looking around|humming/)

    expect((await $.command.run(run('weights'))).text).toBe('Crab: weights!')
    await settle()
    expect(await drawn(band)).toBe('Claude crab lifting weights')
    // Each move is also its own command.
    expect((await $.command.run({ ...run(), command: 'crab-dance' })).text).toBe('Crab: dance!')
    await settle()
    expect(await drawn(band)).toMatch(/danc/)

    await $.command.run(run('off'))
    await settle()
    expect(await drawn(band)).toBeUndefined()
    expect(w.store.get('isOn')).toBe(false)
    await $.command.run(run())
    await settle()
    expect(await drawn(band)).toBeDefined()
  })
})

describe('crab-buddy layout', () => {
  test('without a context row the crab gets a row above the band, and /crab size makes it bigger', async ($, on) => {
    const w = world(on)
    mock.clock(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    const height = async () => {
      const d = JSON.stringify(await band.drawn())
      expect(d.indexOf('Claude crab')).toBeLessThan(d.indexOf('OTHER ROW'))
      expect(d).not.toContain('absolute')
      return Number(/height=\\"(\d+)\\"/.exec(d)?.[1])
    }
    const medium = await height()
    expect(medium).toBe(72)
    expect((await $.command.run(run('size large'))).text).toBe('Crab size: large.')
    await settle()
    expect(await height()).toBeGreaterThan(medium)
    expect(w.store.get('size')).toBe('large')
    expect((await $.command.run(run('size huge'))).text).toContain('Pick one')
  })
})

describe('crab-buddy in the context row', () => {
  test('the crab runs in the context row, between the meters and Compact', async ($, on) => {
    world(on, true)
    mock.clock(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    const d = JSON.stringify(await band.drawn())
    const at = (t: string) => d.indexOf(t)
    expect(at('19% context')).toBeLessThan(at('Claude crab'))
    expect(at('Claude crab')).toBeLessThan(at('Compact'))
    // One row: no extra row of the crab's own above it.
    expect(d.match(/"flexDirection":"row"/g)?.length).toBe(1)
  })
})

describe('crab-buddy idle life', () => {
  test('over ten minutes it runs, does anime tricks and takes chill breaks', async ($, on) => {
    world(on)
    const clock = mock.clock(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    const seen = new Set<string>()
    for (let t = 0; t < 600; t++) {
      seen.add((await drawn(band)) ?? '')
      await clock.advance(1000)
      await settle()
    }
    const all = [...seen].join(' | ')
    expect(all).toMatch(/chilling|looking around|humming/)
    expect(all).toMatch(/scuttling|Naruto/)
    expect(seen.size).toBeGreaterThan(8)
  })
})
