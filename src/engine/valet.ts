import type { VenueId } from '../data/types'

/*
  Valet, the honest version.

  The team mockup had a peer to peer runner and a Face ID key handover. That
  needs a fleet nobody has and biometrics nobody should collect. What people
  actually hate about valet at a Jakarta mall on Saturday is the wait for the
  car at the end, so KENNETH does two things with the building's own valet:
  book the drop-off, and call the car back before walking down to the lobby.
  The fee is paid at the valet desk, never in the app.
*/

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Minutes a runner needs to bring the car back up, longer when the basement is packed. */
export function retrievalMin(occ: number): number {
  return Math.round(6 + 14 * clamp01((occ - 0.55) / 0.4))
}

/** Minutes spent waiting at the lobby before a runner takes the key. */
export function dropQueueMin(occ: number): number {
  return Math.round(1 + 7 * clamp01((occ - 0.5) / 0.45))
}

/** A booked drop-off is held this long after the chosen time, then lapses. */
export const VALET_HOLD_MIN = 45

export interface ValetTicket {
  id: string
  venueId: VenueId
  lobby: string
  arriveAt: number
  price: number
  token: string
  createdAt: number
  droppedAt?: number
  requestedAt?: number
  readyAt?: number
  closedAt?: number
  status: 'active' | 'done' | 'cancelled'
}

export type ValetPhase = 'booked' | 'lapsed' | 'parked' | 'fetching' | 'ready' | 'done' | 'cancelled'

/** Where a valet ticket is right now. Derived from timestamps, so it never goes stale. */
export function valetPhase(t: ValetTicket, now: number): ValetPhase {
  if (t.status !== 'active') return t.status
  if (t.requestedAt && t.readyAt) return now >= t.readyAt ? 'ready' : 'fetching'
  if (t.droppedAt) return 'parked'
  return now > t.arriveAt + VALET_HOLD_MIN * 60_000 ? 'lapsed' : 'booked'
}

/** True while the ticket still needs the user: booked, car with the valet, or on its way back. */
export const valetOpen = (t: ValetTicket, now: number) =>
  ['booked', 'parked', 'fetching', 'ready'].includes(valetPhase(t, now))
