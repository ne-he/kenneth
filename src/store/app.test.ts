import { describe, expect, it } from 'vitest'
import { activeVehicleOf, migrateApp, NO_VEHICLE } from './app'

describe('saved data from the first version', () => {
  it('turns the single car into a garage of one', () => {
    const v1 = { onboarded: true, name: 'Ken', vehicle: { plate: 'B 1842 KEN', model: 'Brio', isEV: false } }
    const v2 = migrateApp({ ...v1 }, 1)
    expect(v2.vehicles).toEqual([{ id: 'v1', kind: 'mobil', plate: 'B 1842 KEN', model: 'Brio', isEV: false }])
    expect(v2.activeVehicle).toBe('v1')
    expect(activeVehicleOf(v2).plate).toBe('B 1842 KEN')
    expect(v2.favorites).toEqual([])
    expect(v2.valets).toEqual([])
    expect(v2.mapPrefs.navApp).toBe('kenneth')
    expect('vehicle' in v2).toBe(false)
  })

  it('starts an empty garage for someone who never finished onboarding', () => {
    const v2 = migrateApp({ onboarded: false, vehicle: { plate: '', model: '', isEV: false } }, 1)
    expect(v2.vehicles).toEqual([])
    expect(activeVehicleOf(v2)).toBe(NO_VEHICLE)
  })

  it('leaves version 2 data without a parked car alone', () => {
    const state = { vehicles: [{ id: 'a', kind: 'motor', plate: 'B 1 A', model: '', isEV: false }], activeVehicle: 'a' }
    expect(migrateApp({ ...state }, 2)).toEqual(state)
  })
})

describe('saved data from version 2', () => {
  it('moves the parked floor section from zone to section', () => {
    const parked = { venueId: 'neo-soho', level: 'B2', zone: 'C', pillar: 12, lobby: 'Lobi A', at: 1, savedMin: 3 }
    const v3 = migrateApp({ parked: { ...parked } }, 2)
    expect(v3.parked?.section).toBe('C')
    expect(v3.parked && 'zone' in v3.parked).toBe(false)
  })

  it('handles nobody being parked', () => {
    expect(migrateApp({ parked: null }, 2).parked).toBeNull()
  })

  it('leaves version 3 data alone', () => {
    const parked = { venueId: 'neo-soho', level: 'B2', section: 'C', pillar: 12, lobby: 'Lobi A', at: 1, savedMin: 3 }
    expect(migrateApp({ parked: { ...parked } }, 3).parked).toEqual(parked)
  })
})
