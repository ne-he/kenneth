import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID } from '../data/venues'
import { checkout, sessionNow } from './session'

const v = VENUE_BY_ID['central-park']
const H = 3_600_000
const { firstHour, nextHour } = v.tariff

describe('parking session', () => {
  it('bills the first hour at once and counts down to the next', () => {
    const s = sessionNow(v, 20 * 60_000)
    expect(s.billed).toBe(1)
    expect(s.cost).toBe(firstHour)
    expect(s.nextCost).toBe(firstHour + nextHour)
    expect(s.msToNext).toBe(40 * 60_000)
  })

  it('moves to the next hour just past it', () => {
    expect(sessionNow(v, H + 1).billed).toBe(2)
  })

  it('takes whole free hours off the bill, never below zero', () => {
    const c = checkout(v, 2.5 * H, 2)
    expect(c.billed).toBe(3)
    expect(c.covered).toBe(2)
    expect(c.paid).toBe(nextHour)
    expect(checkout(v, 1.5 * H, 3).paid).toBe(0)
    expect(checkout(v, 1.5 * H).paid).toBe(firstHour + nextHour)
  })
})
