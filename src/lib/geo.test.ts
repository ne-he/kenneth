import { describe, expect, it } from 'vitest'
import { BINUS_ANGGREK, VENUE_BY_ID } from '../data/venues'
import { CITY_SPEED_KMH, ROAD_FACTOR, estimateDrive, formatKm, haversineKm } from './geo'

const cp = VENUE_BY_ID['central-park'].coords

describe('distance', () => {
  it('measures a degree of latitude as about 111 km, the same both ways', () => {
    expect(haversineKm([106.8, -6.2], [106.8, -5.2])).toBeCloseTo(111.19, 1)
    expect(haversineKm(BINUS_ANGGREK, cp)).toBeCloseTo(haversineKm(cp, BINUS_ANGGREK), 10)
    expect(haversineKm(cp, cp)).toBe(0)
  })

  it('estimates a drive from the straight line, stretched for the road grid', () => {
    const { km, minutes } = estimateDrive(BINUS_ANGGREK, cp)
    expect(km).toBeCloseTo(haversineKm(BINUS_ANGGREK, cp) * ROAD_FACTOR, 10)
    expect(minutes).toBeCloseTo((km / CITY_SPEED_KMH) * 60, 10)
  })
})

describe('formatKm', () => {
  it('uses metres under a kilometre, rounded to 10 m', () => {
    expect(formatKm(0.2)).toBe('200 m')
    expect(formatKm(0.853)).toBe('850 m')
    expect(formatKm(0.994)).toBe('990 m')
  })

  it('uses kilometres with one decimal comma from 1 km', () => {
    expect(formatKm(1)).toBe('1,0 km')
    expect(formatKm(1.24)).toBe('1,2 km')
    expect(formatKm(12.345)).toBe('12,3 km')
  })

  it('switches to kilometres when the metres round up to 1000', () => {
    expect(formatKm(0.996)).toBe('1,0 km')
  })
})
