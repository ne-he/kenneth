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

  it('leaves version 2 data alone', () => {
    const state = { vehicles: [{ id: 'a', kind: 'motor', plate: 'B 1 A', model: '', isEV: false }], activeVehicle: 'a' }
    expect(migrateApp({ ...state }, 2)).toEqual(state)
  })
})
