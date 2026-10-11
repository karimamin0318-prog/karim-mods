/** What every scene is built from: the crab, its ground, and small SVG helpers. */

export const CLASSIC = ['weights', 'rasengan', 'clones', 'ball', 'dance', 'nap'] as const
export const ANIME = ['kamehameha', 'saiyan', 'pistol', 'water', 'jojo', 'ramen', 'sharingan', 'sailor', 'onigiri', 'totoro', 'titan', 'ghoul', 'bankai', 'stand'] as const
export const TRICKS = [...CLASSIC, ...ANIME] as const
export type Trick = (typeof TRICKS)[number]
/** naruto is a run in Naruto style; chill is a short break between tricks. */
export type Kind = Trick | 'run' | 'naruto' | 'chill' | 'work' | 'done'
/** `variant` and `ms` are a chill's: which one, and for how long. */
export type Scene = { kind: Kind; x: number; to?: number; seq: number; variant?: number; ms?: number }
export type Built = { source: string; alt: string; ms: number }

/** Scene height (low, so the band stays small), the pixel size of one crab "pixel", and the crab's size. */
export const H = 48
export const U = 4
export const CW = 11 * U
export const CH = 8 * U
export const TOP = H - 3 - CH

export const ORANGE = '#D97757'
export const EYE = '#2b211d'
export const INK = '#9a918a'
export const CONFETTI = ['#D97757', '#f5b83d', '#5ab0ff', '#a78bfa', '#2dd4bf', '#f472b6']

export const r = (x: number, y: number, w: number, h: number, fill: string) =>
  `<rect x="${x * U}" y="${y * U}" width="${w * U}" height="${h * U}" fill="${fill}"/>`

/** The crab itself, Claude's little orange pixel crab, at its own top left. */
export function crab(sleepy = false): string {
  const eyes = sleepy ? r(3, 2.25, 1.25, 0.5, EYE) + r(6.75, 2.25, 1.25, 0.5, EYE) : r(3, 1, 1, 2, EYE) + r(7, 1, 1, 2, EYE)
  return `<g class="legA">${r(2, 5, 1, 3, ORANGE)}${r(6, 5, 1, 3, ORANGE)}</g>`
    + `<g class="legB">${r(4, 5, 1, 3, ORANGE)}${r(8, 5, 1, 3, ORANGE)}</g>`
    + `<g class="body">${r(1, 0, 9, 5, ORANGE)}`
    + `<g class="clawL">${r(0, 2, 1, 2, ORANGE)}</g><g class="clawR">${r(10, 2, 1, 2, ORANGE)}</g>`
    + `<g class="eyes">${eyes}</g></g>`
}

/** Puts something at the crab's spot: x across, standing on the ground. */
export const at = (x: number, inner: string, y = TOP) => `<g transform="translate(${Math.round(x)},${y})">${inner}</g>`
export const label = (x: number, y: number, text: string, size = 12, cls = '', fill = INK) =>
  `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle">${text}</text>`
export const puff = (cx: number, cy: number, cls: string) =>
  `<g class="${cls}">${[[-7, 2, 7], [0, -4, 9], [8, 1, 7], [2, 6, 6]].map(([dx, dy, rr]) => `<circle cx="${cx + dx!}" cy="${cy + dy!}" r="${rr}" fill="#c9c3bc" opacity=".85"/>`).join('')}</g>`

export const BASE = `
rect{shape-rendering:crispEdges}
text{font-family:'Segoe UI','Yu Gothic UI',system-ui,sans-serif;font-weight:700}
g,text,circle{transform-box:fill-box;transform-origin:center}
.eyes{animation:blink 4.2s infinite}
@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.15)}}
@keyframes fadeup{0%{opacity:0;transform:translateY(4px)}20%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
`

/** Keeps the crab and its props inside the band. */
export function clampX(x: number, W: number, room = 0): number {
  return Math.max(8, Math.min(Math.round(x), W - CW - 8 - room))
}

export function wrap(W: number, css: string, body: string): { source: string } {
  return { source: `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>${BASE}${css}</style>${body}</svg>` }
}
