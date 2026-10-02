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
