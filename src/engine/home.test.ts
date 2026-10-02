import { describe, expect, it } from 'vitest'
import { cardInRow } from './home'

const ROW = ['neo-soho', 'central-park', 'taman-anggrek'] as const

describe('cardInRow', () => {
  it('starts on the first card, the best option, when nothing is focused', () => {
    expect(cardInRow(null, ROW)).toBe('neo-soho')
  })

  it('keeps the focused card while the row still has it', () => {
    expect(cardInRow('taman-anggrek', ROW)).toBe('taman-anggrek')
  })

  it('hands over to the first card when the focused one left the filter', () => {
    expect(cardInRow('slipi-jaya', ROW)).toBe('neo-soho')
  })

  it('is null for an empty row, focused or not', () => {
    expect(cardInRow(null, [])).toBeNull()
    expect(cardInRow('neo-soho', [])).toBeNull()
  })
})
