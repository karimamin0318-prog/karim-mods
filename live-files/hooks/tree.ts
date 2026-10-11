// The file tree drawn as a stack of SVGs: a header, one picture per row and a
// footer. Each row is its own drawing so the pane can hang a hover look and a
// click target on exactly that row, with no pointer arithmetic.

import { LIT, PLAIN_STYLE, STYLE, esc, svgDoc, textWidth, wave } from './card'
import type { Tag } from './model'
import { clip } from './model'

export type TreeRow = {
  /** A folder's key (lowercase path), what a click toggles. */
  key?: string
  /** A file's path, what a click mentions. */
  path?: string
  depth: number
  isDir: boolean
  isOpen: boolean
  name: string
  nameColor: string
  isBold: boolean
  tag?: Tag
  folderColor: string
  right: [string, string][]
  pill?: { text: string; fg: string; bg: string }
  highlight?: { bg: string; stroke: string }
  isActive: boolean
  /** Just jumped to from the touched card: a ring pulses and a shine sweeps across. */
  isFlashing?: boolean
}

/** One row's drawing, and the same row lit for the pointer when it is not lit already. */
type RowPicture = { source: string; hover?: string; alt: string }

type TreeParts = {
  header: string
  rows: RowPicture[]
  footer: string
}

const ROW_H = 32
const TOP = 46
export const MAX_SHOWN = 120

const FOLDER =
  'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
const FOLDER_OPEN =
  'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2'

function rightWidth(row: TreeRow): number {
  if (row.pill) return textWidth(row.pill.text, 12.5) + 20
  return row.right.reduce((n, [text], i) => n + textWidth(text, 13.5) + (i ? 6 : 0), 0)
}

/**
 * The jump-to shine, about four seconds (FLASH_MS in register.tsx): a bright
 * ring that pulses five times and a light band that sweeps across twice.
 */
function flashStyle(W: number): string {
  return `<style>
.fring{stroke-opacity:0;animation:fring .8s ease-in-out 5}
@keyframes fring{0%,100%{stroke-opacity:0}50%{stroke-opacity:1}}
.fsweep{opacity:0;animation:fsweep 2s ease-in-out .1s 2}
@keyframes fsweep{0%{opacity:1;transform:translateX(0)}50%{opacity:1}55%,100%{opacity:0;transform:translateX(${W + 140}px)}}
</style>`
}

function flashBody(W: number): string {
  return `<path class="fsweep" d="M-40 2 h44 l-22 28 h-44 z" fill="#ffffff" fill-opacity="0.22"/>
<rect class="fring" x="4" y="2" width="${W - 8}" height="${ROW_H - 4}" rx="8" fill="none" stroke="#f4f4f5" stroke-width="1.8"/>`
}

