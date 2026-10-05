import { describe, expect, it } from 'vitest'
import { bearing, carPose, pointAlong } from './routeProgress'

describe('the car along a route', () => {
  it('reads compass bearings', () => {
    expect(bearing([0, 0], [0, 1])).toBeCloseTo(0, 0)
    expect(bearing([0, 0], [1, 0])).toBeCloseTo(90, 0)
    expect(bearing([0, 0], [-1, 0])).toBeCloseTo(270, 0)
  })

  it('finds the point a share of the way along, by distance', () => {
    const half = pointAlong([[0, 0], [0.01, 0]], 0.5)
    expect(half.at[0]).toBeCloseTo(0.005, 6)
    expect(half.bearing).toBeCloseTo(90, 0)
  })

  it('turns with the road', () => {
    // North for 1 km, then east for 1 km.
    const route: [number, number][] = [[0, 0], [0, 0.009], [0.009, 0.009]]
    expect(pointAlong(route, 0.25).bearing).toBeCloseTo(0, 0)
    expect(pointAlong(route, 0.75).bearing).toBeCloseTo(90, 0)
    expect(pointAlong(route, 1).at).toEqual([0.009, 0.009])
    expect(pointAlong(route, -1).at).toEqual([0, 0])
  })

  it('ignores the tiny leg from where you stand onto the road', () => {
    // 5 m south-west to reach the road, then 1 km north.
    const route: [number, number][] = [[0, 0], [-0.00003, -0.00003], [-0.00003, 0.009]]
    const b = pointAlong(route, 0).bearing
    // Within 10 degrees of north, either side of 0.
    expect(Math.min(b, 360 - b)).toBeLessThan(10)
  })

  it('picks the view and mirror for each screen direction', () => {
    expect(carPose(30)).toEqual({ view: 'rear', mirror: false })
    expect(carPose(120)).toEqual({ view: 'front', mirror: true })
    expect(carPose(225)).toEqual({ view: 'front', mirror: false })
    expect(carPose(-45)).toEqual({ view: 'rear', mirror: true })
  })
})
