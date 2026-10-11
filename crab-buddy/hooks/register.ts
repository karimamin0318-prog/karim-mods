import type { EngineInterface, Register } from 'claude-code'

import { packMeters } from './meters.ts'
import { build, nextSpot, nextTrick, spotOf, TRICKS, type Built, type Kind, type Scene, type Trick } from './scenes.ts'

/** The desktop band is about this many pixels per column of `bodyColumns`. */
const PX_PER_COL = 8.4

/** How many times bigger than the base drawing the crab is drawn. */
const SIZES = { small: 1, medium: 1.5, large: 2 } as const
type Size = keyof typeof SIZES

type Crab = {
  scene: Scene
  /** Bumped by every new scene; a timer from an older one does nothing. */
  gen: number
  /** Turns running now (a set, so a subagent's turn can't end the main one's laptop). */
  turns: Set<string>
  /** The width the scene is laid out in: the band's pixels over the size. */
  W: number
  size: Size
  isOn: boolean
  cache?: { key: string; built: Built }
  rand: () => number
  /** The last trick, so the next one is different. */
  lastTrick?: Trick
}

export function freshCrab(rand: () => number = Math.random): Crab {
  return { scene: { kind: 'nap', x: 8, seq: 0 }, gen: 0, turns: new Set(), W: 640, size: 'medium', isOn: true, rand }
}

/** Shows a scene now and, when it has a length, moves on after it. */
function show($: EngineInterface, c: Crab, kind: Kind, x: number, to?: number, extra: Pick<Scene, 'variant' | 'ms'> = {}): void {
  c.scene = { kind, x, to, seq: c.scene.seq + 1, ...extra }
  const gen = ++c.gen
  $.ui.invalidate('ui.render')
  if (kind === 'work') return
  const { ms } = build(c.scene, c.W)
  $.clock.after(ms, () => { if (gen === c.gen) idle($, c) })
}

/**
 * Idle life: run somewhere (now and then the Naruto way), mostly do a trick there,
 * and take random breaks of 4 to 11 seconds in between, so it isn't nonstop.
 */
function idle($: EngineInterface, c: Crab): void {
  const here = spotOf(c.scene)
  const kind = c.scene.kind
  const roll = c.rand()
  if (kind === 'run' || kind === 'naruto') return roll < 0.75 ? trick($, c, here) : chill($, c, here)
  if (kind === 'chill') return roll < 0.25 ? trick($, c, here) : runOn($, c, here)
  if (roll < 0.6) chill($, c, here)
  else runOn($, c, here)
}

function trick($: EngineInterface, c: Crab, here: number): void {
  c.lastTrick = nextTrick(c.lastTrick, c.rand)
  show($, c, c.lastTrick, here)
}

function chill($: EngineInterface, c: Crab, here: number): void {
  show($, c, 'chill', here, undefined, { variant: Math.floor(c.rand() * 3), ms: Math.round(4000 + c.rand() * 7000) })
}

function runOn($: EngineInterface, c: Crab, here: number): void {
  show($, c, c.rand() < 0.2 ? 'naruto' : 'run', here, nextSpot(here, c.W, c.rand))
}

/** The lane's share of the band when the meters can't be measured. */
const LANE = 0.3
/** What the rest of the context row needs besides the meters: Compact, ⚙ Mods, the gaps and the right margin. */
const ROW_REST_PX = 230

type Node = { type?: string; props?: { flexGrow?: unknown; [k: string]: unknown }; children?: unknown }

// The skins row keeps an empty flexGrow Box between its meters and its Compact button.
const isSpacer = (x: unknown) => {
  const n = x as Node | null
  return n?.type === 'Box' && n.props?.flexGrow === 1 && (n.children === undefined || (Array.isArray(n.children) && n.children.length === 0))
}

/**
 * Another mod's band tree with its row's spacer swapped for `lane()`, the crab between
 * two spacers of its own; undefined when the tree has no such row. Copies only the
 * path it changes. (A crab drawn over the rows, absolutely placed, left the desktop
 * band empty.)
 */
export function inRow<T>(tree: T, lane: () => unknown[]): T | undefined {
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) {
      const i = x.findIndex(isSpacer)
      if (i >= 0) return [...x.slice(0, i), ...lane(), ...x.slice(i + 1)]
      for (let j = 0; j < x.length; j++) {
        const sub = walk(x[j])
        if (sub !== undefined) return x.map((v, m) => (m === j ? sub : v))
      }
      return undefined
    }
    const n = x as Node | null
    if (!n || typeof n !== 'object' || n.children === undefined) return undefined
    const kids = Array.isArray(n.children) ? n.children : [n.children]
    const sub = walk(kids)
    if (sub === undefined) return undefined
    // The row holding the spacer: no right padding, so Compact and the gear sit at the edge.
    return kids.some(isSpacer) ? { ...n, props: { ...n.props, paddingRight: 0 }, children: sub } : { ...n, children: sub }
  }
  return walk(tree) as T | undefined
}

const HELP = `Claude crab: /crab on, /crab off, /crab size small|medium|large, /crab chill, /crab naruto, or a trick: ${TRICKS.join(', ')}. Each move also has its own command, like /crab-kamehameha.`

