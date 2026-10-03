import { describe, expect, it } from 'vitest'
import { useApp } from '../store/app'
import { ACCENT_ORDER, ACCENTS } from './accent'

// WCAG relative luminance and contrast ratio.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('accent colours', () => {
  it('offers every accent in the picker exactly once', () => {
    expect([...ACCENT_ORDER].sort()).toEqual(Object.keys(ACCENTS).sort())
  })

  it('keeps white text on the booking button readable in every accent', () => {
    for (const a of ACCENT_ORDER) expect(contrast(ACCENTS[a][600], '#ffffff'), a).toBeGreaterThanOrEqual(4.5)
  })

  it('starts on cornflower, the brand color', () => {
    expect(useApp.getState().accent).toBe('cornflower')
    expect(ACCENTS.cornflower[600]).toBe('#2f5bd3')
  })
})
