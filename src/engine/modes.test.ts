import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { nextSaturdayAt } from '../lib/time'
import { MODES, chargersFree, modesFor, offers, pinFact } from './modes'
import { forKind, snapshot } from './occupancy'
import { zonePrice } from './pricing'
import { retrievalMin } from './valet'
import { baysLeft } from './zone'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const cp = VENUE_BY_ID['central-park']
const slipi = VENUE_BY_ID['slipi-jaya']
const anggrek = VENUE_BY_ID['binus-anggrek']

describe('modes on offer', () => {
  it('lets every vehicle park everywhere', () => {
    for (const v of VENUES) {
      expect(offers(v, 'mobil', 'park'), v.id).toBe(true)
      expect(offers(forKind(v, 'motor'), 'motor', 'park'), v.id).toBe(true)
    }
  })

  it('sells nothing to a motorbike, so it only gets the parking mode', () => {
    for (const v of VENUES) {
      for (const mode of ['zone', 'valet', 'ev'] as const) expect(offers(v, 'motor', mode), `${v.id} ${mode}`).toBe(false)
    }
    expect(modesFor('motor')).toEqual(['park'])
    expect(modesFor('mobil')).toEqual(MODES)
  })

  it('follows what each venue has: a campus only parks, a mall without runners or chargers has no valet or ev', () => {
    expect(MODES.filter((m) => offers(anggrek, 'mobil', m))).toEqual(['park'])
    expect(MODES.filter((m) => offers(slipi, 'mobil', m))).toEqual(['park', 'zone'])
    expect(MODES.filter((m) => offers(cp, 'mobil', m))).toEqual(MODES)
  })
})

describe('pin facts', () => {
  const snap = snapshot(cp, SAT)

  it('says nothing for a mode the venue does not offer', () => {
    expect(pinFact(snapshot(anggrek, SAT), 'zone', 'mobil', 'free', SAT)).toEqual({ kind: 'none' })
    expect(pinFact(snapshot(forKind(cp, 'motor'), SAT), 'ev', 'motor', 'free', SAT)).toEqual({ kind: 'none' })
  })

  it('shows the same numbers as the card behind it', () => {
    expect(pinFact(snap, 'park', 'mobil', 'free', SAT)).toEqual({ kind: 'pct', pct: snap.pct })
    expect(pinFact(snap, 'zone', 'mobil', 'premium', SAT)).toEqual({
      kind: 'price',
      price: zonePrice(snap.occ, 'premium'),
      left: baysLeft(cp, SAT, snap.occ),
    })
    expect(pinFact(snap, 'valet', 'mobil', 'free', SAT)).toEqual({ kind: 'wait', min: retrievalMin(snap.occ) })
    expect(pinFact(snap, 'ev', 'mobil', 'free', SAT)).toEqual({
      kind: 'chargers',
      free: chargersFree(snap, SAT),
      total: cp.ev.chargers,
    })
  })

  it('reads a motorbike pin from the motorbike bays', () => {
    const moto = snapshot(forKind(cp, 'motor'), SAT)
    expect(pinFact(moto, 'park', 'motor', 'free', SAT)).toEqual({ kind: 'pct', pct: moto.pct })
    expect(moto.pct).not.toBe(snap.pct)
  })

  it('never counts more free chargers than the venue has', () => {
    for (const v of VENUES) {
      for (let h = 0; h < 24; h++) {
        const ts = SAT + h * 3_600_000
        const free = chargersFree(snapshot(v, ts), ts)
        expect(Number.isInteger(free), v.id).toBe(true)
        expect(free, v.id).toBeGreaterThanOrEqual(0)
        expect(free, v.id).toBeLessThanOrEqual(v.ev.chargers)
      }
    }
  })
})
