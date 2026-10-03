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

  // Hue in degrees of a hex color; NaN for a grey.
  const hue = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const max = Math.max(r, g, b)
    const d = max - Math.min(r, g, b)
    if (d < 0.15) return NaN
    const h = max === r ? (g - b) / d : max === g ? 2 + (b - r) / d : 4 + (r - g) / d
    return (h * 60 + 360) % 360
  }
  const apart = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b))

  it('keeps every accent away from the status hues, so no accent reads as a status', () => {
    const status = { lega: '#2e9e6e', ramai: '#e8a317', penuh: '#d64535' }
    for (const a of ACCENT_ORDER) {
      const h = hue(ACCENTS[a][600])
      if (Number.isNaN(h)) continue
      for (const [name, hex] of Object.entries(status)) expect(apart(h, hue(hex)), `${a} vs ${name}`).toBeGreaterThanOrEqual(30)
    }
  })

  it('starts on cornflower, the brand color', () => {
    expect(useApp.getState().accent).toBe('cornflower')
    expect(ACCENTS.cornflower[600]).toBe('#2f5bd3')
  })
})
