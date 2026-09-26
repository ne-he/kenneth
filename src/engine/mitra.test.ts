import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { atWib, nextSaturdayAt } from '../lib/time'
import { AVG_STAY_H, hourlyFlow } from './mitra'
import { occupancyAt } from './occupancy'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 12, 0)
const TUE = atWib(SAT - 4 * 86_400_000, 12, 0)

describe('hourly flow', () => {
  it('never counts negative entries or more lost than entries', () => {
    for (const v of VENUES) {
      for (const r of [...hourlyFlow(v, SAT), ...hourlyFlow(v, TUE)]) {
        expect(r.entries).toBeGreaterThanOrEqual(0)
        expect(r.lost).toBeLessThanOrEqual(r.entries)
      }
    }
  })

  it('does not count cars leaving an emptying lot as entries', () => {
    const cp = VENUE_BY_ID['central-park']
    const flow = hourlyFlow(cp, SAT)
    const prev = occupancyAt(cp, atWib(SAT, cp.hours[0] - 1, 0))
    const turnover = flow.reduce((a, r) => a + (r.occ * cp.capacity) / AVG_STAY_H, 0)
    const rises = flow.reduce((a, r, i) => a + Math.max(0, r.occ - (i ? flow[i - 1].occ : prev)), 0) * cp.capacity
    const net = (flow.at(-1)!.occ - prev) * cp.capacity
    const total = flow.reduce((a, r) => a + r.entries, 0)
    // Cars in = cars that left + net change. Only hours floored at zero may push it above that.
    expect(total).toBeGreaterThanOrEqual(turnover + net - flow.length)
    // The old formula ignored every drop in occupancy and came out far higher.
    expect(total).toBeLessThan(turnover + rises - 1000)
  })
})
