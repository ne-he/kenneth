// Type-only import: the maplibre bundle stays in the lazy MapView chunk.
import type { Map as MLMap } from 'maplibre-gl'
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

/** The Explore sheet covers a bit over half the screen at its resting height. */
export const sheetPad = (h?: number) => Math.round((h ?? map?.getContainer().clientHeight ?? 800) * 0.52)

/** Space the floating UI takes, so the camera centers on what is visible. */
const padding = (bottom: number) => ({ top: 100, left: 78, right: 78, bottom })

export function flyTo(center: LngLat, bottom = sheetPad(), zoom = 16.2) {
  map?.flyTo({ center, zoom, pitch: 58, bearing: -18, padding: padding(bottom), duration: 1400, essential: true })
}

export function fitPoints(points: LngLat[], bottom = sheetPad(), maxZoom = 15.5) {
  if (!map || points.length === 0) return
  const lng = points.map((p) => p[0])
  const lat = points.map((p) => p[1])
  const bounds: [LngLat, LngLat] = [
    [Math.min(...lng), Math.min(...lat)],
    [Math.max(...lng), Math.max(...lat)],
  ]
  // flyTo leaves its padding on the map, and fitBounds adds its own on top.
  // Without this reset the two stack up and the camera zooms out to Java.
  map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
  map.fitBounds(bounds, { padding: padding(bottom), pitch: 45, bearing: -12, maxZoom, duration: 1300 })
}
