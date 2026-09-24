import type { Gate, Venue } from '../data/types'
import { wib } from '../lib/time'

/*
  Zona KENNETH, the idea version.

  Think of the Lexus or BMW bays some malls keep right next to the lobby, only
  here the brand is KENNETH. The building sets aside a block of bays on its
  first parking level, near the main lift lobby, and only KENNETH bookings
  park there. You book a bay for an arrival time, the barrier reads your
  plate, green signs lead you to the bay, and it is yours for as long as you
  stay. The rest of the car park works exactly as before.

  Nobody has signed this yet. The size of each zone below is a demo number.
*/

/** Bookings are sold per half hour of arrival. */
export const SLOT_MIN = 30
/** The bay waits this long after the booked arrival time, then goes back on sale. */
export const ZONE_HOLD_MIN = 30

export interface KennethZone {
  level: string
  lobby: string
  /** The entrance with the KENNETH plate reader, closest to the zone. */
  gate: Gate
  bays: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The zone at a venue, if it has one. Malls only, campuses stay information only. */
export function zoneOf(venue: Venue): KennethZone | null {
  if (venue.category !== 'mall') return null
  const gate = venue.gates.find((g) => g.priorityLane)
  if (!gate) return null
  return {
    level: venue.levels[0],
    lobby: venue.valet?.lobbies[0] ?? venue.lobbies[0],
    gate,
    // About one bay in a hundred, never so small it sells out instantly, never a whole floor.
    bays: clamp(Math.round(venue.capacity / 100), 12, 40),
  }
}

/** Bays still free for arrivals in the slot starting at `ts`. Deterministic, so the demo repeats. */
export function baysLeft(venue: Venue, ts: number, occ: number): number {
  const zone = zoneOf(venue)
  if (!zone) return 0
  const p = wib(ts)
  const salt = (venue.id.length * 7 + p.hour * 13 + Math.floor(p.minute / SLOT_MIN) * 5) % 5
  const taken = Math.round(zone.bays * clamp((occ - 0.45) / 0.5, 0, 1))
  return clamp(zone.bays - taken + salt, 0, zone.bays)
}

/** The bay a booking gets, e.g. K-07. Stable for the same booking id. */
export function bayFor(bookingId: string, venue: Venue): string {
  const bays = zoneOf(venue)?.bays ?? 12
  let h = 0
  for (const ch of bookingId) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return `K-${String(1 + (h % bays)).padStart(2, '0')}`
}

/** The bay on a saved booking. v0.3 passes had none, so they get a stable one from their id. */
export const bayOf = (pass: { id: string; bay?: string }, venue: Venue) => pass.bay ?? bayFor(pass.id, venue)
