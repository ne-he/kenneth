import { describe, expect, it } from 'vitest'
import { freesAtFor } from './watch'

const MIN = 60_000
const NOW = Date.UTC(2026, 9, 3, 7, 0)

describe('cancellation alerts', () => {
  it('frees a bay a minute or two after asking', () => {
    const at = freesAtFor('w-abc', NOW, NOW + 3 * 60 * MIN)
    expect(at).toBeGreaterThanOrEqual(NOW + MIN)
    expect(at).toBeLessThan(NOW + 2 * MIN)
  })

  it('never frees it later than 15 minutes before the slot', () => {
    const slot = NOW + 16 * MIN
    expect(freesAtFor('w-abc', NOW, slot)).toBeLessThanOrEqual(slot - 15 * MIN)
  })

  it('gives every watch the same moment each time, so a demo repeats', () => {
    expect(freesAtFor('w-abc', NOW, NOW + 90 * MIN)).toBe(freesAtFor('w-abc', NOW, NOW + 90 * MIN))
  })
})
