import { describe, expect, it } from 'vitest'
import { PROMOS, promosAt } from './promos'
import { VENUE_BY_ID } from './venues'

// 2026-10-10 is a Saturday. WIB is UTC+7.
const at = (day: string, hour: number) => Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00+07:00`)

describe('promos', () => {
  it('points at real places, with unique ids and sane hours', () => {
    expect(new Set(PROMOS.map((p) => p.id)).size).toBe(PROMOS.length)
    for (const p of PROMOS) {
      expect(VENUE_BY_ID[p.venueId], p.id).toBeTruthy()
      expect(p.from).toBeLessThan(p.to)
    }
  })

  it('lists what runs now first, then what starts later today', () => {
    const list = promosAt('central-park', at('2026-10-10', 10))
    expect(list.map((x) => [x.promo.id, x.state])).toEqual([
      ['cp-unikloh', 'now'],
      ['cp-bazar', 'later'],
    ])
  })

  it('drops promos that ended or do not run that day', () => {
    expect(promosAt('central-park', at('2026-10-10', 22)).length).toBe(0)
    expect(promosAt('central-park', at('2026-10-12', 15)).map((x) => x.promo.id)).toContain('cp-starbak')
  })
})
