import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence } from 'motion/react'
import { Map as MLMap, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LngLat, VenueId } from '../../data/types'
import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { signalMapReady } from '../../lib/splash'
import { useApp } from '../../store/app'
import type { Route } from '../../store/ui'
import { fitPoints, setMap, sheetPad } from './mapApi'
import { GatePin, OriginPin, VenuePin } from './Pins'
import { factHex } from './pinColor'
import { firstSymbolId, loadStyle } from './style'

interface Props {
  theme: 'light' | 'dark'
  snapshots: Snapshot[]
  /** What each pin says in the current mode. Missing means percent full. */
  facts?: ReadonlyMap<VenueId, PinFact>
  selected: VenueId | null
  onSelect: (id: VenueId) => void
  origin: LngLat
  route: Route | null
  initialBounds: LngLat[]
}

const ROUTE_COLOR = '#059669'

// MapLibre 6 finds its worker relative to its own module URL, which a bundler
// cannot see. Hand it a bundled worker explicitly so dev and prod both work.
setWorkerUrl(workerUrl)

export function MapView({ theme, snapshots, facts, selected, onSelect, origin, route, initialBounds }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(0)
  const [failed, setFailed] = useState(false)
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement }>())
  // Marker elements live outside React. Mirror them in state so portals render from state, not a ref.
  const [els, setEls] = useState<ReadonlyMap<string, HTMLElement>>(() => new Map())

  const look = useApp((s) => s.mapPrefs.style)
  const threeD = useApp((s) => s.mapPrefs.threeD)

  // Create the map once. Theme and camera changes after that have their own effects,
  // so the first theme and bounds are read through an effect event, not dependencies.
  const initial = useEffectEvent(() => ({ theme, bounds: initialBounds, look, threeD }))
  useEffect(() => {
    let cancelled = false
    let map: MLMap | null = null
    const live = markers.current
    const first = initial()
    loadStyle(first.theme, first.look, first.threeD)
      .then((style) => {
        if (cancelled || !box.current) return
        // Fit flat first, then tilt: a tilted fit in the constructor frames the horizon, not the pins.
        map = new MLMap({
          container: box.current,
          style,
          bounds: boundsOf(first.bounds),
          fitBoundsOptions: { padding: { top: 136, bottom: sheetPad(box.current.clientHeight), left: 56, right: 72 } },
          maxPitch: 70,
          attributionControl: { compact: true },
          fadeDuration: 150,
        })
        mapRef.current = map
        setMap(map)
        if (import.meta.env.DEV) (window as unknown as { __kmap: MLMap }).__kmap = map
        map.on('style.load', () => {
          addOverlays(map!)
          setReady((n) => n + 1)
        })
        map.once('load', () => {
          if (first.threeD) fitPoints(first.bounds, sheetPad(), 15.5, 0)
          signalMapReady()
        })
      })
      .catch(() => {
        signalMapReady()
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
      setMap(null)
      live.forEach(({ marker }) => marker.remove())
      live.clear()
      map?.remove()
      mapRef.current = null
    }
  }, [])

  // Swap the base style when the theme, the look or 3D changes, keep the camera.
  const shown = useRef(`${theme}:${look}:${threeD}`)
  useEffect(() => {
    const map = mapRef.current
    const key = `${theme}:${look}:${threeD}`
    if (!map || key === shown.current) return
    const wasFlat = shown.current.endsWith('false')
    shown.current = key
    loadStyle(theme, look, threeD)
      .then((style) => map.setStyle(style, { diff: false }))
      .catch(() => undefined)
    if (threeD && wasFlat) map.easeTo({ pitch: 50, bearing: -12, duration: 700 })
    if (!threeD) map.easeTo({ pitch: 0, bearing: 0, duration: 700 })
  }, [theme, look, threeD])

  // Status halos under the pins.
  useEffect(() => {
    const src = mapRef.current?.getSource('venue-halo') as GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection',
      features: snapshots
        .filter((s) => facts?.get(s.venue.id)?.kind !== 'none')
        .map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: s.venue.coords },
          properties: { color: factHex(facts?.get(s.venue.id), s), selected: s.venue.id === selected ? 1 : 0 },
        })),
    })
  }, [snapshots, facts, selected, ready])

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
    snapshots.forEach((s) => wanted.set(`v:${s.venue.id}`, { at: s.venue.coords, anchor: 'center', z: s.venue.id === selected ? 3 : 2 }))
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
    setEls(() => new Map([...markers.current].map(([key, m]) => [key, m.el])))
  }, [snapshots, selected, origin, ready])

  const sel = snapshots.find((s) => s.venue.id === selected)

  return (
    <div className="absolute inset-0">
      {/* maplibre forces position: relative on its container, so size it with h-full, not inset */}
      <div ref={box} className="h-full w-full bg-canvas" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-canvas text-[13px] text-ink-3">
          Peta gagal dimuat. Cek koneksi internet.
        </div>
      )}
      {snapshots.map((s) => {
        const el = els.get(`v:${s.venue.id}`)
        return el
          ? createPortal(
              <VenuePin
                snap={s}
                fact={facts?.get(s.venue.id)}
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
        const el = els.get(`g:${gate.id}`)
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
        const el = els.get('origin')
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
