import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { atWib, nextSaturdayAt, wib } from '../lib/time'
import {
  THRESHOLD,
  forecastDay,
  nextRelief,
  occupancyAt,
  snapshot,
  statusOf,
} from './occupancy'

// A fixed Saturday 14:07 WIB, the scenario from the team's strategy doc.
const SAT_1407 = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const TUE_1000 = atWib(SAT_1407 - 4 * 86_400_000, 10, 0)

describe('time helpers', () => {
  it('lands on a Saturday at 14:07 WIB', () => {
    const p = wib(SAT_1407)
    expect(p.day).toBe(6)
    expect(p.hour).toBe(14)
    expect(p.minute).toBe(7)
  })
})

describe('occupancy model', () => {
  it('is deterministic for the same venue and time', () => {
    const cp = VENUE_BY_ID['central-park']
    expect(occupancyAt(cp, SAT_1407)).toBe(occupancyAt(cp, SAT_1407))
  })

  it('stays inside 0..1 for every venue across a whole week', () => {
    for (const v of VENUES) {
      for (let h = 0; h < 24 * 7; h++) {
        const occ = occupancyAt(v, SAT_1407 + h * 3_600_000)
        expect(occ).toBeGreaterThan(0)
        expect(occ).toBeLessThan(1)
      }
    }
  })

  it('reproduces the strategy doc scenario on Saturday afternoon', () => {
    const cp = snapshot(VENUE_BY_ID['central-park'], SAT_1407)
    const neo = snapshot(VENUE_BY_ID['neo-soho'], SAT_1407)
    const mta = snapshot(VENUE_BY_ID['taman-anggrek'], SAT_1407)
    expect(cp.status).toBe('penuh')
    expect(cp.pct).toBeGreaterThanOrEqual(92)
    expect(cp.queueMin).toBeGreaterThan(10)
    expect(neo.status).toBe('lega')
    expect(mta.status).toBe('lega')
  })

  it('points to a quieter gate when the main gate is jammed', () => {
    const cp = snapshot(VENUE_BY_ID['central-park'], SAT_1407)
    expect(cp.bestGate.id).toBe('cp-3')
    expect(cp.bestGateQueueMin).toBeLessThan(cp.queueMin / 3)
  })

  it('is much calmer on a Tuesday morning', () => {
    const cp = snapshot(VENUE_BY_ID['central-park'], TUE_1000)
    expect(cp.status).toBe('lega')
    expect(cp.queueMin).toBeLessThan(2)
  })

  it('finds the late afternoon relief window for a full venue', () => {
    const relief = nextRelief(VENUE_BY_ID['central-park'], SAT_1407)
    expect(relief).not.toBeNull()
    const h = wib(relief!).hour
    expect(h).toBeGreaterThanOrEqual(16)
    expect(h).toBeLessThanOrEqual(17)
  })

  it('returns no relief when the venue is already fine', () => {
    expect(nextRelief(VENUE_BY_ID['neo-soho'], SAT_1407)).toBeNull()
  })

  it('builds an hourly forecast from opening to closing', () => {
    const f = forecastDay(VENUE_BY_ID['grand-indonesia'], SAT_1407)
    expect(f[0].hour).toBe(10)
    expect(f.at(-1)!.hour).toBe(22)
    expect(f.length).toBe(13)
  })

  it('maps thresholds to status labels', () => {
    expect(statusOf(THRESHOLD.ramai - 0.01)).toBe('lega')
    expect(statusOf(THRESHOLD.ramai)).toBe('ramai')
    expect(statusOf(THRESHOLD.penuh)).toBe('penuh')
  })
})
