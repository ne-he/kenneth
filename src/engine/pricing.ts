import type { Venue } from '../data/types'
import { wib } from '../lib/time'
import { baseQueueMin } from './occupancy'

/*
  Pricing rules straight from the team's strategy doc.

  - Parking tariff: the venue's normal rate, shown as an estimate.
  - Priority entry: Rp15rb to Rp30rb per use, moves with the crowd. Only sold
    where there is an actual queue, because it only has value there.
  - Premium (Rp29rb per month) sells things that never run out: booking up
    to 7 days ahead, 40% off each booking, early notifications.
  - Never sell the whole lane: 24 of every 30 entries per 15 minute window,
    the rest is a buffer for people who arrive late.
*/

export const PRIORITY_MIN = 15_000
export const PRIORITY_MAX = 30_000
export const PREMIUM_MONTHLY = 29_000
export const PREMIUM_DISCOUNT = 0.4
export const WINDOW_MINUTES = 15
export const LANE_CAPACITY = 30
export const LANE_SELLABLE = 24
export const FREE_BOOKING_AHEAD_H = 2
export const PREMIUM_BOOKING_AHEAD_D = 7

export type Plan = 'free' | 'premium'

export function parkingCost(venue: Venue, hours: number): number {
  const billed = Math.max(1, Math.ceil(hours))
  return venue.tariff.firstHour + (billed - 1) * venue.tariff.nextHour
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step

/** Dynamic priority price for a given occupancy, before any plan discount. */
export function priorityBasePrice(occ: number): number {
  const x = Math.min(1, Math.max(0, (occ - 0.8) / 0.18))
  return roundTo(PRIORITY_MIN + x * (PRIORITY_MAX - PRIORITY_MIN), 1000)
}

export function priorityPrice(occ: number, plan: Plan): number {
  const base = priorityBasePrice(occ)
  return plan === 'premium' ? roundTo(base * (1 - PREMIUM_DISCOUNT), 500) : base
}

/** Priority entry only makes sense when the normal lane actually queues. */
export const priorityWorthIt = (occ: number) => baseQueueMin(occ) >= 5

/** Sellable entries left in the window starting at `windowTs`. Deterministic. */
export function laneSeatsLeft(venue: Venue, windowTs: number, occ: number): number {
  const p = wib(windowTs)
  const salt = (venue.id.length * 7 + p.hour * 13 + Math.floor(p.minute / 15) * 5) % 9
  const demand = Math.round(LANE_SELLABLE * Math.min(1, Math.max(0, (occ - 0.7) / 0.28)))
  return Math.min(LANE_SELLABLE, Math.max(0, LANE_SELLABLE - demand + (salt % 4)))
}

export function formatRupiah(v: number, compact = false): string {
  if (compact && v >= 1_000_000) {
    const m = v / 1_000_000
    return `Rp${Number.isInteger(m) ? m : m.toFixed(1).replace('.', ',')}jt`
  }
  if (compact && v >= 1000) {
    const k = v / 1000
    return `Rp${Number.isInteger(k) ? k : k.toFixed(1).replace('.', ',')}rb`
  }
  return `Rp${v.toLocaleString('id-ID')}`
}
