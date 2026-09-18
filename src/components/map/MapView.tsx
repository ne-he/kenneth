import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence } from 'motion/react'
import { Map as MLMap, Marker, type GeoJSONSource } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LngLat, VenueId } from '../../data/types'
import type { Snapshot } from '../../engine/occupancy'
import { STATUS } from '../../lib/status'
import type { Route } from '../../store/ui'
import { setMap } from './mapApi'
import { GatePin, OriginPin, VenuePin } from './Pins'
import { firstSymbolId, loadStyle } from './style'

interface Props {
  theme: 'light' | 'dark'
  snapshots: Snapshot[]
  selected: VenueId | null
  onSelect: (id: VenueId) => void
  origin: LngLat
  route: Route | null
  initialBounds: LngLat[]
}

const ROUTE_COLOR = '#059669'

export function MapView({ theme, snapshots, selected, onSelect, origin, route, initialBounds }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(0)
  const [failed, setFailed] = useState(false)
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement }>())
  const [, force] = useState(0)

  // Create the map once.
  useEffect(() => {
    let cancelled = false
    let map: MLMap | null = null
    loadStyle(theme)
      .then((style) => {
        if (cancelled || !box.current) return
        map = new MLMap({
          container: box.current,
          style,
          bounds: boundsOf(initialBounds),
          fitBoundsOptions: { padding: { top: 90, bottom: 330, left: 30, right: 30 } },
          pitch: 46,
          bearing: -12,
          maxPitch: 70,
          attributionControl: { compact: true },
          fadeDuration: 150,
        })
        mapRef.current = map
        setMap(map)
        map.on('style.load', () => {
          addOverlays(map!)
          setReady((n) => n + 1)
        })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      setMap(null)
      markers.current.forEach(({ marker }) => marker.remove())
      markers.current.clear()
      map?.remove()
      mapRef.current = null
    }
  }, [])

  // Swap base style when the theme changes, keep the camera.
  const firstTheme = useRef(theme)
  useEffect(() => {
    const map = mapRef.current
    if (!map || theme === firstTheme.current) return
    firstTheme.current = theme
    loadStyle(theme).then((style) => map.setStyle(style, { diff: false }))
  }, [theme])

  // Status halos under the pins.
  useEffect(() => {
    const src = mapRef.current?.getSource('venue-halo') as GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection',
      features: snapshots.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.venue.coords },
        properties: { color: STATUS[s.status].hex, selected: s.venue.id === selected ? 1 : 0 },
      })),
    })
  }, [snapshots, selected, ready])

  // Route line with a short draw-on animation.
  useEffect(() => {
    const src = mapRef.current?.getSource('route') as GeoJSONSource | undefined
    if (!src) return
    if (!route) {
      src.setData(emptyLine())
      return
    }
    let frame = 0
    const start = performance.now()
    const coords = route.coords
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 1100)
      const eased = 1 - Math.pow(1 - k, 3)
      const n = Math.max(2, Math.ceil(coords.length * eased))
      src.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords.slice(0, n) },
        properties: {},
      })
      if (k < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [route, ready])

  // DOM markers: venues, gates of the selected venue, and the origin dot.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const wanted = new Map<string, { at: LngLat; anchor: 'bottom' | 'center'; z: number }>()
    snapshots.forEach((s) => wanted.set(`v:${s.venue.id}`, { at: s.venue.coords, anchor: 'bottom', z: s.venue.id === selected ? 3 : 2 }))
    const sel = snapshots.find((s) => s.venue.id === selected)
    sel?.gates.forEach(({ gate }) => wanted.set(`g:${gate.id}`, { at: gate.coords, anchor: 'center', z: 1 }))
    wanted.set('origin', { at: origin, anchor: 'center', z: 1 })

    markers.current.forEach(({ marker }, key) => {
      if (!wanted.has(key)) {
        marker.remove()
        markers.current.delete(key)
      }
    })
    wanted.forEach(({ at, anchor, z }, key) => {
      const hit = markers.current.get(key)
      if (hit) {
        hit.marker.setLngLat(at)
        hit.el.style.zIndex = String(z)
        return
      }
      const el = document.createElement('div')
      el.style.zIndex = String(z)
      const marker = new Marker({ element: el, anchor }).setLngLat(at).addTo(map)
      markers.current.set(key, { marker, el })
    })
    force((n) => n + 1)
  }, [snapshots, selected, origin, ready])

  const sel = snapshots.find((s) => s.venue.id === selected)

  return (
    <div className="absolute inset-0">
      <div ref={box} className="absolute inset-0 bg-canvas" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-canvas text-[13px] text-ink-3">
          Peta gagal dimuat. Cek koneksi internet.
        </div>
      )}
      {snapshots.map((s) => {
        const el = markers.current.get(`v:${s.venue.id}`)?.el
        return el
          ? createPortal(
              <VenuePin
                snap={s}
                selected={s.venue.id === selected}
                dimmed={!!selected && s.venue.id !== selected}
                onClick={() => onSelect(s.venue.id)}
              />,
              el,
              s.venue.id,
            )
          : null
      })}
      {sel?.gates.map(({ gate, queueMin }) => {
        const el = markers.current.get(`g:${gate.id}`)?.el
        return el
          ? createPortal(
              <AnimatePresence>
                <GatePin gate={gate} queueMin={queueMin} best={gate.id === sel.bestGate.id} />
              </AnimatePresence>,
              el,
              gate.id,
            )
          : null
      })}
      {(() => {
        const el = markers.current.get('origin')?.el
        return el ? createPortal(<OriginPin />, el, 'origin') : null
      })()}
    </div>
  )
}

function boundsOf(points: LngLat[]): [LngLat, LngLat] {
  const lng = points.map((p) => p[0])
  const lat = points.map((p) => p[1])
  return [
    [Math.min(...lng), Math.min(...lat)],
    [Math.max(...lng), Math.max(...lat)],
  ]
}

const emptyLine = () => ({ type: 'FeatureCollection' as const, features: [] })

function addOverlays(map: MLMap) {
  const beforeLabels = firstSymbolId(map.getStyle())
  if (!map.getSource('venue-halo')) {
    map.addSource('venue-halo', { type: 'geojson', data: emptyLine() })
  }
  if (!map.getLayer('venue-halo')) {
    map.addLayer(
      {
        id: 'venue-halo',
        type: 'circle',
        source: 'venue-halo',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 11, 14, 14, 42, 17, 190],
          'circle-blur': 1,
          'circle-opacity': ['case', ['==', ['get', 'selected'], 1], 0.5, 0.26],
          'circle-pitch-alignment': 'map',
        },
      },
      beforeLabels,
    )
  }
  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data: emptyLine(), lineMetrics: true })
  }
  if (!map.getLayer('route-glow')) {
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ROUTE_COLOR, 'line-width': 16, 'line-opacity': 0.22, 'line-blur': 8 },
    })
    map.addLayer({
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ffffff', 'line-width': 9 },
    })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': 5.5,
        'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#34d399', 1, ROUTE_COLOR],
      },
    })
  }
}
