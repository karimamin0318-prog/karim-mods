// The two cards drawn as SVG: "Right now" and "Claude touched".
// No url() references anywhere: the surface's scrub may drop them.

import type { Accent, GitInfo, Icon, Now, Touched, TouchStatus } from '../types'
import { clip, tagFor } from './model'

const FONT = "'Segoe UI Variable Text','Segoe UI',Inter,system-ui,sans-serif"

export const ACCENT: Record<Accent, { fg: string; bg: string }> = {
  grey: { fg: '#a1a1a8', bg: '#2c2c30' },
  purple: { fg: '#c4a1ff', bg: '#352a4d' },
  orange: { fg: '#f5a35c', bg: '#43301f' },
  green: { fg: '#5ee08a', bg: '#1d3b27' },
  blue: { fg: '#79b8ff', bg: '#1f2d3d' },
  red: { fg: '#ff7b72', bg: '#3d2224' },
}

export const PILL: Record<TouchStatus, { text: string; accent: Accent }> = {
  reading: { text: 'Reading', accent: 'purple' },
  opened: { text: 'Opened', accent: 'purple' },
  editing: { text: 'Editing', accent: 'orange' },
  edited: { text: 'Edited', accent: 'orange' },
  created: { text: 'Created', accent: 'orange' },
  committed: { text: 'Committed', accent: 'green' },
}

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Rough rendered width of `s` at font size `px` in the UI font. */
export const textWidth = (s: string, px: number): number => s.length * px * 0.56

