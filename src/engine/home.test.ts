import { describe, expect, it } from 'vitest'
import { cardIndexAt, cardInRow } from './home'

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

describe('cardIndexAt', () => {
  // The home row: 236 px cards, 10 px apart, so one card is 246 px of scroll.
  const W = 236
  const G = 10
  const STEP = W + G

  it('round trips with the offset the row scrolls a card to', () => {
    for (let i = 0; i < 5; i++) expect(cardIndexAt(i * STEP, 5, W, G)).toBe(i)
  })

  it('picks the nearest card edge while the snap is still settling', () => {
    expect(cardIndexAt(STEP / 2 - 1, 5, W, G)).toBe(0)
    expect(cardIndexAt(STEP / 2 + 1, 5, W, G)).toBe(1)
    expect(cardIndexAt(3 * STEP + 40, 5, W, G)).toBe(3)
  })

  it('clamps to the row: rubber band before the first card, overscroll past the last', () => {
    expect(cardIndexAt(-40, 5, W, G)).toBe(0)
    expect(cardIndexAt(99_999, 5, W, G)).toBe(4)
  })

  it('is -1 for an empty row', () => {
    expect(cardIndexAt(0, 0, W, G)).toBe(-1)
    expect(cardIndexAt(500, 0, W, G)).toBe(-1)
  })
})
