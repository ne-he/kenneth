import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence } from 'motion/react'
import { Map as MLMap, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Gate, LngLat, VenueId } from '../../data/types'
import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { signalMapReady } from '../../lib/splash'
import { scaleOf, type Shade } from '../../lib/accent'
import { useApp, type Accent } from '../../store/app'
import type { Route } from '../../store/ui'
import { around, hang, placeLabels, type Dot, type Label, type Offset } from './declutter'
import { fitPoints, setMap, sheetPad } from './mapApi'
import { GatePin, LABEL_INSET, OriginPin, VenuePin } from './Pins'
import { loadStyle } from './style'

interface Props {
  theme: 'light' | 'dark'
  snapshots: Snapshot[]
  /** What each pin says in the current mode. Missing means percent full. */
  facts?: ReadonlyMap<VenueId, PinFact>
  selected: VenueId | null
  /** The card in view on the home row: its pin is lifted without opening it. */
  focused?: VenueId | null
  onSelect: (id: VenueId) => void
  origin: LngLat
  route: Route | null
  initialBounds: LngLat[]
}

/**
 * The route is the one accent line on the map, cornflower unless the user
 * picked another accent. A casing in the map's own ground colour lifts it off
 * the roads (white on porcelain, onyx at night), and a faint glow keeps it
 * readable over 3D blocks. From and to are shades of the accent scale.
 */
const ROUTE = {
  light: { from: 400, to: 600, casing: '#ffffff', glow: 0.14 },
  dark: { from: 300, to: 500, casing: '#0d0d10', glow: 0.22 },
} as const satisfies Record<'light' | 'dark', { from: Shade; to: Shade; casing: string; glow: number }>

const routeColors = (theme: 'light' | 'dark', accent: Accent) => {
  const r = ROUTE[theme]
  const scale = scaleOf(accent)
  return { ...r, from: scale[r.from], to: scale[r.to] }
}

/** From this zoom the place labels carry the short name too. */
const NAMED_ZOOM = 14.5

// MapLibre 6 finds its worker relative to its own module URL, which a bundler
// cannot see. Hand it a bundled worker explicitly so dev and prod both work.
setWorkerUrl(workerUrl)

