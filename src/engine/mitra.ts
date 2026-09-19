import type { Venue, VenueId } from '../data/types'
import { VENUES } from '../data/venues'
import { haversineKm } from '../lib/geo'
import { atWib } from '../lib/time'
import { THRESHOLD, forecastDay, gateQueueMin, occupancyAt, statusOf } from './occupancy'
import { LANE_SELLABLE, WINDOW_MINUTES, priorityBasePrice, priorityWorthIt } from './pricing'

/*
  Numbers for the partner dashboard, the B2B product. Everything is derived
  from the same occupancy model the app uses, and everything is aggregate:
  counts per hour, never a person.

  Assumptions (shown on the page):
  - Average stay 2.6 hours, so each hour about occupancy / 2.6 of the lot turns over.
  - Once a lot passes 88% some arriving drivers give up. At 100% about 22%
    of arrivals leave. That share is linear in between.
  - Of the drivers who give up, KENNETH users are redirected to nearby
    venues that are not full, weighted by distance, same group first.
*/

export const AVG_STAY_H = 2.6
const GIVE_UP_FROM = 0.88
const GIVE_UP_MAX = 0.22

export interface HourRow {
  hour: number
  occ: number
  entries: number
  lost: number
}

export function hourlyFlow(venue: Venue, dayTs: number): HourRow[] {
  const series = forecastDay(venue, dayTs)
  return series.map((p, i) => {
    const prev = i === 0 ? occupancyAt(venue, atWib(dayTs, venue.hours[0] - 1, 0)) : series[i - 1].occ
    const growth = Math.max(0, p.occ - prev) * venue.capacity
    const turnover = (p.occ * venue.capacity) / AVG_STAY_H
    const entries = Math.round(growth + turnover)
    const giveUp = Math.max(0, Math.min(1, (p.occ - GIVE_UP_FROM) / (1 - GIVE_UP_FROM))) * GIVE_UP_MAX
    return { hour: p.hour, occ: p.occ, entries, lost: Math.round(entries * giveUp) }
  })
}

export interface Diversion {
  to: VenueId
  count: number
}

/** Where the drivers who gave up at `venue` were sent instead. */
export function diversions(venue: Venue, dayTs: number, lost: number): Diversion[] {
  const peak = atWib(dayTs, 15, 0)
  // A mall loses drivers to other malls, a campus to the other campuses.
  const candidates = VENUES.filter(
    (v) => v.id !== venue.id && v.category === venue.category && statusOf(occupancyAt(v, peak)) !== 'penuh',
  ).map((v) => {
    const km = haversineKm(venue.coords, v.coords)
    const sameGroup = venue.group && v.group === venue.group ? 2.2 : 1
    return { v, w: (sameGroup / Math.max(0.3, km)) * (1 - occupancyAt(v, peak)) }
  })
  const total = candidates.reduce((a, c) => a + c.w, 0) || 1
  return candidates
    .map((c) => ({ to: c.v.id, count: Math.round((lost * c.w) / total) }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
}

export interface GateShare {
  id: string
  name: string
  without: number
  with: number
}

/**
 * Share of arrivals per gate at the day's peak, before and after steering.
 * Without the app drivers follow habit (gate pull). With the app a part of
 * them is sent to whichever gate has the shortest queue, which flattens it.
 */
export function gateBalance(venue: Venue, dayTs: number, steered = 0.45): GateShare[] {
  const peak = atWib(dayTs, 15, 0)
  const occ = occupancyAt(venue, peak)
  const pullSum = venue.gates.reduce((a, g) => a + g.pull, 0)
  const inv = venue.gates.map((g) => 1 / Math.max(0.2, gateQueueMin(g, occ)))
  const invSum = inv.reduce((a, b) => a + b, 0)
  return venue.gates.map((g, i) => {
    const without = g.pull / pullSum
    const target = inv[i] / invSum
    return { id: g.id, name: g.name, without, with: without * (1 - steered) + target * steered }
  })
}

export function weekHeat(venue: Venue, anyTs: number) {
  // Monday first, the way building managers read a week.
  const order = [1, 2, 3, 4, 5, 6, 0]
  const sunday = anyTs - new Date(anyTs + 7 * 3_600_000).getUTCDay() * 86_400_000
  return order.map((day) => {
    const ts = sunday + day * 86_400_000
    const hours = []
    for (let h = venue.hours[0]; h < venue.hours[1]; h++) hours.push({ hour: h, occ: occupancyAt(venue, atWib(ts, h, 0)) })
    return { day, ts, hours }
  })
}

/** Priority entry tickets the lane could sell today and their gross value. */
export function priorityDay(venue: Venue, dayTs: number) {
  if (!venue.gates.some((g) => g.priorityLane)) return { tickets: 0, gross: 0 }
  let tickets = 0
  let gross = 0
  for (let h = venue.hours[0]; h < venue.hours[1]; h++) {
    for (let m = 0; m < 60; m += WINDOW_MINUTES) {
      const ts = atWib(dayTs, h, m)
      const occ = occupancyAt(venue, ts)
      if (!priorityWorthIt(occ)) continue
      const sold = Math.round(LANE_SELLABLE * 0.55)
      tickets += sold
      gross += sold * priorityBasePrice(occ)
    }
  }
  return { tickets, gross }
}

export const FULL_LINE = THRESHOLD.penuh
export const BUSY_LINE = THRESHOLD.ramai
