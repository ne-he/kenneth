import { describe, expect, it } from 'vitest'
import { CAR_MODELS } from '../data/carModels'
import { matchModel, modelOf, searchModels, shortName, spriteIdOf } from './carCatalog'

const idOf = (text: string) => matchModel(text)?.id

describe('matching a typed model name to the catalog', () => {
  it('finds the common names people type', () => {
    expect(idOf('Toyota Avanza')).toBe('toyota-avanza')
    expect(idOf('avanza 1.5 G')).toBe('toyota-avanza')
    expect(idOf('Honda CR-V')).toBe('honda-crv')
    expect(idOf('Mazda CX-5')).toBe('mazda-cx-5')
    expect(idOf('BMW X5 xDrive40i')).toBe('bmw-x5')
    expect(idOf('Mercedes C 300')).toBe('mercedes-c-class')
    expect(idOf('Lamborghini Huracán EVO')).toBe('lamborghini-huracan')
  })

  it('tries the longer name first', () => {
    expect(idOf('Toyota Kijang Innova Zenix')).toBe('toyota-innova-zenix')
    expect(idOf('Kijang Innova 2.4 V')).toBe('toyota-innova-reborn')
    expect(idOf('Toyota Yaris Cross')).toBe('toyota-yaris-cross')
    expect(idOf('Range Rover Sport')).toBe('range-rover-sport')
    expect(idOf('Range Rover Velar')).toBe('range-rover-velar')
    expect(idOf('Range Rover')).toBe('range-rover')
    expect(idOf('BYD Sealion 7')).toBe('byd-sealion-7')
    expect(idOf('Omoda E5')).toBe('omoda-e5')
  })

  it('matches short names only as whole words', () => {
    expect(idOf('Geely EX5')).toBe('geely-ex5')
    expect(idOf('Lexus ES 300h')).toBe('lexus-es')
    expect(idOf('Mercedes')).toBeUndefined()
    expect(idOf('Toyota Sienta')).toBeUndefined()
    expect(idOf('')).toBeUndefined()
  })

  it('prefers the model picked from the list over the typed name', () => {
    expect(modelOf({ model: 'Avanza', modelId: 'daihatsu-xenia' })?.id).toBe('daihatsu-xenia')
    expect(modelOf({ model: 'Avanza' })?.id).toBe('toyota-avanza')
  })

  it('has one model per key and an icon name for every model', () => {
    const keys = CAR_MODELS.flatMap((m) => m.keys)
    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(CAR_MODELS.map((m) => m.id)).size).toBe(CAR_MODELS.length)
  })
})

describe('the picker search', () => {
  it('shows the best sellers before anything is typed', () => {
    const top = searchModels('')
    expect(top.length).toBeGreaterThan(0)
    expect(top.every((m) => m.popular)).toBe(true)
  })

  it('finds by any word of the name or a key, best sellers first', () => {
    expect(searchModels('innova').map((m) => m.id)).toEqual(['toyota-innova-zenix', 'toyota-innova-reborn'])
    expect(searchModels('cr v')[0].id).toBe('honda-crv')
    expect(searchModels('cr').slice(0, 2).map((m) => m.id)).toEqual(['honda-crv', 'hyundai-creta'])
    expect(searchModels('cx5')[0].id).toBe('mazda-cx-5')
    expect(searchModels('merc').length).toBe(9)
    expect(searchModels('zzz')).toEqual([])
  })

  it('names a model without its brand', () => {
    expect(shortName(matchModel('Toyota Avanza')!)).toBe('Avanza')
    expect(shortName(matchModel('Range Rover Velar')!)).toBe('Range Rover Velar')
  })
})

describe('the icon a vehicle gets', () => {
  it('draws the model, and nothing 3D for a motorbike', () => {
    expect(spriteIdOf({ kind: 'mobil', model: 'Honda Brio RS' })).toBe('honda-brio')
    expect(spriteIdOf({ kind: 'motor', model: 'Honda BeAT' })).toBeUndefined()
  })
})
