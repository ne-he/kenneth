import { describe, expect, it } from 'vitest'
import { PROMOS } from '../data/promos'
import { VENUE_BY_ID } from '../data/venues'
import { promoStats } from './merchant'

const SAT_NOON = Date.parse('2026-10-10T12:00:00+07:00')

describe('promoStats', () => {
  it('funnels from seen to taps to parking perks', () => {
    const p = PROMOS.find((x) => x.id === 'cp-unikloh')!
    const s = promoStats(p, VENUE_BY_ID[p.venueId], SAT_NOON)
    expect(s.seen).toBeGreaterThan(0)
    expect(s.taps).toBeLessThan(s.seen)
    expect(s.perks).toBeGreaterThan(0)
    expect(s.perks).toBeLessThan(s.taps)
  })

  it('counts no perks for a promo without one, and is stable', () => {
    const p = PROMOS.find((x) => x.id === 'cp-bazar')!
    const a = promoStats(p, VENUE_BY_ID[p.venueId], SAT_NOON)
    expect(a.perks).toBe(0)
    expect(promoStats(p, VENUE_BY_ID[p.venueId], SAT_NOON)).toEqual(a)
  })
})
