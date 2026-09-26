import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { haversineKm } from '../lib/geo'
import { atWib, nextSaturdayAt, wib } from '../lib/time'
import { AVG_STAY_H, diversions, hourlyFlow, peakTs, weekHeat } from './mitra'
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

describe('peak hour', () => {
  it('follows the venue instead of a fixed 15.00', () => {
    expect(wib(peakTs(VENUE_BY_ID['central-park'], SAT)).hour).toBe(15)
    expect(wib(peakTs(VENUE_BY_ID['binus-anggrek'], TUE)).hour).toBeLessThan(13)
    expect(wib(peakTs(VENUE_BY_ID['central-park'], TUE)).hour).toBeGreaterThan(17)
  })

  it('weighs diversion targets by how full they are when drivers give up', () => {
    const anggrek = VENUE_BY_ID['binus-anggrek']
    const lost = hourlyFlow(anggrek, TUE).reduce((a, r) => a + r.lost, 0)
    const div = diversions(anggrek, TUE, lost)
    const peak = peakTs(anggrek, TUE)
    const weight = (id: 'binus-syahdan' | 'binus-kijang') => {
      const v = VENUE_BY_ID[id]
      return (1 - occupancyAt(v, peak)) / Math.max(0.3, haversineKm(anggrek.coords, v.coords))
    }
    const count = (id: string) => div.find((d) => d.to === id)!.count
    expect(count('binus-syahdan') / count('binus-kijang')).toBeCloseTo(weight('binus-syahdan') / weight('binus-kijang'), 1)
  })
})

describe('week heatmap', () => {
  it('runs Monday to Sunday of one week in WIB, whatever the device timezone', () => {
    // Saturday 05.00 WIB is still Friday in UTC, so a UTC day would shift the whole week.
    const earlySat = atWib(SAT, 5, 0)
    const rows = weekHeat(VENUE_BY_ID['central-park'], earlySat)
    expect(rows.map((r) => wib(r.ts).day)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(rows.map((r) => r.day)).toEqual([1, 2, 3, 4, 5, 6, 0])
    for (let i = 1; i < 7; i++) expect(rows[i].ts - rows[i - 1].ts).toBe(86_400_000)
    expect(rows[5].ts).toBe(earlySat)
  })
})
