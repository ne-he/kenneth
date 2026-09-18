import type { LngLat, Venue, VenueId } from '../data/types'
import type { Travel, TravelLookup } from '../engine/recommend'
import { estimateDrive } from './geo'
import { wib } from './time'

/*
  Driving routes from the public OSRM demo server (OpenStreetMap data, no
  key). It is fine for a prototype and a booth demo, not for production,
  so every call has a short timeout and a straight-line fallback.

  OSRM durations assume free-flowing roads. Jakarta is not free-flowing, so
  durations are stretched by a traffic factor that follows the time of day.
*/

const OSRM = 'https://router.project-osrm.org'
const TIMEOUT_MS = 6000

export function trafficFactor(ts: number): number {
  const { day, hourF } = wib(ts)
  const weekend = day === 0 || day === 6
  if (weekend) return hourF >= 11 && hourF < 21 ? 2.1 : 1.4
  const rush = (hourF >= 6.5 && hourF < 9.5) || (hourF >= 16.5 && hourF < 20)
  return rush ? 2.4 : 1.6
}

async function getJson<T>(url: string): Promise<T> {
  const ctrl = new AbortController()
  const t = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`osrm ${res.status}`)
    return (await res.json()) as T
  } finally {
    window.clearTimeout(t)
  }
}

const fmt = (p: LngLat) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`

interface TableResponse {
  code: string
  durations: (number | null)[][]
  distances: (number | null)[][]
}

export async function fetchTravelTable(origin: LngLat, venues: Venue[], ts: number): Promise<TravelLookup> {
  const coords = [origin, ...venues.map((v) => v.coords)].map(fmt).join(';')
  const data = await getJson<TableResponse>(
    `${OSRM}/table/v1/driving/${coords}?sources=0&annotations=duration,distance`,
  )
  if (data.code !== 'Ok') throw new Error(data.code)
  const k = trafficFactor(ts)
  const out: TravelLookup = {}
  venues.forEach((v, i) => {
    const dur = data.durations[0][i + 1]
    const dist = data.distances[0][i + 1]
    if (dur == null || dist == null) return
    out[v.id as VenueId] = { km: dist / 1000, minutes: (dur / 60) * k, source: 'road' } satisfies Travel
  })
  return out
}

interface RouteResponse {
  code: string
  routes: { distance: number; duration: number; geometry: { coordinates: LngLat[] } }[]
}

export interface RouteResult {
  coords: LngLat[]
  km: number
  minutes: number
  source: 'road' | 'estimate'
}

export async function fetchRoute(from: LngLat, to: LngLat, ts: number): Promise<RouteResult> {
  try {
    const data = await getJson<RouteResponse>(
      `${OSRM}/route/v1/driving/${fmt(from)};${fmt(to)}?overview=full&geometries=geojson`,
    )
    const r = data.routes?.[0]
    if (data.code !== 'Ok' || !r) throw new Error(data.code)
    return {
      coords: r.geometry.coordinates,
      km: r.distance / 1000,
      minutes: (r.duration / 60) * trafficFactor(ts),
      source: 'road',
    }
  } catch {
    const { km, minutes } = estimateDrive(from, to)
    // A gentle bend reads as "approximate" better than a ruler-straight line.
    const mid: LngLat = [(from[0] + to[0]) / 2 + (to[1] - from[1]) * 0.12, (from[1] + to[1]) / 2 - (to[0] - from[0]) * 0.12]
    return { coords: [from, mid, to], km, minutes, source: 'estimate' }
  }
}
