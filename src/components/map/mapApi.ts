import { LngLatBounds, type Map as MLMap } from 'maplibre-gl'
import type { LngLat } from '../../data/types'

/*
  One map per app, so a tiny module-level handle is simpler than threading
  a ref through context. Anything that wants to move the camera calls these.
*/

let map: MLMap | null = null

export const setMap = (m: MLMap | null) => {
  map = m
}
export const getMap = () => map

/** Space the floating UI takes, so the camera centers on what is visible. */
const padding = (bottom: number) => ({ top: 90, left: 40, right: 40, bottom })

export function flyTo(center: LngLat, bottom = 320, zoom = 16.4) {
  map?.flyTo({ center, zoom, pitch: 58, bearing: -18, padding: padding(bottom), duration: 1400, essential: true })
}

export function fitPoints(points: LngLat[], bottom = 320, maxZoom = 15.5) {
  if (!map || points.length === 0) return
  const b = new LngLatBounds(points[0], points[0])
  points.forEach((p) => b.extend(p))
  map.fitBounds(b, { padding: padding(bottom), pitch: 48, bearing: -12, maxZoom, duration: 1300 })
}
