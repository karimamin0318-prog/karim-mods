import { describe, expect, mock, test } from 'claude-code/testing'
import type { RenderPropsOf, SessionStartInput } from 'claude-code'

import { packMeters, tighten } from '../hooks/meters'

/** The skins mod's meter picture for 35% context, 31% 5h, 28% 7d (skins 0.2.0, svg-usage.ts). */
const METERS = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"396\" height=\"30\" viewBox=\"0 0 396 30\"><style>text{font-family:ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif}.fill{animation:fill .9s cubic-bezier(.2,.8,.2,1)}@keyframes fill{from{stroke-dasharray:0 100}}@media (prefers-reduced-motion:reduce){.fill{animation:none}}</style><circle cx=\"13\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#888\" stroke-opacity=\".25\" stroke-width=\"3\"/><circle class=\"fill\" cx=\"13\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#5ab0ff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-dasharray=\"19.7920337176157 56.548667764616276\" transform=\"rotate(-90 13 15)\" style=\"--len:19.7920337176157\"/><text x=\"30\" y=\"19.5\" font-size=\"12.5\"><tspan style=\"fill:#eee;font-weight:600\">35%</tspan><tspan style=\"fill:#888\"> context</tspan></text><circle cx=\"145\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#888\" stroke-opacity=\".25\" stroke-width=\"3\"/><circle class=\"fill\" cx=\"145\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#5ab0ff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-dasharray=\"17.530087007031046 56.548667764616276\" transform=\"rotate(-90 145 15)\" style=\"--len:17.530087007031046\"/><text x=\"162\" y=\"19.5\" font-size=\"12.5\"><tspan style=\"fill:#eee;font-weight:600\">31%</tspan><tspan style=\"fill:#888\"> 5h</tspan></text><circle cx=\"277\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#888\" stroke-opacity=\".25\" stroke-width=\"3\"/><circle class=\"fill\" cx=\"277\" cy=\"15\" r=\"9\" fill=\"none\" stroke=\"#5ab0ff\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-dasharray=\"15.833626974092558 56.548667764616276\" transform=\"rotate(-90 277 15)\" style=\"--len:15.833626974092558\"/><text x=\"294\" y=\"19.5\" font-size=\"12.5\"><tspan style=\"fill:#eee;font-weight:600\">28%</tspan><tspan style=\"fill:#888\"> 7d</tspan></text></svg>"
const session: SessionStartInput = { surface: 'desktop', isInteractive: true, cwd: '/work' }
const bandProps: RenderPropsOf['AbovePrompt'] = { bodyColumns: 112 } as never

describe('crab-buddy meters', () => {
  test('the skins meters are packed to the room their words need', () => {
    const t = tighten(METERS)!
    expect(t.width).toBeLessThan(330)
    expect(t.source).toContain(`width="${t.width}"`)
    expect(t.source).toContain('28%')
    expect((t.source.match(/<g transform/g) ?? []).length).toBe(3)
    expect(tighten('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>')).toBeUndefined()
  })

  test('in the band the meters shrink and the crab gets the room', async ($, on) => {
    on('command.register', ($, e) => ({ value: { command: e.name } }))
    on('session.start', ($, e) => ({ cwd: e.cwd }))
    on('store.get', () => ({ value: undefined }) as never)
    on('ui.render', ($, e) => {
      if (e.surface !== 'desktop') return $.ui.resolve(e).Text({ children: [''] })
      const { Box, Svg, Text } = $.ui.resolve(e)
      return Box({ flexDirection: 'row', children: [Svg({ source: METERS, alt: 'context 35%, 5h 31%, 7d 28%', width: 396, height: 30 }), Box({ flexGrow: 1 }), Text({ children: ['Compact'] })] })
    })
    mock.clock(on)
    await $.session.start(session)
    const band = await $.ui.mount({ plugin: 'crab-buddy', surface: 'desktop', component: 'AbovePrompt', props: bandProps })
    // Every Svg drawn in the band, by its alt.
    const svgs: Array<{ alt: string; source: string; width?: number }> = []
    const walk = (x: unknown): void => {
      if (Array.isArray(x)) return x.forEach(walk)
      const n = x as { type?: string; props?: { alt: string; source: string; width?: number }; children?: unknown } | null
      if (!n || typeof n !== 'object') return
      if (n.type === 'Svg' && n.props) svgs.push(n.props)
      walk(n.children)
    }
    walk(await band.drawn())
    const meters = svgs.find(s => s.alt.startsWith('context'))!
    expect(meters.width).toBeLessThan(330)
    // The crab's picture is its lane's width in pixels: more than the old fixed 30%.
    const crab = svgs.find(s => s.alt.startsWith('Claude crab'))!
    expect(Number(/ width="(\d+)"/.exec(crab.source)?.[1])).toBeGreaterThan(112 * 8.4 * 0.3)
  })
})
