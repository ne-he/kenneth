import type { Venue } from '../data/types'
import { parkingCost } from './pricing'

const HOUR = 3_600_000

/**
 * Where a running parking session stands on the tariff: what it costs now,
 * what it becomes when the next hour starts, and how long until then. The
 * first hour is billed the moment the barrier opens, like the real tariffs.
 */
export function sessionNow(venue: Venue, elapsedMs: number) {
  const billed = Math.max(1, Math.ceil(Math.max(0, elapsedMs) / HOUR))
  const cost = parkingCost(venue, billed)
  return {
    billed,
    cost,
    nextCost: parkingCost(venue, billed + 1),
    msToNext: billed * HOUR - Math.max(0, elapsedMs),
    /** Share of the current billed hour already used, 0..1. */
    hourUsed: (Math.max(0, elapsedMs) - (billed - 1) * HOUR) / HOUR,
  }
}

/**
 * The bill when leaving: hours billed, hours the merchant's parking perk
 * covers, and what is left to pay. A perk covers whole hours from the start.
 */
export function checkout(venue: Venue, elapsedMs: number, freeHours = 0) {
  const { billed, cost } = sessionNow(venue, elapsedMs)
  const covered = Math.min(billed, Math.max(0, Math.floor(freeHours)))
  const paid = covered >= billed ? 0 : cost - (covered > 0 ? parkingCost(venue, covered) : 0)
  return { billed, gross: cost, covered, saved: cost - paid, paid }
}