export function MapView({ theme, snapshots, facts, selected, focused = null, onSelect, origin, route, initialBounds }: Props) {
  const t = useT()
  const box = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(0)
  const [failed, setFailed] = useState(false)
  const markers = useRef(new Map<string, { marker: Marker; el: HTMLElement }>())
  // Marker elements live outside React. Mirror them in state so portals render from state, not a ref.
  const [els, setEls] = useState<ReadonlyMap<string, HTMLElement>>(() => new Map())
  // Where each label sits relative to its point. Null: no room, the place stays a bare dot.
  const [offsets, setOffsets] = useState<ReadonlyMap<string, Offset | null>>(() => new Map())
  const [named, setNamed] = useState(false)

  const favorites = useApp((s) => s.favorites)
  const look = useApp((s) => s.mapPrefs.style)
  const threeD = useApp((s) => s.mapPrefs.threeD)
  const accent = useApp((s) => s.accent)

  // Create the map once. Theme and camera changes after that have their own effects,
  // so the first theme and bounds are read through an effect event, not dependencies.
  const initial = useEffectEvent(() => ({ theme, bounds: initialBounds, look, threeD }))
  // Overlays are added again after every style swap, in the colours of the theme at that moment.
  const overlays = useEffectEvent((map: MLMap) => addOverlays(map, routeColors(theme, accent)))
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
          overlays(map!)
          setReady((n) => n + 1)
        })
        map.once('load', () => {
          if (first.threeD) fitPoints(first.bounds, sheetPad(), 15.5, 0)
          // The compact attribution opens on first paint and lands on the home sheet; start it folded to the (i).
          map!.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
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

  // A new accent recolours the route in place, no style swap needed.
  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded() || !map.getLayer('route-line')) return
    const r = routeColors(theme, accent)
    map.setPaintProperty('route-glow', 'line-color', r.to)
    map.setPaintProperty('route-line', 'line-gradient', ['interpolate', ['linear'], ['line-progress'], 0, r.from, 1, r.to])
  }, [theme, accent])

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
    const lifted = (id: VenueId) => id === selected || id === focused
    snapshots.forEach((s) => wanted.set(`v:${s.venue.id}`, { at: s.venue.coords, anchor: 'center', z: lifted(s.venue.id) ? 3 : 2 }))
    const sel = snapshots.find((s) => s.venue.id === selected)
    sel?.gates.forEach(({ gate }) => wanted.set(`g:${gate.id}`, { at: gate.coords, anchor: 'center', z: 1 }))
    // You are here sits on top: labels keep clear of it, so it only ever covers the dot of a place you are at.
    wanted.set('origin', { at: origin, anchor: 'center', z: 4 })

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
  }, [snapshots, selected, focused, origin, ready])

  // Lay the labels out once they are in the DOM (their size depends on the text) and after every camera
  // move. Priority: the selected place, the focused card, favourites, then the ranking the list uses. A
  // label that has no room is dropped, never moved away from its dot.
  const layout = useEffectEvent(() => {
    const map = mapRef.current
    if (!map) return
    setNamed(map.getZoom() >= NAMED_ZOOM)
    const size = (key: string) => {
      const label = markers.current.get(key)?.el.querySelector<HTMLElement>('[data-pin-label]')
      return { w: label?.offsetWidth ?? 0, h: label?.offsetHeight ?? 0 }
    }
    const here = map.project(origin)
    const dots: Dot[] = [{ id: 'origin', x: here.x, y: here.y, r: 9 }]
    const places: Label[] = []
    const rank = (s: Snapshot) =>
      s.venue.id === selected ? 0 : s.venue.id === focused ? 1 : favorites.includes(s.venue.id) ? 2 : 3
    const order = snapshots.map((s, i) => ({ s, i })).sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
    for (const { s } of order) {
      const { x, y } = map.project(s.venue.coords)
      dots.push({ id: s.venue.id, x, y, r: 6 })
      // The selected place and the focused card both get the ink name pill, which never drops.
      const picked = s.venue.id === selected || s.venue.id === focused
      if (!picked && facts?.get(s.venue.id)?.kind === 'none') continue
      const { w, h } = size(`v:${s.venue.id}`)
      places.push({ id: s.venue.id, x, y, w, h, spots: picked ? around(w, h, 9) : hang(w, LABEL_INSET), keep: picked })
    }
    // Gate chips sit on their gate. The recommended one goes before the selected label so that label steps
    // round it, the others only show where there is room. Zoomed out a chip would cover the place itself,
    // so it waits until the gates spread apart.
    const sel = snapshots.find((s) => s.venue.id === selected)
    const gate = (g: Gate): Label => {
      const { x, y } = map.project(g.coords)
      return { id: `g:${g.id}`, x, y, ...size(`g:${g.id}`), spots: [[0, 0]] }
    }
    const best = sel ? [gate(sel.bestGate)] : []
    const rest = (sel?.gates ?? []).filter(({ gate: g }) => g.id !== sel?.bestGate.id).map(({ gate: g }) => gate(g))
    const top = places.filter((l) => l.id === selected)
    const labels = [...best, ...top, ...rest, ...places.filter((l) => l.id !== selected)]
    const canvas = map.getContainer()
    const next = placeLabels(labels, dots, { w: canvas.clientWidth, h: canvas.clientHeight })
    setOffsets((prev) => (sameOffsets(prev, next) ? prev : next))
  })
  // A layout effect, so a mode switch (new text, new widths) is measured and placed before the frame
  // paints: the pills never show at the spot their old width earned them.
  useLayoutEffect(() => {
    const map = mapRef.current
    if (!map) return
    layout()
    const onMove = () => layout()
    map.on('moveend', onMove)
    return () => {
      map.off('moveend', onMove)
    }
  }, [snapshots, facts, selected, focused, origin, favorites, named, els, ready])

  const sel = snapshots.find((s) => s.venue.id === selected)

  return (
    <div className="absolute inset-0">
      {/* maplibre forces position: relative on its container, so size it with h-full, not inset */}
      <div ref={box} className="h-full w-full bg-canvas" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-canvas text-[13px] text-ink-3">
          {t.explore.mapFail}
        </div>
      )}
      {snapshots.map((s) => {
        const el = els.get(`v:${s.venue.id}`)
        return el
          ? createPortal(
              <VenuePin
                snap={s}
                fact={facts?.get(s.venue.id)}
                offset={offsets.get(s.venue.id)}
                named={named}
                selected={s.venue.id === selected || s.venue.id === focused}
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
                <GatePin gate={gate} queueMin={queueMin} best={gate.id === sel.bestGate.id} shown={!!offsets.get(`g:${gate.id}`)} />
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

function sameOffsets(a: ReadonlyMap<string, Offset | null>, b: ReadonlyMap<string, Offset | null>) {
  if (a.size !== b.size) return false
  for (const [k, n] of b) {
    const o = a.get(k)
    if (o === undefined) return false
    if (o === null || n === null) {
      if (o !== n) return false
    } else if (Math.abs(o[0] - n[0]) > 0.5 || Math.abs(o[1] - n[1]) > 0.5) return false
  }
  return true
}

const emptyLine = () => ({ type: 'FeatureCollection' as const, features: [] })

function addOverlays(map: MLMap, r: ReturnType<typeof routeColors>) {
  if (!map.getSource('route')) {
    map.addSource('route', { type: 'geojson', data: emptyLine(), lineMetrics: true })
  }
  if (!map.getLayer('route-glow')) {
    map.addLayer({
      id: 'route-glow',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': r.to, 'line-width': 14, 'line-opacity': r.glow, 'line-blur': 6 },
    })
    map.addLayer({
      id: 'route-casing',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': r.casing, 'line-width': 8.5 },
    })
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-width': 5,
        'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, r.from, 1, r.to],
      },
    })
  }
}
