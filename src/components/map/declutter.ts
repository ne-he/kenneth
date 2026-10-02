import type { LabelDir } from '../../data/types'

/** Where a pin's label sits, relative to its point, in screen pixels. */
export type Offset = [number, number]

export interface PinBox {
  id: string
  /** The venue on screen, in pixels. */
  x: number
  y: number
  /** Size of the label. Zero for a bare dot, which never moves but still keeps labels off it. */
  w: number
  h: number
  /** Side to try first when the point itself is taken. */
  dir: LabelDir
  /** False keeps the label off its own point, so the dot under it stays visible. */
  onPoint?: boolean
  /** Space between the point and a label moved beside it. */
  gap?: number
  /** A spot that never moves, such as a gate chip. */
  fixed?: Offset
}

const SIDE: Record<LabelDir, [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
  ne: [1, -1],
  nw: [-1, -1],
  se: [1, 1],
  sw: [-1, 1],
}

const ORDER: LabelDir[] = ['e', 'w', 'n', 's', 'ne', 'nw', 'se', 'sw']

/** Size of the area around each point that labels stay off, so no place hides under another's label. */
const DOT = 10

/**
 * Offset that puts a label right beside its point, `gap` pixels clear of it.
 * On a diagonal the rounded end of the pill sits straight above or below the point.
 */
export function beside(dir: LabelDir, w: number, h: number, gap: number): Offset {
  const [sx, sy] = SIDE[dir]
  if (sy === 0) return [sx * (w / 2 + gap), 0]
  if (sx === 0) return [0, sy * (h / 2 + gap)]
  return [sx * (w / 2 - h / 2), sy * (h / 2 + gap)]
}

interface Rect {
  l: number
  t: number
  r: number
  b: number
}

const rect = (cx: number, cy: number, w: number, h: number): Rect => ({
  l: cx - w / 2,
  t: cy - h / 2,
  r: cx + w / 2,
  b: cy + h / 2,
})

const overlap = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t))

/**
 * Labels sit on their own point when there is room. When two places are a
 * few hundred metres apart and the map is zoomed out, the later one moves
 * beside its point instead, its preferred side first, so nothing stacks and
 * no leader line is needed. Pins are placed in the order given, so pass fixed
 * chips first, then the selected pin.
 */
export function placePins(pins: PinBox[], pad = 2): Map<string, Offset> {
  const out = new Map<string, Offset>()
  const dots = pins.map((p) => rect(p.x, p.y, DOT, DOT))
  const placed: Rect[] = []
  pins.forEach((p, i) => {
    if (p.w === 0 || p.h === 0) {
      out.set(p.id, [0, 0])
      return
    }
    const gap = p.gap ?? 3
    const sides = [p.dir, ...ORDER.filter((d) => d !== p.dir)].map((d) => beside(d, p.w, p.h, gap))
    const options: Offset[] = p.fixed ? [p.fixed] : p.onPoint === false ? sides : [[0, 0], ...sides]
    let best = options[0]
    let bestBox = rect(p.x + best[0], p.y + best[1], p.w + pad * 2, p.h + pad * 2)
    let bestScore = Infinity
    for (const o of options) {
      const box = rect(p.x + o[0], p.y + o[1], p.w + pad * 2, p.h + pad * 2)
      let score = 0
      for (const q of placed) score += overlap(box, q)
      dots.forEach((d, j) => {
        if (j !== i) score += overlap(box, d)
      })
      if (score < bestScore) {
        best = o
        bestBox = box
        bestScore = score
      }
      if (score === 0) break
    }
    placed.push(bestBox)
    out.set(p.id, best)
  })
  return out
}
