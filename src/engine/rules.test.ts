import { describe, expect, it } from 'vitest'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../data/venues'
import { atWib, nextSaturdayAt } from '../lib/time'
import { checkGage, dateParity, plateParity } from './gage'
import { CO2_KG_PER_L, impactOf, sumImpact } from './impact'
import {
  PRIORITY_MAX,
  PRIORITY_MIN,
  laneSeatsLeft,
  LANE_SELLABLE,
  parkingCost,
  priorityBasePrice,
  priorityPrice,
  priorityWorthIt,
} from './pricing'
import { alternativesFor, rankVenues } from './recommend'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const cp = VENUE_BY_ID['central-park']
const gi = VENUE_BY_ID['grand-indonesia']

describe('pricing', () => {
  it('charges the first hour even for a short stop', () => {
    expect(parkingCost(cp, 0.2)).toBe(5000)
    expect(parkingCost(cp, 3)).toBe(5000 + 2 * 4000)
  })

  it('keeps priority entry inside Rp15rb to Rp30rb', () => {
    for (let occ = 0; occ <= 1; occ += 0.05) {
      const p = priorityBasePrice(occ)
      expect(p).toBeGreaterThanOrEqual(PRIORITY_MIN)
      expect(p).toBeLessThanOrEqual(PRIORITY_MAX)
    }
  })

  it('gives premium members 40 percent off', () => {
    expect(priorityPrice(0.95, 'premium')).toBeLessThan(priorityPrice(0.95, 'free'))
  })

  it('only sells priority where there is a real queue', () => {
    expect(priorityWorthIt(0.5)).toBe(false)
    expect(priorityWorthIt(0.96)).toBe(true)
  })

  it('never sells more than the sellable share of a window', () => {
    for (let h = 10; h < 22; h++) {
      expect(laneSeatsLeft(cp, atWib(SAT, h, 0), 0.99)).toBeLessThanOrEqual(LANE_SELLABLE)
    }
  })
})

describe('ganjil-genap', () => {
  it('reads parity from the plate number', () => {
    expect(plateParity('B 1842 KEN')).toBe('genap')
    expect(plateParity('B 1843 KEN')).toBe('ganjil')
    expect(plateParity('tanpa angka')).toBeNull()
  })

  it('does not apply on weekends', () => {
    expect(checkGage(gi, 'B 1843 KEN', false, SAT)).toEqual({ kind: 'not-applicable', reason: 'weekend' })
  })

  it('exempts electric vehicles', () => {
    const monday0800 = atWib(SAT + 2 * 86_400_000, 8, 0)
    expect(checkGage(gi, 'B 1843 KEN', true, monday0800)).toEqual({ kind: 'exempt' })
  })

  it('blocks the wrong parity on a corridor during active hours', () => {
    const monday0800 = atWib(SAT + 2 * 86_400_000, 8, 0)
    const wrong = dateParity(monday0800) === 'genap' ? 'B 1843 KEN' : 'B 1842 KEN'
    expect(checkGage(gi, wrong, false, monday0800).kind).toBe('blocked')
  })

  it('ignores venues outside the corridors', () => {
    expect(checkGage(cp, 'B 1843 KEN', false, SAT).kind).toBe('not-applicable')
  })
})

describe('impact', () => {
  it('turns saved minutes into fuel and CO2', () => {
    const i = impactOf(60, false)
    expect(i.fuelL).toBeCloseTo(0.78)
    expect(i.co2Kg).toBeCloseTo(0.78 * CO2_KG_PER_L)
  })

  it('counts time but no petrol for an EV', () => {
    expect(impactOf(30, true)).toEqual({ minutes: 30, fuelL: 0, co2Kg: 0 })
  })

  it('sums a month of visits', () => {
    const total = sumImpact([impactOf(10, false), impactOf(20, false)])
    expect(total.minutes).toBe(30)
  })
})

describe('recommendation', () => {
  it('ranks a full Central Park below its quiet neighbours', () => {
    const ranked = rankVenues(VENUES, SAT, BINUS_ANGGREK)
    const ids = ranked.map((r) => r.venue.id)
    expect(ids.indexOf('central-park')).toBeGreaterThan(ids.indexOf('neo-soho'))
  })

  it('saves time by steering to the quiet gate', () => {
    const ranked = rankVenues(VENUES, SAT, BINUS_ANGGREK)
    const cpRank = ranked.find((r) => r.venue.id === 'central-park')!
    expect(cpRank.timeToParkBlind - cpRank.timeToPark).toBeGreaterThan(8)
  })

  it('offers Neo Soho first when Central Park is full, since you can walk over', () => {
    const alts = alternativesFor(cp, VENUES, SAT)
    expect(alts[0].snap.venue.id).toBe('neo-soho')
    expect(alts[0].walk?.minutes).toBe(4)
  })
})
