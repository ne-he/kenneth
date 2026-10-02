import type { LabelDir } from '../../data/types'

/** Where a label sits, as the offset of its centre from its point, in screen pixels. */
export type Offset = [number, number]

export interface Label {
  id: string
  /** The place on screen, in pixels. */
  x: number
  y: number
  /** Size of the label. */
  w: number
  h: number
  /** Spots to try, best first. */
  spots: Offset[]
  /** Never dropped: takes the least crowded spot when none is free. For the selected place and gate chips. */
  keep?: boolean
}

/** A point labels must not cover, such as another place or you-are-here. */
export interface Dot {
  id: string
  x: number
  y: number
  r: number
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

/**
 * A place label hangs off its dot: the dot sits `inset` pixels in from one
 * end of the pill. Right of the dot first, mirrored to the left when that
 * side is taken.
 */
export const hang = (w: number, inset: number): Offset[] => [
  [w / 2 - inset, 0],
  [-(w / 2 - inset), 0],
]

/** Above first, then round the point, for a label that must stay but should not hide its dot. */
export const around = (w: number, h: number, gap: number): Offset[] =>
  (['n', 'ne', 'nw', 'e', 'w', 's', 'se', 'sw'] as const).map((d) => beside(d, w, h, gap))

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
 * Every place is a dot, and its label only shows where there is room. Labels
 * are handled in the order given, so pass them by priority: a label that
 * would cover an earlier one, or another place's dot, is dropped (null) and
 * that place stays a bare dot until you zoom in. Nothing moves away from its
 * point, so no leader lines are needed. With `view` (the map size), a spot
 * that runs off the edge counts as taken too.
 */
export function placeLabels(
  labels: Label[],
  dots: Dot[],
  view?: { w: number; h: number },
  pad = 2,
): Map<string, Offset | null> {
  const out = new Map<string, Offset | null>()
  const placed: Rect[] = []
  const inside = view && { l: 0, t: 0, r: view.w, b: view.h }
  const dotBoxes = dots.map((d) => ({ id: d.id, box: rect(d.x, d.y, d.r * 2, d.r * 2) }))
  for (const l of labels) {
    let best: Offset | null = null
    let bestBox: Rect | null = null
    let bestScore = Infinity
    for (const s of l.spots) {
      const box = rect(l.x + s[0], l.y + s[1], l.w + pad * 2, l.h + pad * 2)
      let score = 0
      for (const q of placed) score += overlap(box, q)
      for (const d of dotBoxes) if (d.id !== l.id) score += overlap(box, d.box)
      if (inside) score += (box.r - box.l) * (box.b - box.t) - overlap(box, inside)
      if (score < bestScore) {
        best = s
        bestBox = box
        bestScore = score
      }
      if (score === 0) break
    }
    if (!best || !bestBox || (bestScore > 0 && !l.keep)) {
      out.set(l.id, null)
      continue
    }
    placed.push(bestBox)
    out.set(l.id, best)
  }
  return out
}
