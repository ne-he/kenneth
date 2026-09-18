import type { LngLat } from '../data/types'

const R_KM = 6371

const rad = (d: number) => (d * Math.PI) / 180

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1])
  const dLng = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R_KM * Math.asin(Math.sqrt(h))
}

/** Straight line is never the real road. Jakarta's grid adds about a third. */
export const ROAD_FACTOR = 1.35

/** Average door-to-door speed on a busy Jakarta weekend, km/h. */
export const CITY_SPEED_KMH = 21

export function estimateDrive(a: LngLat, b: LngLat) {
  const km = haversineKm(a, b) * ROAD_FACTOR
  return { km, minutes: (km / CITY_SPEED_KMH) * 60 }
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function bearing(a: LngLat, b: LngLat): number {
  const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]))
  const x =
    Math.cos(rad(a[1])) * Math.sin(rad(b[1])) -
    Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]))
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}
