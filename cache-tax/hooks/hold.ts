// The pictures of the "message on hold" card: its head with the prices, the
// "are you sure" step and the busy line. The choices under it are the app's
// own Buttons. No url() references anywhere: the surface's scrub may drop them.

/** One choice on the card; `cost` is its money badge, colored by `tone` from red (most) to green (least). */
export type Choice = { id: string; title: string; desc: string; cost?: string; tone: Tone }
export type Tone = 'orange' | 'green' | 'red' | 'grey'

export type Held = {
  text: string
  /** How long the cache has been cold, as written at hold time. */
  coldFor: string
  sendUsd: string
  warmUsd: string
  /** The send price against the warm one, for the bars. */
  warmRatio: number
  noteUsd: string
}

const FONT = "'Segoe UI Variable Text','Segoe UI',Inter,system-ui,sans-serif"

type Palette = { card: string; stroke: string; inset: string; title: string; body: string; dim: string; track: string }
const DARK: Palette = { card: '#1b1b1e', stroke: '#38383d', inset: '#141416', title: '#f4f4f5', body: '#c8c8cc', dim: '#8e8e96', track: '#2c2c31' }
const LIGHT: Palette = { card: '#ffffff', stroke: '#dcdad3', inset: '#f6f5f1', title: '#1f1e1b', body: '#3d3c38', dim: '#77756e', track: '#e6e4dd' }

const TONE: Record<Tone, { fg: string; bg: string; fgLight: string; bgLight: string }> = {
  orange: { fg: '#e8875f', bg: '#43291e', fgLight: '#c15f3c', bgLight: '#fbe9e1' },
  green: { fg: '#5ee08a', bg: '#1d3b27', fgLight: '#2f8f4e', bgLight: '#e2f4e7' },
  red: { fg: '#ff7b72', bg: '#3d2224', fgLight: '#c4382f', bgLight: '#fbe4e2' },
  grey: { fg: '#a1a1a8', bg: '#2c2c30', fgLight: '#6d6c66', bgLight: '#ecebe6' },
}

const tone = (t: Tone, light: boolean) => (light ? { fg: TONE[t].fgLight, bg: TONE[t].bgLight } : TONE[t])

/** `a` blended into `b`, both #rrggbb: all of `a` at 1, all of `b` at 0. */
function mix(a: string, b: string, amount: number): string {
  const part = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  const channel = (i: number) => Math.round(part(a, i) * amount + part(b, i) * (1 - amount)).toString(16).padStart(2, '0')
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

/** A choice tile's colors: its accent (badge, border when lit), its quieter border at rest, and its background at rest and under the pointer. */
export function tileColors(t: Tone, light: boolean) {
  const c = tone(t, light)
  const p = light ? LIGHT : DARK
  return { accent: c.fg, border: mix(c.fg, p.card, 0.55), bg: p.card, litBg: c.bg }
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Rough rendered width of `s` at font size `px` in the UI font. */
const textWidth = (s: string, px: number): number => s.length * px * 0.5

/** `s` cut to fit `room` pixels at `px`, with an ellipsis when cut. */
function fit(s: string, px: number, room: number): string {
  const one = s.replace(/\s+/g, ' ').trim()
  if (textWidth(one, px) <= room) return one
  const n = Math.max(1, Math.floor(room / (px * 0.5)) - 1)
  return one.slice(0, n).trimEnd() + '…'
}

/** A W×H drawing shown `k` times its size: the app draws an SVG at its own width, never stretched wider. */
const svgDoc = (W: number, H: number, style: string, body: string, k = 1): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W * k)}" height="${Math.round(H * k)}" viewBox="0 0 ${W} ${H}">\n${style}\n${body}\n</svg>`

// The pop: slides up and settles with a slight overshoot. `still` drawings
// (any redraw after the first) leave it out, or a scroll would replay it.
const POP = `.pop{transform-box:fill-box;transform-origin:50% 100%;animation:pop .5s cubic-bezier(.2,.9,.25,1.12) both}
@keyframes pop{0%{opacity:0;transform:translateY(16px) scale(.96)}100%{opacity:1;transform:none}}`

function style(still: boolean, extra = ''): string {
  return `<style>text{font-family:${FONT}}${still ? '' : POP}${extra}</style>`
}

// The Cache Tax cube, from the mod's official mark, 64x64 drawn at `size`.
function cube(x: number, y: number, size: number, lid: string, edge: string): string {
  const k = size / 64
  return `<g transform="translate(${x} ${y}) scale(${k})" stroke="${edge}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none">
<path fill="${lid}" d="M8 18 32 5 56 18 32 31Z"/><path d="M8 18v28l24 13 24-13V18M32 31v28"/><path stroke-width="3.6" d="M40.6 34.4 47.4 38.1 40.6 45.4"/></g>`
}

const HEAD_H = 74
const GROW = `.grow{transform-box:fill-box;transform-origin:0 50%;animation:grow .9s cubic-bezier(.3,.8,.3,1) both}
@keyframes grow{0%{transform:scaleX(0)}100%{transform:scaleX(1)}}`

// `animate` is true only while the card first appears: a drawing redrawn later
// (a scroll, another redraw) comes without the pop, so nothing replays.

