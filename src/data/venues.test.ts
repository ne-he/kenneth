import { describe, expect, it } from 'vitest'
import { haversineKm } from '../lib/geo'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from './venues'

// Rough box around Greater Jakarta. Catches swapped longitude and latitude.
const inJakarta = ([lng, lat]: [number, number]) => lng > 106.6 && lng < 107.1 && lat > -6.45 && lat < -6.05

describe('venue data', () => {
  it('has unique ids and a lookup entry for each venue', () => {
    const ids = VENUES.map((v) => v.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(VENUE_BY_ID[id].id).toBe(id))
  })

  it('keeps every coordinate in Jakarta, longitude first', () => {
    expect(inJakarta(BINUS_ANGGREK)).toBe(true)
    for (const v of VENUES) {
      expect(inJakarta(v.coords), v.id).toBe(true)
      v.gates.forEach((g) => expect(inJakarta(g.coords), g.id).toBe(true))
    }
  })

  it('puts each gate next to its own building', () => {
    for (const v of VENUES) {
      v.gates.forEach((g) => expect(haversineKm(v.coords, g.coords), g.id).toBeLessThan(0.8))
    }
  })

  it('gives every venue the fields the screens rely on', () => {
    for (const v of VENUES) {
      expect(v.capacity, v.id).toBeGreaterThan(0)
      expect(v.load, v.id).toBeGreaterThan(0)
      expect(v.gates.length, v.id).toBeGreaterThan(0)
      // Malls have a Zona KENNETH gate, campuses sell nothing.
      expect(v.gates.some((g) => g.zoneLane), `${v.id} zone lane`).toBe(v.category === 'mall')
      v.gates.forEach((g) => expect(g.pull, g.id).toBeGreaterThan(0))
      expect(new Set(v.gates.map((g) => g.id)).size, v.id).toBe(v.gates.length)
      expect(v.levels.length, v.id).toBeGreaterThan(0)
      expect(v.zones.length, v.id).toBeGreaterThan(0)
      expect(v.lobbies.length, v.id).toBeGreaterThan(0)
      expect(v.tariff.verified, v.id).toBe(false)
      expect(v.hours[0], v.id).toBeLessThan(v.hours[1])
      expect(v.motor.capacity, `${v.id} motorbike bays`).toBeGreaterThan(0)
      expect(v.motor.firstHour, `${v.id} motorbike tariff`).toBeLessThan(v.tariff.firstHour)
      if (v.valet) {
        expect(v.category, `${v.id} valet`).toBe('mall')
        expect(v.valet.lobbies.length, `${v.id} valet lobbies`).toBeGreaterThan(0)
        v.valet.lobbies.forEach((l) => expect(v.lobbies, `${v.id} valet lobby`).toContain(l))
      }
    }
  })

  it('covers every BINUS campus in Greater Jakarta, each with a mall nearby', () => {
    const campuses = VENUES.filter((v) => v.category === 'kampus')
    expect(campuses.map((v) => v.id).sort()).toEqual(
      ['binus-alsut', 'binus-anggrek', 'binus-bekasi', 'binus-kijang', 'binus-senayan', 'binus-syahdan'].sort(),
    )
    for (const c of campuses) {
      const mall = VENUES.filter((v) => v.category === 'mall').some((m) => haversineKm(c.coords, m.coords) < 2.5)
      expect(mall, `${c.id} has a mall within 2.5 km`).toBe(true)
    }
  })

  it('keeps walking links the same in both directions', () => {
    for (const v of VENUES) {
      v.walkLinks.forEach((l) => {
        const back = VENUE_BY_ID[l.to].walkLinks.find((x) => x.to === v.id)
        expect(back, `${l.to} back to ${v.id}`).toBeDefined()
        expect(back!.minutes, `${v.id} and ${l.to}`).toBe(l.minutes)
      })
    }
  })

  it('only links walkable neighbours that exist', () => {
    for (const v of VENUES) {
      v.walkLinks.forEach((l) => {
        expect(VENUE_BY_ID[l.to], `${v.id} to ${l.to}`).toBeDefined()
        expect(l.to).not.toBe(v.id)
      })
    }
  })
})
