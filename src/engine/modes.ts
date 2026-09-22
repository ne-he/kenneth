import type { VehicleKind, Venue } from '../data/types'
import { reservedFree, type Snapshot } from './occupancy'
import { priorityPrice, priorityWorthIt, type Plan } from './pricing'
import { servicesFor } from './services'
import { dropQueueMin, retrievalMin } from './valet'

/*
  The Parkir tab is one screen used four ways. The mode picks which question
  the map answers: how full is it, what does skipping the queue cost, how long
  until the valet brings the car back, how many chargers are free. The layout
  never changes, only the number on each pin and the one button on the card.
*/

export type ParkMode = 'park' | 'priority' | 'valet' | 'ev'

export const MODES: ParkMode[] = ['park', 'priority', 'valet', 'ev']

/** Whether this venue can serve this mode for this vehicle. Parking is everywhere. */
export function offers(venue: Venue, kind: VehicleKind, mode: ParkMode): boolean {
  return mode === 'park' || servicesFor(venue, kind).includes(mode)
}

/** Modes that make sense for a vehicle at all. A motorbike only parks. */
export const modesFor = (kind: VehicleKind): ParkMode[] => (kind === 'mobil' ? MODES : ['park'])

/** What a pin says in each mode. */
export type PinFact =
  | { kind: 'pct'; pct: number }
  | { kind: 'price'; price: number; worth: boolean }
  | { kind: 'wait'; min: number }
  | { kind: 'chargers'; free: number; total: number }
  | { kind: 'none' }

export function pinFact(snap: Snapshot, mode: ParkMode, kind: VehicleKind, plan: Plan, ts: number): PinFact {
  const v = snap.venue
  if (!offers(v, kind, mode)) return { kind: 'none' }
  switch (mode) {
    case 'park':
      return { kind: 'pct', pct: snap.pct }
    case 'priority':
      return { kind: 'price', price: priorityPrice(snap.occ, plan), worth: priorityWorthIt(snap.occ) }
    case 'valet':
      return { kind: 'wait', min: retrievalMin(snap.occ) }
    case 'ev':
      return { kind: 'chargers', free: chargersFree(snap, ts), total: v.ev.chargers }
  }
}

/** Free chargers right now. Same deterministic draw the venue page has always used. */
export const chargersFree = (snap: Snapshot, ts: number) =>
  reservedFree(snap.venue.ev.chargers, snap.occ * 0.9, snap.venue.id + 'e', ts)

/** Numbers for the valet card: wait at the lobby, and how long the car takes to come back once called. */
export const valetFacts = (snap: Snapshot) => ({ drop: dropQueueMin(snap.occ), back: retrievalMin(snap.occ) })