/** A W×H drawing with its style block. */
export const svgDoc = (W: number, H: number, style: string, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${style}\n${body}\n</svg>`

/** The soft grey a row takes under the pointer. */
export const LIT = { bg: '#26262b', stroke: '#38383e' }

/** The font alone, for drawings that animate nothing. */
export const PLAIN_STYLE = `<style>text{font-family:${FONT}}</style>`

export const STYLE = `<style>
text{font-family:${FONT}}
.card{fill:#1b1b1e;stroke:#38383d;stroke-width:1.4}
.live{animation:glow 1.9s ease-in-out infinite}
@keyframes glow{0%,100%{stroke:#4a4a50;stroke-width:1.4}50%{stroke:#f2f2f2;stroke-width:2.2}}
.spin{transform-box:fill-box;transform-origin:center;animation:spin 5s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 1.7s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.09)}}
.breathe{animation:breathe 1.6s ease-in-out infinite}
@keyframes breathe{0%,100%{opacity:1}50%{opacity:.62}}
.w{animation:w 2s linear infinite}
@keyframes w{0%,14%,100%{fill:var(--b)}7%{fill:#ffffff}}
</style>`

/** Each letter its own tspan; a staggered flash runs across them like a shine. */
export function wave(text: string, base: string): string {
  return [...text]
    .map((ch, i) => `<tspan class="w" fill="${base}" style="--b:${base};animation-delay:${(i * 0.045).toFixed(3)}s">${esc(ch)}</tspan>`)
    .join('')
}

// 24x24 stroke icons.
const ICONS: Record<Icon, string> = {
  spark: '<g class="spin"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/></g>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pencil: '<path d="M17 3.5a2.4 2.4 0 0 1 3.5 3.5L8 19.5 3 21l1.5-5z"/><path d="M14.5 6l3.5 3.5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  terminal: '<path d="m5 17 6-5-6-5"/><path d="M13 19h7"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
}

const BRANCH =
  '<g fill="none" stroke="#79b8ff" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="7" r="2.2"/><path d="M6 7.2v9.6"/><path d="M18 9.2c0 5-6 4.5-11.2 7.8"/></g>'

/** The legend, shrunk until it fits between `x` and `right`. */
function legend(x: number, y: number, right: number, isRepo: boolean): string {
  const items: [string, string][] = [
    ['#b48cff', 'Claude read'],
    ['#f59e42', 'Claude edited'],
  ]
  if (isRepo) items.push(['#e9c97a', 'Not committed'])
  let size = 14
  let gap = 20
  const total = () => items.reduce((n, [, label]) => n + 15 + textWidth(label, size), 0) + gap * (items.length - 1)
  while (total() > right - x && size > 11) {
    size -= 0.5
    gap = Math.max(12, gap - 2)
  }
  let cx = x
  let out = ''
  for (const [color, label] of items) {
    out += `<circle cx="${cx + 5}" cy="${y - size * 0.34}" r="4.6" fill="${color}"/>`
    out += `<text x="${cx + 15}" y="${y}" font-size="${size}" fill="#c8c8cc">${esc(label)}</text>`
    cx += 15 + textWidth(label, size) + gap
  }
  return out
}

/** The "Right now" card. */
export function nowCard(now: Now, git: GitInfo, width: number): { source: string } {
  const W = Math.max(280, Math.round(width))
  const isRepo = git.isRepo
  const H = isRepo ? 196 : 162
  const a = ACCENT[now.accent]
  const room = W - 94 - 22

  let titleSize = 21
  while (textWidth(now.title, titleSize) > room && titleSize > 16) titleSize -= 0.5
  const title = clip(now.title, Math.floor(room / (titleSize * 0.56)))
  const titleSvg = now.isLive ? wave(title, '#dcdce0') : esc(title)

  const diff = now.added || now.removed ? `+${now.added} -${now.removed}` : ''
  const subRoom = Math.floor((room - (diff ? textWidth(diff, 14.5) + 10 : 0)) / (14.5 * 0.56))
  let sub = `<tspan fill="#9d9da5">${esc(clip(now.sub, subRoom))}</tspan>`
  if (diff) sub += `<tspan dx="8" fill="#7ee787">+${now.added}</tspan><tspan dx="5" fill="#ff7b72">-${now.removed}</tspan>`

  let gitRow = ''
  if (isRepo) {
    const changed = Object.keys(git.files).length
    const right = changed
      ? `<tspan fill="#7ee787">+${git.added}</tspan><tspan dx="5" fill="#ff7b72">-${git.removed}</tspan><tspan dx="6" fill="#77777f">·</tspan><tspan dx="6" fill="#e9c97a">${changed} changed</tspan>`
      : '<tspan fill="#9d9da5">clean, nothing changed</tspan>'
    const ahead = git.ahead ? `<tspan dx="8" fill="#5ee08a">↑${git.ahead}</tspan>` : ''
    gitRow = `<g transform="translate(22 128)">${BRANCH}</g>
<text x="52" y="146" font-size="16" font-weight="700" fill="#f4f4f5">${esc(clip(git.branch || 'main', 20))}${ahead}</text>
<text x="${W - 24}" y="146" font-size="14" text-anchor="end">${right}</text>`
  }

  const source = svgDoc(W, H, STYLE, `<rect class="card ${now.isLive ? 'live' : ''}" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="16"/>
<g class="${now.isLive ? 'pulse' : ''}"><circle cx="50" cy="54" r="27" fill="${a.bg}"/></g>
<g transform="translate(38 42)" fill="none" stroke="${a.fg}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[now.icon]}</g>
<text x="94" y="38" font-size="12.5" font-weight="700" letter-spacing="1.6" fill="${a.fg}">${esc(now.label)}</text>
<text x="94" y="65" font-size="${titleSize}" font-weight="650" fill="#f4f4f5">${titleSvg}</text>
<text x="94" y="88" font-size="14.5">${sub}</text>
<line x1="24" y1="110" x2="${W - 24}" y2="110" stroke="#2f2f34" stroke-width="1"/>
${gitRow}
${legend(24, isRepo ? 178 : 144, W - 20, isRepo)}`)
  return { source }
}

/** One row's drawing, and the same row lit for the pointer. */
type CardRow = { source: string; hover: string; alt: string }

const CARD_FILL = '#1b1b1e'
const CARD_STROKE = '#38383d'
const ROW = 32

/**
 * The "Claude touched" card as a stack of pictures: the top with the header,
 * one per file, and the bottom. Each piece draws its own stretch of the card's
 * fill and border, so stacked they read as one card, and each file row can
 * carry its own hover look and click target.
 */
export function touchedParts(touched: Touched[], width: number): { top: string; rows: CardRow[]; bottom: string } {
  const W = Math.max(280, Math.round(width))
  const shown = touched.slice(0, 10)
  const more = touched.length - shown.length
  const isLive = touched.some(t => t.status === 'reading' || t.status === 'editing')
  const stroke = `fill="none" stroke="${CARD_STROKE}" stroke-width="1.4" class="${isLive ? 'live' : ''}"`
  const piece = (h: number, body: string) => svgDoc(W, h, isLive ? STYLE : PLAIN_STYLE, body)

  const topH = 56
  const topEdge = `M1.5 ${topH} V15.5 A14 14 0 0 1 15.5 1.5 H${W - 15.5} A14 14 0 0 1 ${W - 1.5} 15.5 V${topH}`
  const top = piece(
    topH,
    `<path d="${topEdge} Z" fill="${CARD_FILL}"/><path d="${topEdge}" ${stroke}/>
<text x="20" y="34" font-size="12.5" font-weight="700" letter-spacing="1.6" fill="#a1a1a8">CLAUDE TOUCHED</text>
<text x="${W - 20}" y="34" font-size="12.5" font-weight="700" letter-spacing="1.6" text-anchor="end" fill="#a1a1a8">${touched.length} ${touched.length === 1 ? 'FILE' : 'FILES'}</text>`,
  )

  const sides = `<rect x="1.5" y="0" width="${W - 3}" height="${ROW}" fill="${CARD_FILL}"/><path d="M1.5 0 V${ROW} M${W - 1.5} 0 V${ROW}" ${stroke}/>`
  const rows = shown.map((t): CardRow => {
    const y = 20
    const tag = tagFor(t.name)
    const tagW = Math.max(24, textWidth(tag.label, 10) + 12)
    const pill = PILL[t.status]
    const pa = ACCENT[pill.accent]
    const pillW = textWidth(pill.text, 12.5) + 22
    const pillX = W - 18 - pillW
    const isActive = t.status === 'reading' || t.status === 'editing'
    const hasDiff = t.added > 0 || t.removed > 0
    const diff = hasDiff
      ? `<text x="${pillX - 10}" y="${y}" font-size="14" text-anchor="end"><tspan fill="#7ee787">+${t.added}</tspan><tspan dx="5" fill="#ff7b72">-${t.removed}</tspan></text>`
      : ''
    const diffW = hasDiff ? textWidth(`+${t.added} -${t.removed}`, 14) + 18 : 0
    const nameX = 20 + tagW + 10
    const room = Math.max(6, Math.floor((pillX - diffW - nameX - 10) / (15.5 * 0.56)))
    const name = clip(t.name, room)
    const dirRoom = Math.floor((room - name.length) * 1.05) - 2
    const dir = t.dir && dirRoom > 3 ? `<tspan dx="9" font-size="14" font-weight="400" fill="#86868e">${esc(clip(t.dir, dirRoom))}</tspan>` : ''
    const content = `<rect x="20" y="${y - 13}" width="${tagW}" height="18" rx="5" fill="${tag.bg}"/>
<text x="${20 + tagW / 2}" y="${y}" font-size="10" font-weight="700" letter-spacing="0.3" text-anchor="middle" fill="${tag.color}">${esc(tag.label)}</text>
<text x="${nameX}" y="${y + 1}" font-size="15.5" font-weight="650" fill="#f4f4f5">${esc(name)}${dir}</text>
${diff}
<g class="${isActive ? 'breathe' : ''}"><rect x="${pillX}" y="${y - 15}" width="${pillW}" height="22" rx="11" fill="${pa.bg}"/>
<text x="${pillX + pillW / 2}" y="${y + 1}" font-size="12.5" font-weight="650" text-anchor="middle" fill="${pa.fg}">${pill.text}</text></g>`
    const lit = `<rect x="10" y="2" width="${W - 20}" height="${ROW - 4}" rx="8" fill="${LIT.bg}" stroke="${LIT.stroke}" stroke-width="1"/>`
    // The live border and the breathing pill animate, so these keep the full style.
    const style = isLive || isActive ? STYLE : PLAIN_STYLE
    const one = (body: string) => svgDoc(W, ROW, style, body)
    return { source: one(sides + content), hover: one(sides + lit + content), alt: `${t.name}, ${pill.text}. Show it in the tree` }
  })

  let note = ''
  let noteH = 0
  if (shown.length === 0) {
    note = `<text x="22" y="20" font-size="15" fill="#86868e">Nothing yet</text>`
    noteH = ROW
  } else if (more > 0) {
    note = `<text x="20" y="20" font-size="13.5" fill="#86868e">and ${more} more</text>`
    noteH = 26
  }
  // Tall enough for the rounded corners.
  const bottomH = Math.max(16, noteH + 8)
  const bottomEdge = `M1.5 0 V${bottomH - 15.5} A14 14 0 0 0 15.5 ${bottomH - 1.5} H${W - 15.5} A14 14 0 0 0 ${W - 1.5} ${bottomH - 15.5} V0`
  const bottom = piece(bottomH, `<path d="${bottomEdge} Z" fill="${CARD_FILL}"/><path d="${bottomEdge}" ${stroke}/>${note}`)

  return { top, rows, bottom }
}
