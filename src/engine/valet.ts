import type { VenueId } from '../data/types'

/*
  Valet by the KENNETH runner fleet.

  A runner in a KENNETH uniform meets you at the lobby, checks the booking
  code against your plate, takes the key and parks the car in Zona KENNETH,
  a few steps from the lift. When you are done you call the car from the
  app and the runner brings it back. The fee is paid in the app, the normal
  parking tariff still runs as usual. Face ID from the team mockup stays out:
  the code and the plate are enough.
*/

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Minutes a runner needs to bring the car back. Short, the car sits in the zone next to the lobby. */
export function retrievalMin(occ: number): number {
  return Math.round(4 + 6 * clamp01((occ - 0.55) / 0.4))
}

/** Minutes until a free runner reaches you at the lobby. */
export function dropQueueMin(occ: number): number {
  return Math.round(1 + 4 * clamp01((occ - 0.5) / 0.45))
}

const RUNNERS = ['Andi', 'Bayu', 'Dimas', 'Fajar', 'Rizky', 'Sari', 'Tika', 'Yoga']

/** The runner on a ticket, with a short badge number. Demo names, stable per ticket. */
export function runnerFor(ticketId: string): { name: string; badge: string } {
  let h = 0
  for (const ch of ticketId) h = (h * 33 + ch.charCodeAt(0)) >>> 0
  return { name: RUNNERS[h % RUNNERS.length], badge: `R-${String(100 + (h % 900))}` }
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

/** The runner is at the lobby from this long before the booked time, so the key can change hands. */
export const HANDOVER_EARLY_MIN = 30

/** True when the key can be handed over: still booked and the arrival time is close. */
export const canHandOver = (t: ValetTicket, now: number) =>
  valetPhase(t, now) === 'booked' && now >= t.arriveAt - HANDOVER_EARLY_MIN * 60_000

/** True while the ticket still needs the user: booked, car with the valet, or on its way back. */
export const valetOpen = (t: ValetTicket, now: number) =>
  ['booked', 'parked', 'fetching', 'ready'].includes(valetPhase(t, now))
