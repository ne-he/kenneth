import type { StyleSpecification } from 'maplibre-gl'
import type { MapStyle } from '../../store/app'

/*
  Base maps come from OpenFreeMap (free, no API key, OpenStreetMap data).

  Two looks, picked in Opsi peta:
  - calm: Positron and Dark, recoloured so the map sits inside the app
    palette and the status colours are the loudest thing on screen.
  - detail: Liberty and Fiord as published, with shop, transit and park
    labels, for people who want the map to look like a map.

  Either way the flat building layer becomes real 3D extrusions when close,
  unless the user turned 3D off.
*/

type Mode = 'light' | 'dark'

const STYLE_URL: Record<MapStyle, Record<Mode, string>> = {
  calm: {
    light: 'https://tiles.openfreemap.org/styles/positron',
    dark: 'https://tiles.openfreemap.org/styles/dark',
  },
  detail: {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/fiord',
  },
}

// Porcelain and onyx, the same neutrals as the app surfaces. Green and blue are only a hint, so parks and water
// still read as such without competing with the status dots.
const PALETTE: Record<Mode, Record<string, string>> = {
  light: {
    background: '#efefeb',
    park: '#e4e8e0',
    landcover_wood: '#e4e8e0',
    landuse_park: '#e4e8e0',
    water: '#d3dade',
    landuse_residential: '#ebebe7',
    highway_minor: '#e2e2dd',
    building3d: '#e4e4df',
    building3dTop: '#f6f6f3',
  },
  dark: {
    background: '#0d0d10',
    park: '#111412',
    landcover_wood: '#111412',
    landuse_park: '#111412',
    water: '#0e1116',
    landuse_residential: '#101013',
    highway_minor: '#19191e',
    building3d: '#1b1b21',
    building3dTop: '#27272e',
  },
}

// Liberty ships its own extrusions. Fiord does not, so it gets these, picked to sit on its slate blue.
const DETAIL_BUILDINGS: Record<Mode, [string, string]> = {
  light: ['#dcd6ca', '#efe9df'],
  dark: ['#3b4660', '#56627e'],
}

type Layer = StyleSpecification['layers'][number]

const cache = new Map<string, StyleSpecification>()

export async function loadStyle(mode: Mode, look: MapStyle = 'calm', threeD = true): Promise<StyleSpecification> {
  const key = `${look}:${mode}`
  let base = cache.get(key)
  if (!base) {
    const res = await fetch(STYLE_URL[look][mode])
    if (!res.ok) throw new Error(`style ${res.status}`)
    const raw = (await res.json()) as StyleSpecification
    base = look === 'calm' ? tint(raw, mode) : raw
    cache.set(key, base)
  }
  const style = structuredClone(base)
  return threeD ? extrude(style, look === 'calm' ? [PALETTE[mode].building3d, PALETTE[mode].building3dTop] : DETAIL_BUILDINGS[mode]) : flatten(style)
}

function tint(style: StyleSpecification, mode: Mode): StyleSpecification {
  const p = PALETTE[mode]
  const layers = style.layers.map((layer) => {
    const color = p[layer.id]
    if (layer.type === 'background' && p.background) {
      return { ...layer, paint: { ...layer.paint, 'background-color': p.background } }
    }
    if (layer.type === 'fill' && color) {
      return { ...layer, paint: { ...layer.paint, 'fill-color': color } }
    }
    if (layer.type === 'line' && color) {
      return { ...layer, paint: { ...layer.paint, 'line-color': color } }
    }
    return layer
  })
  return { ...style, layers }
}

/** Flat footprints when zoomed out, 3D blocks when close. Keeps a style's own extrusions if it has them. */
function extrude(style: StyleSpecification, [low, high]: [string, string]): StyleSpecification {
  if (style.layers.some((l) => l.type === 'fill-extrusion')) return style
  const layers: Layer[] = style.layers.map((l) => (l.id === 'building' ? ({ ...l, maxzoom: 14.5 } as Layer) : l))
  const extruded = {
    id: 'building-3d',
    type: 'fill-extrusion',
    source: 'openmaptiles',
    'source-layer': 'building',
    minzoom: 14,
    paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, low, 80, high],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.2, ['coalesce', ['get', 'render_height'], 8]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.88,
      'fill-extrusion-vertical-gradient': true,
    },
  } as Layer
  // 3D buildings go above the roads but under every label.
  const firstLabel = layers.findIndex((l) => l.type === 'symbol')
  layers.splice(firstLabel < 0 ? layers.length : firstLabel, 0, extruded)
  return { ...style, layers }
}

/** 3D off: drop every extrusion and let the flat footprints show at every zoom. */
function flatten(style: StyleSpecification): StyleSpecification {
  const layers = style.layers
    .filter((l) => l.type !== 'fill-extrusion')
    .map((l) => {
      if (l.id !== 'building') return l
      const { maxzoom: _drop, ...rest } = l as Layer & { maxzoom?: number }
      void _drop
      return rest as Layer
    })
  return { ...style, layers }
}
