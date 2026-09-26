import { describe, expect, it } from 'vitest'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../data/venues'
import { atWib, nextSaturdayAt } from '../lib/time'
import { checkGage, dateParity, plateParity } from './gage'
import { CO2_KG_PER_L, impactOf, sumImpact } from './impact'
import { ZONE_MAX, ZONE_MIN, formatRupiah, parkingCost, zoneBasePrice, zonePrice } from './pricing'
import { alternativesFor, rankVenues } from './recommend'
import { bayFor, baysLeft, zoneOf } from './zone'
import { passPhase } from './pass'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const cp = VENUE_BY_ID['central-park']
const gi = VENUE_BY_ID['grand-indonesia']

describe('pricing', () => {
  it('charges the first hour even for a short stop', () => {
    expect(parkingCost(cp, 0.2)).toBe(5000)
    expect(parkingCost(cp, 3)).toBe(5000 + 2 * 4000)
  })

  it('keeps a KENNETH Zone bay inside Rp15rb to Rp30rb', () => {
    for (let occ = 0; occ <= 1; occ += 0.05) {
      const p = zoneBasePrice(occ)
      expect(p).toBeGreaterThanOrEqual(ZONE_MIN)
      expect(p).toBeLessThanOrEqual(ZONE_MAX)
    }
    expect(zoneBasePrice(0.3)).toBe(ZONE_MIN)
    expect(zoneBasePrice(0.99)).toBe(ZONE_MAX)
  })

  it('writes compact rupiah with at most one decimal and no trailing ,0', () => {
    expect(formatRupiah(15_000)).toBe('Rp15.000')
    expect(formatRupiah(500, true)).toBe('Rp500')
    expect(formatRupiah(9_500, true)).toBe('Rp9,5rb')
    expect(formatRupiah(2_152_000, true)).toBe('Rp2,2jt')
    expect(formatRupiah(1_960_000, true)).toBe('Rp2jt')
  })

  it('gives premium members 40 percent off', () => {
    expect(zonePrice(0.95, 'premium')).toBeLessThan(zonePrice(0.95, 'free'))
  })
})

describe('KENNETH Zone', () => {
  it('exists at malls with a plate reader gate, never at a campus', () => {
    expect(zoneOf(cp)?.gate.id).toBe('cp-3')
    expect(zoneOf(VENUE_BY_ID['binus-anggrek'])).toBeNull()
  })

  it('keeps the zone between 12 and 40 bays', () => {
    VENUES.forEach((v) => {
      const z = zoneOf(v)
      if (z) expect(z.bays).toBeGreaterThanOrEqual(12)
      if (z) expect(z.bays).toBeLessThanOrEqual(40)
    })
  })

  it('never has more bays left than the zone holds, and fewer when the mall is packed', () => {
    const bays = zoneOf(cp)!.bays
    for (const occ of [0.3, 0.6, 0.9, 0.99]) {
      for (let h = 10; h < 22; h++) {
        for (const m of [0, 30]) {
          const left = baysLeft(cp, atWib(SAT, h, m), occ)
          expect(left).toBeGreaterThanOrEqual(0)
          expect(left).toBeLessThanOrEqual(bays)
        }
      }
    }
    const at = atWib(SAT, 14, 0)
    expect(baysLeft(cp, at, 0.99)).toBeLessThan(baysLeft(cp, at, 0.4))
  })

  it('gives a booking the same bay every time', () => {
    expect(bayFor('abc123', cp)).toBe(bayFor('abc123', cp))
    expect(bayFor('abc123', cp)).toMatch(/^K-\d{2}$/)
  })

  it('holds the bay for 30 minutes from the arrival time', () => {
    const at = atWib(SAT, 14, 0)
    expect(passPhase(at, at - 60_000)).toBe('upcoming')
    expect(passPhase(at, at + 29 * 60_000)).toBe('open')
    expect(passPhase(at, at + 30 * 60_000)).toBe('expired')
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
