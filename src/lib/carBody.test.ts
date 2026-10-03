import { describe, expect, it } from 'vitest'
import { bodyOf, guessBody, shortModel } from './carBody'

describe('car shape from the model name', () => {
  it('knows the common shapes on Indonesian roads', () => {
    expect(guessBody('Toyota Avanza')).toBe('mpv')
    expect(guessBody('Toyota Fortuner VRZ')).toBe('suv')
    expect(guessBody('Honda Brio RS')).toBe('hatch')
    expect(guessBody('Honda Civic')).toBe('sedan')
  })

  it('tries the longer name first', () => {
    expect(guessBody('Toyota Yaris Cross')).toBe('suv')
    expect(guessBody('Toyota Yaris')).toBe('hatch')
    expect(guessBody('Honda City Hatchback RS')).toBe('hatch')
  })

  it('matches short names only as whole words, hyphen or not', () => {
    expect(guessBody('Honda CR-V')).toBe('suv')
    expect(guessBody('Mazda CX-5')).toBe('suv')
    expect(guessBody('Suzuki APV')).toBe('mpv')
    expect(guessBody('Kapvelo')).toBeUndefined()
  })

  it('draws the shape the user picked over the guess, and a sedan when nothing is known', () => {
    expect(bodyOf({ model: 'Toyota Avanza', body: 'suv' })).toBe('suv')
    expect(bodyOf({ model: 'Mobil kantor' })).toBe('sedan')
  })
})

describe('short model name', () => {
  it('drops the brand people do not say', () => {
    expect(shortModel('Toyota Avanza Veloz')).toBe('Avanza Veloz')
    expect(shortModel('  Honda Brio ')).toBe('Brio')
  })

  it('keeps the brand when the rest is only a number or too short', () => {
    expect(shortModel('Mazda 2')).toBe('Mazda 2')
    expect(shortModel('Avanza')).toBe('Avanza')
    expect(shortModel('')).toBe('')
  })
})