/** One row at the top of its own picture, behind it `lit` (a highlight) when given. */
function rowBody(row: TreeRow, W: number, lit?: { bg: string; stroke: string }, isBreathing = false): string {
  const base = 21
  const x = 12 + row.depth * 20
  let out = ''

  if (lit) {
    out += `<rect class="${isBreathing ? 'breathe' : ''}" x="4" y="2" width="${W - 8}" height="${ROW_H - 4}" rx="8" fill="${lit.bg}" stroke="${lit.stroke}" stroke-width="1"/>`
  }

  let nameX: number
  if (row.isDir) {
    const chevron = row.isOpen ? `M${x + 1} 13l4.5 5 4.5-5z` : `M${x + 3} 11l5 4.5-5 4.5z`
    out += `<path d="${chevron}" fill="#77777f"/>`
    out += `<g transform="translate(${x + 18} 7) scale(0.75)" fill="none" stroke="${row.folderColor}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${row.isOpen ? FOLDER_OPEN : FOLDER}"/></g>`
    nameX = x + 44
  } else {
    const tag = row.tag!
    const tagW = Math.max(24, textWidth(tag.label, 10) + 12)
    out += `<rect x="${x + 16}" y="7" width="${tagW}" height="18" rx="5" fill="${tag.bg}"/>`
    out += `<text x="${x + 16 + tagW / 2}" y="20" font-size="10" font-weight="700" letter-spacing="0.3" text-anchor="middle" fill="${tag.color}">${esc(tag.label)}</text>`
    nameX = x + 16 + tagW + 10
  }

  const rw = rightWidth(row)
  const room = Math.max(4, Math.floor((W - 16 - rw - 12 - nameX) / (14.5 * 0.56)))
  const name = clip(row.name, room)
  const weight = row.isBold ? 650 : 450
  out += row.isActive
    ? `<text x="${nameX}" y="${base}" font-size="14.5" font-weight="${weight}">${wave(name, row.nameColor)}</text>`
    : `<text x="${nameX}" y="${base}" font-size="14.5" font-weight="${weight}" fill="${row.nameColor}">${esc(name)}</text>`

  if (row.pill) {
    const pw = textWidth(row.pill.text, 12.5) + 20
    const px = W - 14 - pw
    out += `<rect x="${px}" y="6" width="${pw}" height="20" rx="10" fill="${row.pill.bg}"/>`
    out += `<text x="${px + pw / 2}" y="20" font-size="12.5" font-weight="650" text-anchor="middle" fill="${row.pill.fg}">${esc(row.pill.text)}</text>`
  } else if (row.right.length) {
    const spans = row.right.map(([text, color], j) => `<tspan${j ? ' dx="6"' : ''} fill="${color}">${esc(text)}</tspan>`).join('')
    out += `<text x="${W - 16}" y="${base}" font-size="13.5" text-anchor="end">${spans}</text>`
  }
  return out
}

export function treeParts(
  rows: TreeRow[],
  header: { left: string; right: string },
  footer: { hash: string } | null,
  width: number,
  empty: string,
): TreeParts {
  const W = Math.max(280, Math.round(width))
  const shown = rows.slice(0, MAX_SHOWN)
  const more = rows.length - shown.length

  const head = svgDoc(
    W,
    TOP,
    PLAIN_STYLE,
    `<text x="14" y="26" font-size="12.5" font-weight="700" letter-spacing="1.4" fill="#a1a1a8">${esc(header.left)}</text>
<text x="${W - 16}" y="26" font-size="12.5" font-weight="700" letter-spacing="1.4" text-anchor="end" fill="#a1a1a8">${esc(clip(header.right, 28))}</text>`,
  )

  const pictures = shown.map((row): RowPicture => {
    const style = (row.isActive ? STYLE : PLAIN_STYLE) + (row.isFlashing ? flashStyle(W) : '')
    const flash = row.isFlashing ? flashBody(W) : ''
    const alt = row.isDir ? `${row.name} folder, ${row.isOpen ? 'open' : 'closed'}` : row.name
    const source = svgDoc(W, ROW_H, style, rowBody(row, W, row.highlight, row.isActive) + flash)
    return row.highlight ? { source, alt } : { source, alt, hover: svgDoc(W, ROW_H, style, rowBody(row, W, LIT) + flash) }
  })

  let foot = ''
  let footH = 0
  if (shown.length === 0) {
    foot += `<text x="22" y="21" font-size="14.5" fill="#86868e">${esc(empty)}</text>`
    footH += ROW_H
  }
  if (more > 0) {
    foot += `<text x="22" y="${footH + 21}" font-size="13.5" fill="#86868e">and ${more} more (use the search box)</text>`
    footH += ROW_H
  }
  if (footer) {
    const cy = footH + 15
    foot += `<circle cx="${W - 16 - textWidth(`committed ${footer.hash}`, 13.5) - 12}" cy="${cy}" r="4" fill="#5ee08a"/><text x="${W - 16}" y="${cy + 5}" font-size="13.5" text-anchor="end"><tspan fill="#5ee08a">committed</tspan><tspan dx="5" fill="#a1a1a8">${esc(footer.hash)}</tspan></text>`
    footH += 34
  } else {
    footH += 10
  }

  return { header: head, rows: pictures, footer: svgDoc(W, footH, PLAIN_STYLE, foot) }
}
