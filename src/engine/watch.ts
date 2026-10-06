/*
  "Kabari kalau ada yang batal", a Premium promise. In the real product a
  bay comes back when another booking is cancelled. In the demo nobody else
  is booking, so a watched sold-out slot gets a bay back a minute or two
  after you ask: soon enough to see it happen on stage, never later than a
  quarter of an hour before the slot itself.
*/

const MIN = 60_000

/** When the demo frees a bay in a watched slot. Deterministic per watch, so a demo repeats. */
export function freesAtFor(id: string, now: number, slot: number): number {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const soon = now + MIN + (h % MIN)
  const latest = slot - 15 * MIN
  return Math.max(now + MIN / 2, Math.min(soon, latest))
}
