import type { Promo } from '../data/promos'
import type { Venue } from '../data/types'
import { hourlyFlow } from './mitra'

/*
  How a promo does, estimated from the same hourly flow as the venue
  dashboard: of the cars that come in while it runs, some open the place page
  and see it, some tap it, and some use the parking perk. The rates are model
  assumptions, the same for every merchant, until real taps are counted.
*/
export const SEE_RATE = 0.35
export const TAP_RATE = 0.18
export const PERK_RATE = 0.3

export interface PromoStats {
  seen: number
  taps: number
  perks: number
}

export function promoStats(promo: Promo, venue: Venue, dayTs: number): PromoStats {
  const cars = hourlyFlow(venue, dayTs)
    .filter((r) => r.hour >= promo.from && r.hour < promo.to)
    .reduce((a, r) => a + r.entries, 0)
  // Merchants differ a little; a stable nudge from the id keeps two promos from reading the same.
  let h = 0
  for (const ch of promo.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const nudge = 0.85 + (h % 31) / 100
  const seen = Math.round(cars * SEE_RATE * nudge)
  const taps = Math.round(seen * TAP_RATE)
  return { seen, taps, perks: promo.parking ? Math.round(taps * PERK_RATE) : 0 }
}
