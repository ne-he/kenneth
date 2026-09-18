import type { StyleSpecification } from 'maplibre-gl'

/*
  Base maps come from OpenFreeMap (free, no API key, OpenStreetMap data).
  We fetch their style JSON and recolour it so the map sits inside the app
  palette instead of looking like a pasted-in Google clone, then swap the
  flat building layer for real 3D extrusions.
*/

const STYLE_URL = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const

type Mode = keyof typeof STYLE_URL

const PALETTE: Record<Mode, Record<string, string>> = {
  light: {
    background: '#f1f0eb',
    park: '#e2eadf',
    landcover_wood: '#e2eadf',
    landuse_park: '#e2eadf',
    water: '#c6d5d6',
    landuse_residential: '#ecebe5',
    highway_minor: '#e3e2dc',
    building3d: '#e6e4dd',
    building3dTop: '#f7f6f2',
  },
  dark: {
    background: '#0a0d0c',
    park: '#0f1813',
    landcover_wood: '#0f1813',
    landuse_park: '#0f1813',
    water: '#0c1515',
    landuse_residential: '#0d1110',
    highway_minor: '#161b19',
    building3d: '#18201c',
    building3dTop: '#222b26',
  },
}

const cache = new Map<Mode, StyleSpecification>()

export async function loadStyle(mode: Mode): Promise<StyleSpecification> {
  const hit = cache.get(mode)
  if (hit) return structuredClone(hit)
  const res = await fetch(STYLE_URL[mode])
  if (!res.ok) throw new Error(`style ${res.status}`)
  const style = tint((await res.json()) as StyleSpecification, mode)
  cache.set(mode, style)
  return structuredClone(style)
}

function tint(style: StyleSpecification, mode: Mode): StyleSpecification {
  const p = PALETTE[mode]
  let extrusion: StyleSpecification['layers'][number] | null = null
  const layers = style.layers.flatMap((layer) => {
    const color = p[layer.id]
    if (layer.type === 'background' && p.background) {
      return [{ ...layer, paint: { ...layer.paint, 'background-color': p.background } }]
    }
    if (layer.type === 'fill' && color) {
      return [{ ...layer, paint: { ...layer.paint, 'fill-color': color } }]
    }
    if (layer.type === 'line' && color) {
      return [{ ...layer, paint: { ...layer.paint, 'line-color': color } }]
    }
    if (layer.id === 'building') {
      // Keep flat footprints when zoomed out, extrude them when close.
      const flat = { ...layer, maxzoom: 14.5 }
      const extruded = {
        id: 'building-3d',
        type: 'fill-extrusion' as const,
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'render_height'], 8],
            0,
            p.building3d,
            80,
            p.building3dTop,
          ],
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14,
            0,
            15.2,
            ['coalesce', ['get', 'render_height'], 8],
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': mode === 'dark' ? 0.92 : 0.86,
          'fill-extrusion-vertical-gradient': true,
        },
      }
      extrusion = extruded as StyleSpecification['layers'][number]
      return [flat]
    }
    return [layer]
  })
  // 3D buildings go above the roads but under every label.
  const firstLabel = layers.findIndex((l) => l.type === 'symbol')
  if (extrusion) layers.splice(firstLabel < 0 ? layers.length : firstLabel, 0, extrusion)
  return { ...style, layers }
}

/** Id of the first label layer, so app overlays can slot in underneath it. */
export const firstSymbolId = (style: StyleSpecification) => style.layers.find((l) => l.type === 'symbol')?.id