/** Every move that can be asked for by name, each also its own /crab-<move> command. */
const MOVES = [...TRICKS, 'chill', 'naruto'] as const
const BLURB: Record<(typeof MOVES)[number], string> = {
  weights: 'lifts weights', rasengan: 'hand signs and a Rasengan', clones: 'shadow clone jutsu', ball: 'juggles a ball', dance: 'dances', nap: 'takes a nap',
  kamehameha: 'fires a Kamehameha', saiyan: 'goes Super Saiyan', pistol: 'Gomu Gomu Pistol', water: 'Water Breathing', jojo: 'strikes a JoJo pose',
  ramen: 'eats Ichiraku ramen', sharingan: 'Sharingan eyes', sailor: 'Sailor transformation', onigiri: 'snacks an onigiri', totoro: 'Totoro umbrella',
  titan: 'turns into a Titan', ghoul: 'awakens as a ghoul', bankai: 'Bankai and a hollow mask', stand: 'fights DIO with its Stand',
  chill: 'takes a chill break', naruto: 'Naruto runs',
}

function play($: EngineInterface, c: Crab, move: (typeof MOVES)[number]): { text: string } {
  if (c.turns.size > 0) return { text: 'The crab is busy typing for Claude. Ask again when the turn is done.' }
  if (!c.isOn) return { text: 'The crab is off. /crab on first.' }
  const here = spotOf(c.scene)
  if (move === 'naruto') show($, c, 'naruto', here, nextSpot(here, c.W, c.rand))
  else if (move === 'chill') chill($, c, here)
  else show($, c, move, here)
  return { text: `Crab: ${move}!` }
}

export const register: Register = on => {
  const c = freshCrab()

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await $.command.register({ name: 'crab', description: `Claude crab above the prompt: on, off, size, or a trick (${TRICKS.join(', ')})` })
    for (const m of MOVES) await $.command.register({ name: `crab-${m}`, description: `Claude crab ${BLURB[m]}` })
    c.isOn = ((await $.store.get('isOn')) as boolean | undefined) ?? true
    const size = (await $.store.get('size')) as string | undefined
    if (size && size in SIZES) c.size = size as Size
    idle($, c)
    return r
  })

  on('turn.start', ($, e, next) => {
    c.turns.add(e.turnId)
    if (c.scene.kind !== 'work') show($, c, 'work', spotOf(c.scene))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    c.turns.delete(e.turnId)
    if (c.turns.size === 0 && c.scene.kind === 'work') show($, c, 'done', c.scene.x)
    return r
  })

  on('command.run', { command: 'crab' }, async ($, e) => {
    const arg = (e.args ?? '').trim().toLowerCase()
    if (arg === 'on' || arg === 'off' || arg === '') {
      c.isOn = arg === '' ? !c.isOn : arg === 'on'
      await $.store.set('isOn', c.isOn)
      $.ui.invalidate('ui.render')
      return { text: c.isOn ? 'The crab is back. 🦀' : 'The crab is resting off-screen. /crab on brings it back.' }
    }
    if (arg.startsWith('size')) {
      const size = arg.slice(4).trim()
      if (!(size in SIZES)) return { text: `Crab size is ${c.size}. Pick one: /crab size small, medium or large.` }
      c.size = size as Size
      await $.store.set('size', c.size)
      $.ui.invalidate('ui.render')
      return { text: `Crab size: ${c.size}.` }
    }
    if ((MOVES as readonly string[]).includes(arg)) return play($, c, arg as (typeof MOVES)[number])
    return { text: HELP }
  })


  for (const m of MOVES) on('command.run', { command: `crab-${m}` }, $ => play($, c, m))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const rest = await next(e)
    if (!c.isOn || e.props.hasSurvey) return rest
    const { Box, Text } = $.ui.resolve(e)
    if (e.surface !== 'desktop') {
      const words: Partial<Record<Kind, string>> = { run: 'scuttling around', naruto: 'Naruto running', chill: 'chilling', work: 'typing on its laptop', done: 'done!', weights: 'lifting weights', clones: 'shadow clone jutsu!', ball: 'playing ball', dance: 'dancing', nap: 'napping' }
      return Box({ flexDirection: 'column', children: [Text({ color: '#D97757', children: [`(\\/)(°,,°)(\\/) ${words[c.scene.kind] ?? `${c.scene.kind}!`}`] }), rest] })
    }
    const k = SIZES[c.size]
    const bandPx = Math.max(360, e.props.bodyColumns * PX_PER_COL)
    const { Svg } = $.ui.resolve(e)
    const draw = (lanePx: number) => {
      c.W = Math.round(lanePx / k)
      const key = `${c.scene.seq}-${c.W}-${k}`
      if (c.cache?.key !== key) c.cache = { key, built: build(c.scene, c.W, k) }
      const { source, alt } = c.cache.built
      return Box({ key: `crab-${key}`, children: [Svg({ source, alt })] })
    }
    // In the skins mod's context row, in the free stretch between the meters and
    // Compact; a row of its own above the band when that row isn't there.
    // The skins meters packed tight, and the crab's lane as wide as the room left.
    const packed = packMeters(rest)
    const lanePx = packed.width === undefined ? bandPx * LANE : bandPx - packed.width - ROW_REST_PX
    return inRow(packed.tree, () => [Box({ flexGrow: 1 }), draw(Math.max(160, lanePx)), Box({ flexGrow: 1 })])
      ?? Box({ flexDirection: 'column', children: [Box({ width: '100%', children: [draw(bandPx)] }), rest] })
  })
}
