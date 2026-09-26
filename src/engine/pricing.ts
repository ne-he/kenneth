import type { Venue } from '../data/types'

/*
  Pricing rules.

  - Parking tariff: the venue's normal rate, shown as an estimate.
  - Zona KENNETH: Rp15rb to Rp30rb per booking on top of the normal tariff,
    moves with the crowd. The bay is guaranteed, so it sells even on a quiet
    day, just at the low end.
  - Premium (Rp29rb per month) sells things that never run out: booking up
    to 7 days ahead, 40% off each booking, early notifications.
*/

export const ZONE_MIN = 15_000
export const ZONE_MAX = 30_000
export const PREMIUM_MONTHLY = 29_000
export const PREMIUM_DISCOUNT = 0.4
export const FREE_BOOKING_AHEAD_H = 2
export const PREMIUM_BOOKING_AHEAD_D = 7

export type Plan = 'free' | 'premium'

export function parkingCost(venue: Venue, hours: number): number {
  const billed = Math.max(1, Math.ceil(hours))
  return venue.tariff.firstHour + (billed - 1) * venue.tariff.nextHour
}

const roundTo = (v: number, step: number) => Math.round(v / step) * step

/** Dynamic zone price for a given occupancy, before any plan discount. */
export function zoneBasePrice(occ: number): number {
  const x = Math.min(1, Math.max(0, (occ - 0.6) / 0.38))
  return roundTo(ZONE_MIN + x * (ZONE_MAX - ZONE_MIN), 1000)
}

export function zonePrice(occ: number, plan: Plan): number {
  const base = zoneBasePrice(occ)
  return plan === 'premium' ? roundTo(base * (1 - PREMIUM_DISCOUNT), 500) : base
}

/** Worth pointing out on the normal parking card: the lot is busy enough that a sure bay helps. */
export const zoneWorthIt = (occ: number) => occ >= 0.8

// Round before the integer check, so 1.96 reads 2, not 2,0.
function oneDecimal(x: number): string {
  const r = Math.round(x * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',')
}

export function formatRupiah(v: number, compact = false): string {
  if (compact && v >= 1_000_000) return `Rp${oneDecimal(v / 1_000_000)}jt`
  if (compact && v >= 1000) return `Rp${oneDecimal(v / 1000)}rb`
  return `Rp${v.toLocaleString('id-ID')}`
}
