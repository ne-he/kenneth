import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID } from '../data/venues'
import { bayFor, zoneOf } from '../engine/zone'
import { activeVehicleOf, migrateApp, NO_VEHICLE, useApp } from './app'

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

describe('booking a zone bay', () => {
  const cp = VENUE_BY_ID['central-park']
  const zone = zoneOf(cp)!
  /** The pass ZonePanel builds on pay, with the store's own uid in place of a fixed id. */
  const passFor = (id: string, windowStart: number) => ({
    id,
    venueId: cp.id,
    gateId: zone.gate.id,
    windowStart,
    bay: bayFor(id, cp),
    price: 29_000,
    token: `KNZ-${cp.short.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${id.slice(0, 4).toUpperCase()}`,
    createdAt: 1,
    status: 'active' as const,
  })

  it('puts a paid pass first in the list with a bay inside the zone and a readable token', () => {
    useApp.setState({ passes: [] })
    const start = Date.UTC(2026, 9, 3, 7, 30)
    useApp.getState().addPass(passFor('abc123xy', start))
    const [p] = useApp.getState().passes
    expect(p.windowStart).toBe(start)
    expect(p.gateId).toBe(zone.gate.id)
    // bay is optional on the type because v0.3 passes never had one; a pay today must always set it.
    expect(p.bay).toBeDefined()
    expect(Number(p.bay!.slice(2))).toBeGreaterThanOrEqual(1)
    expect(Number(p.bay!.slice(2))).toBeLessThanOrEqual(zone.bays)
    expect(p.token).toBe('KNZ-CP-ABC1')
    expect(p.status).toBe('active')
  })

  it('keeps a cancelled pass on record instead of dropping it', () => {
    useApp.setState({ passes: [passFor('cancelme', 10)] })
    useApp.getState().cancelPass('cancelme', 99)
    const [p] = useApp.getState().passes
    expect(p.status).toBe('cancelled')
    expect(p.cancelledAt).toBe(99)
    expect(useApp.getState().passes).toHaveLength(1)
  })

  it('only cancels the pass it was asked to', () => {
    useApp.setState({ passes: [passFor('keep0001', 10), passFor('drop0002', 20)] })
    useApp.getState().cancelPass('drop0002', 99)
    const byId = Object.fromEntries(useApp.getState().passes.map((p) => [p.id, p.status]))
    expect(byId).toEqual({ keep0001: 'active', drop0002: 'cancelled' })
  })
})
