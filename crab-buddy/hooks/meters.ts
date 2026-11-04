/**
 * The skins mod draws its context / 5h / 7d meters as one picture with a fixed
 * 132px per meter, however short its words. This packs them to the room each
 * needs, so the crab gets the rest of the row. Only the picture's spacing changes.
 */

const ITEM_W = 132
/** Ring and gap before the words, then a gap after them. */
const LEAD = 28
const TRAIL = 8
/** Rough width of one character of the 12.5px meter words. */
const CHAR_PX = 6.7

type Node = { type?: string; props?: { alt?: unknown; source?: unknown; width?: unknown }; children?: unknown }

/** The meter picture repacked, or undefined when `source` isn't one. */
export function tighten(source: string): { source: string; width: number } | undefined {
  const head = /^<svg [^>]*>(<style>.*?<\/style>)?/.exec(source)
  if (!head || !source.endsWith('</svg>')) return undefined
  const body = source.slice(head[0].length, -'</svg>'.length)
  // Each meter starts with its faint background ring.
  const starts = [...body.matchAll(/<circle cx="[\d.]+" cy="15" r="9" fill="none" stroke="[^"]*" stroke-opacity="\.25"/g)].map(m => m.index!)
  if (starts.length === 0) return undefined
  let x = 0
  const items = starts.map((at, i) => {
    const item = body.slice(at, starts[i + 1] ?? body.length)
    const words = /<text[^>]*><tspan[^>]*>([^<]*)<\/tspan><tspan[^>]*>([^<]*)<\/tspan><\/text>/.exec(item)
    const chars = words ? (words[1]! + words[2]!).length : 12
    const moved = `<g transform="translate(${x - i * ITEM_W},0)">${item}</g>`
    x += Math.round(LEAD + chars * CHAR_PX + TRAIL)
    return moved
  })
  const width = x
  const svgOpen = head[0].slice(0, head[0].indexOf('>') + 1)
    .replace(/ width="\d+"/, ` width="${width}"`)
    .replace(/viewBox="0 ([\d.]+) \d+ /, `viewBox="0 $1 ${width} `)
  return { source: svgOpen + (head[1] ?? '') + items.join('') + '</svg>', width }
}

const isMeters = (x: unknown) => {
  const n = x as Node | null
  return n?.type === 'Svg' && typeof n.props?.source === 'string' && n.props.source.includes('<circle class="fill"') && /\d+%/.test(String(n.props.alt ?? ''))
}

/**
 * The band tree with the skins meters repacked, and their new width; the tree as
 * it was (width undefined) when it has none.
 */
export function packMeters<T>(tree: T): { tree: T; width?: number } {
  let width: number | undefined
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) {
      let changed = false
      const out = x.map(v => {
        const w = walk(v)
        if (w !== v) changed = true
        return w
      })
      return changed ? out : x
    }
    const n = x as Node | null
    if (!n || typeof n !== 'object') return x
    if (isMeters(n)) {
      const packed = tighten(n.props!.source as string)
      if (!packed) return x
      width = packed.width
      return { ...n, props: { ...n.props, source: packed.source, width: packed.width } }
    }
    if (n.children === undefined) return x
    const kids = walk(n.children)
    return kids === n.children ? x : { ...n, children: kids }
  }
  return { tree: walk(tree) as T, width }
}
