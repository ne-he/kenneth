import { describe, expect, it } from 'vitest'
import { STATUS, formatMin } from './status'

describe('formatMin', () => {
  it('says <1 for anything under a minute, never 0', () => {
    expect(formatMin(0)).toBe('<1')
    expect(formatMin(0.99)).toBe('<1')
    expect(formatMin(-2)).toBe('<1')
  })

  it('rounds to whole minutes from one minute up', () => {
    expect(formatMin(1)).toBe('1')
    expect(formatMin(1.49)).toBe('1')
    expect(formatMin(1.5)).toBe('2')
    expect(formatMin(16.96)).toBe('17')
  })
})

describe('status looks', () => {
  it('gives every status the same set of classes and a hex colour', () => {
    const keys = Object.keys(STATUS.lega).sort()
    for (const s of ['lega', 'ramai', 'penuh'] as const) {
      expect(Object.keys(STATUS[s]).sort(), s).toEqual(keys)
      expect(STATUS[s].hex, s).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