/** The head of the card: what happened, what is held, and the two prices. */
export function headCard(h: Held, width: number, light: boolean, animate: boolean, k = 1): { source: string; alt: string } {
  const p = light ? LIGHT : DARK
  const o = tone('orange', light)
  const g = tone('green', light)
  const W = Math.max(480, Math.round(width))
  const R = W >= 640 ? 250 : 200
  const rx = W - 12 - R
  const col = R / 2
  const barW = col - 28
  const left = W - 62 - R - 24
  const price = (x: number, label: string, usd: string, fill: string, ratio: number, delay: number) =>
    `<text x="${x}" y="28" font-size="11.5" fill="${p.dim}">${label}</text>
<text x="${x}" y="49" font-size="18" font-weight="700" fill="${fill}">${esc(usd)}</text>
<rect x="${x}" y="56" width="${barW}" height="4" rx="2" fill="${p.track}"/>
<rect class="grow" style="animation-delay:${delay}s" x="${x}" y="56" width="${Math.max(4, barW * ratio)}" height="4" rx="2" fill="${fill}"/>`
  const body = `<g class="pop">
<rect x=".7" y=".7" width="${W - 1.4}" height="${HEAD_H - 1.4}" rx="12" fill="${p.card}" stroke="${p.stroke}" stroke-width="1.4"/>
${cube(16, 19, 34, o.fg, p.title)}
<text x="62" y="23" font-size="11" font-weight="700" letter-spacing="1.4" fill="${o.fg}">CACHE TAX</text>
<text x="62" y="43" font-size="17" font-weight="650" fill="${p.title}">${esc(fit('Your message is on hold', 17, left))}</text>
<text x="62" y="62" font-size="12.5" fill="${p.dim}">${esc(fit(`Cold for ${h.coldFor} · On hold: “${h.text}”`, 12.5, left))}</text>
<rect x="${rx}" y="10" width="${R}" height="${HEAD_H - 20}" rx="9" fill="${p.inset}"/>
${price(rx + 14, 'Send it now', h.sendUsd, tone('red', light).fg, 1, 0.15)}
${price(rx + 14 + col, 'A warm turn', h.warmUsd, g.fg, h.warmRatio, 0.3)}
</g>`
  const alt = `Cache Tax: your message is on hold. The cache went cold ${h.coldFor} ago. Sending now costs ${h.sendUsd}, a warm turn ${h.warmUsd}.`
  return { source: svgDoc(W, HEAD_H, style(!animate, animate ? GROW : ''), body, k), alt }
}

/** The head of the "are you sure" step. */
export function confirmCard(width: number, light: boolean, animate: boolean, k = 1): { source: string; alt: string } {
  const p = light ? LIGHT : DARK
  const r = tone('red', light)
  const W = Math.max(480, Math.round(width))
  const room = W - 62 - 16
  const lines = wrap("This chat's history will be cleared; your files stay. A handoff note and your message carry over.", 12.5, room, 2)
  const H = HEAD_H + (lines.length - 1) * 16
  const cy = H / 2
  const body = `<g class="pop">
<rect x=".7" y=".7" width="${W - 1.4}" height="${H - 1.4}" rx="12" fill="${p.card}" stroke="${r.fg}" stroke-opacity=".6" stroke-width="1.4"/>
<circle cx="33" cy="${cy}" r="17" fill="${r.bg}"/>
<path d="M33 ${cy - 9}v11" stroke="${r.fg}" stroke-width="2.4" stroke-linecap="round"/><circle cx="33" cy="${cy + 8}" r="1.7" fill="${r.fg}"/>
<text x="62" y="23" font-size="11" font-weight="700" letter-spacing="1.4" fill="${r.fg}">START A NEW CHAT?</text>
<text x="62" y="43" font-size="17" font-weight="650" fill="${p.title}">Are you sure?</text>
${lines.map((l, i) => `<text x="62" y="${62 + i * 16}" font-size="12.5" fill="${p.dim}">${esc(l)}</text>`).join('\n')}
</g>`
  return { source: svgDoc(W, H, style(!animate), body, k), alt: "Start a new chat? This chat's history will be cleared; a handoff note and your message carry over." }
}

/**
 * The card while a choice runs: a spinner and what it is doing. No pop: a new
 * source restarts the spinner, so the drawing stays the same for a given label.
 */
export function busyCard(label: string, width: number, light: boolean, k = 1): { source: string; alt: string } {
  const p = light ? LIGHT : DARK
  const o = tone('orange', light)
  const W = Math.max(480, Math.round(width))
  const H = 52
  const r = 9
  const turn = 2 * Math.PI * r
  // A whole circle with a dash, not an arc: its box is centered on the ring, so it turns in place.
  const spin = `.spin{transform-box:fill-box;transform-origin:center;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}`
  const body = `<rect x=".7" y=".7" width="${W - 1.4}" height="${H - 1.4}" rx="12" fill="${p.card}" stroke="${p.stroke}" stroke-width="1.4"/>
<circle cx="30" cy="26" r="${r}" fill="none" stroke="${p.track}" stroke-width="3"/>
<circle class="spin" cx="30" cy="26" r="${r}" fill="none" stroke="${o.fg}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${(turn / 4).toFixed(2)} ${((turn * 3) / 4).toFixed(2)}"/>
<text x="52" y="31" font-size="15" font-weight="600" fill="${p.title}">${esc(fit(label, 15, W - 70))}</text>`
  return { source: svgDoc(W, H, style(true, spin), body, k), alt: label }
}

/** `text` broken into at most `max` lines of `room` pixels; the last one ends in an ellipsis when cut. */
function wrap(text: string, px: number, room: number, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i]!
    if (textWidth(next, px) <= room || !line) { line = next; continue }
    // The last line takes the rest, cut to fit.
    if (lines.length === max - 1) return [...lines, fit(`${line} ${words.slice(i).join(' ')}`, px, room)]
    lines.push(line)
    line = words[i]!
  }
  return line ? [...lines, line] : lines
}
