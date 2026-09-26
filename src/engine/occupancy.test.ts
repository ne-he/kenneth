import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { atWib, clock, nextSaturdayAt, wib } from '../lib/time'
import {
  THRESHOLD,
  defaultGate,
  forKind,
  forecastDay,
  gateQueueMin,
  nextRelief,
  occupancyAt,
  reservedFree,
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

  it('only promises relief at a quarter hour when the main gate really is calm', () => {
    // Central Park at 12.54 used to say 16.15, when the main gate still had a 6 minute queue.
    for (const v of VENUES) {
      for (let m = 0; m < 24 * 60; m += 7) {
        const ts = atWib(SAT_1407, 0, 0) + m * 60_000
        const relief = nextRelief(v, ts)
        if (relief === null) continue
        const where = `${v.id} asked at ${clock(ts)}, told ${clock(relief)}`
        expect(relief, where).toBeGreaterThan(ts)
        expect(wib(relief).minute % 15, where).toBe(0)
        const occ = occupancyAt(v, relief)
        expect(gateQueueMin(defaultGate(v), occ), where).toBeLessThanOrEqual(3)
        expect(statusOf(occ), where).not.toBe('penuh')
      }
    }
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

describe('campuses', () => {
  const anggrek = VENUE_BY_ID['binus-anggrek']

  it('is packed on a weekday morning and calm on a Saturday afternoon', () => {
    expect(snapshot(anggrek, TUE_1000).status).toBe('penuh')
    expect(snapshot(anggrek, SAT_1407).status).toBe('lega')
  })

  it('forecasts from its own opening hour, not the mall hours', () => {
    const f = forecastDay(anggrek, TUE_1000)
    expect(f[0].hour).toBe(6)
    expect(f.at(-1)!.hour).toBe(21)
  })

  it('stays nearly empty on a Sunday', () => {
    const sunday = atWib(SAT_1407 + 86_400_000, 11, 0)
    expect(occupancyAt(anggrek, sunday)).toBeLessThan(0.3)
  })
})

describe('motorbike view', () => {
  it('swaps in the motorbike bays, fill level and tariff, and keeps the rest', () => {
    const cp = VENUE_BY_ID['central-park']
    const moto = forKind(cp, 'motor')
    expect(moto.capacity).toBe(cp.motor.capacity)
    expect(moto.tariff.firstHour).toBe(cp.motor.firstHour)
    expect(moto.gates).toBe(cp.gates)
    expect(forKind(cp, 'mobil')).toBe(cp)
  })

  it('gives a different number when the motorbike bays fill differently', () => {
    const syahdan = VENUE_BY_ID['binus-syahdan']
    expect(snapshot(forKind(syahdan, 'motor'), TUE_1000).free).not.toBe(snapshot(syahdan, TUE_1000).free)
  })
})


describe('reserved bays', () => {
  it('counts whole bays, never a fraction, and never more than exist', () => {
    for (const v of VENUES) {
      for (const ts of [SAT_1407, TUE_1000, SAT_1407 + 3 * 3_600_000]) {
        const occ = occupancyAt(v, ts)
        for (const [total, salt] of [
          [v.ev.chargers, 'e'],
          [v.accessible.difabel, 'd'],
          [v.accessible.ibuHamil, 'h'],
        ] as const) {
          const free = reservedFree(total, occ, v.id + salt, ts)
          expect(Number.isInteger(free)).toBe(true)
          expect(free).toBeGreaterThanOrEqual(0)
          expect(free).toBeLessThanOrEqual(total)
        }
      }
    }
  })
})
