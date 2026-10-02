import type { VenueId } from '../data/types'

/*
  The map-first home: a row of cards over the map with one card "in row", the
  one whose pin is lit and the camera sits on. The rules the row and the
  screen share live here, pure, so they can be tested without a DOM.
*/

/**
 * The card the row stands on: the focused one while the row still has it,
 * otherwise the first (best) one. Null for an empty row.
 */
export function cardInRow(focused: VenueId | null, ids: readonly VenueId[]): VenueId | null {
  return focused !== null && ids.includes(focused) ? focused : (ids[0] ?? null)
}

/**
 * Which card a snapped row has stopped on, from how far it scrolled. Cards
 * are `cardW` wide with `gap` between them. Clamped to the row, so a rubber
 * band before the first card or past the last one still lands on a card;
 * -1 for an empty row.
 */
export function cardIndexAt(scrollLeft: number, count: number, cardW: number, gap: number): number {
  if (count <= 0) return -1
  return Math.max(0, Math.min(count - 1, Math.round(scrollLeft / (cardW + gap))))
}
