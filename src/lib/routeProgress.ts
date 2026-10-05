import type { LngLat } from '../data/types'
import { haversineKm } from './geo'

const rad = (d: number) => (d * Math.PI) / 180

/** Compass bearing from a to b, 0 is north, 90 east. */
export function bearing(a: LngLat, b: LngLat): number {
  const [l1, p1, l2, p2] = [rad(a[0]), rad(a[1]), rad(b[0]), rad(b[1])]
  const y = Math.sin(l2 - l1) * Math.cos(p2)
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(l2 - l1)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/**
 * The point a share of the way along a line, by distance, and the way the road
 * goes from there: toward the point `aheadKm` further on, so the tiny legs a
 * route starts with (from where you stand onto the road) and small zigzags do
 * not spin the car around.
 */
export function pointAlong(coords: LngLat[], fraction: number, aheadKm = 0.04): { at: LngLat; bearing: number } {
  if (coords.length < 2) return { at: coords[0] ?? [0, 0], bearing: 0 }
  const legs = coords.slice(1).map((b, i) => haversineKm(coords[i], b))
  const total = legs.reduce((s, d) => s + d, 0)
  const locate = (km: number): LngLat => {
    let left = Math.min(total, Math.max(0, km))
    for (let i = 0; i < legs.length; i++) {
      if (legs[i] === 0) continue
      if (left <= legs[i] || i === legs.length - 1) {
        const [a, b] = [coords[i], coords[i + 1]]
        const t = Math.min(1, left / legs[i])
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      }
      left -= legs[i]
    }
    return coords[coords.length - 1]
  }
  const km = Math.min(1, Math.max(0, fraction)) * total
  const at = locate(km)
  if (total === 0) return { at, bearing: 0 }
  // Near the end there is nothing ahead, so look back instead.
  const [from, to] = km + aheadKm <= total ? [at, locate(km + aheadKm)] : [locate(km - aheadKm), at]
  return { at, bearing: bearing(from, to) }
}

/**
 * Which of the four isometric views draws a car heading this way on screen
 * (degrees clockwise from up). The front render faces down-left and the rear
 * render up-right; mirroring them covers down-right and up-left.
 */
export function carPose(screenHeading: number): { view: 'front' | 'rear'; mirror: boolean } {
  const h = ((screenHeading % 360) + 360) % 360
  if (h < 90) return { view: 'rear', mirror: false }
  if (h < 180) return { view: 'front', mirror: true }
  if (h < 270) return { view: 'front', mirror: false }
  return { view: 'rear', mirror: true }
}
