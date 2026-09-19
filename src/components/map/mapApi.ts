// Type-only import: the maplibre bundle stays in the lazy MapView chunk.
import type { Map as MLMap } from 'maplibre-gl'
import type { LngLat } from '../../data/types'
import { useApp } from '../../store/app'

/*
  One map per app, so a tiny module-level handle is simpler than threading
  a ref through context. Anything that wants to move the camera calls these.
*/

let map: MLMap | null = null

export const setMap = (m: MLMap | null) => {
  map = m
}
export const getMap = () => map

/** The Explore sheet at rest plus the tab bar under it: a bit over half the screen. */
export const sheetPad = (h?: number) => Math.round((h ?? map?.getContainer().clientHeight ?? 800) * 0.56 + 34)

/** Space the floating UI takes (search and chips on top, sheet below), so the camera centers on what is visible. */
const padding = (bottom: number) => ({ top: 136, left: 56, right: 72, bottom })

/** Tilted camera with 3D on, straight down with it off. */
const tilt = (pitch: number, bearing: number) => (useApp.getState().mapPrefs.threeD ? { pitch, bearing } : { pitch: 0, bearing: 0 })

export function flyTo(center: LngLat, bottom = sheetPad(), zoom = 16.2) {
  map?.flyTo({ center, zoom, ...tilt(58, -18), padding: padding(bottom), duration: 1400, essential: true })
}

export function fitPoints(points: LngLat[], bottom = sheetPad(), maxZoom = 15.5, duration = 1300) {
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
  map.fitBounds(bounds, { padding: padding(bottom), ...tilt(45, -12), maxZoom, duration })
}
