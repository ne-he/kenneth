import { describe, expect, it } from 'vitest'
import { isPlate, typedPlate } from './plate'

describe('plates', () => {
  it('keeps what a plate can hold as you type', () => {
    expect(typedPlate('b 1234 ken')).toBe('B 1234 KEN')
    expect(typedPlate('b-1234  ken!')).toBe('B1234 KEN')
    expect(typedPlate(' d 12 ab')).toBe('D 12 AB')
    expect(typedPlate('B 1234 KEN EXTRA')).toBe('B 1234 KEN ')
  })

  it('accepts a whole plate and nothing less', () => {
    expect(isPlate('B 1234 KEN')).toBe(true)
    expect(isPlate('D 12 AB')).toBe(true)
    expect(isPlate('AB 1 C')).toBe(true)
    expect(isPlate('B1234KEN')).toBe(true)
    expect(isPlate('B')).toBe(false)
    expect(isPlate('1234')).toBe(false)
    expect(isPlate('B 12345')).toBe(false)
    expect(isPlate('')).toBe(false)
  })
})
