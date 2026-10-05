import { useEffect, useState } from 'react'

export type CarPaint = 'putih' | 'silver' | 'abu' | 'hitam' | 'merah' | 'biru' | 'cokelat'

/** The common paints on Indonesian roads, in the order the picker shows them. */
export const PAINTS: Record<CarPaint, string> = {
  putih: '#F2F1EC',
  silver: '#B9BDC3',
  abu: '#6B7078',
  hitam: '#25262B',
  merah: '#B3262E',
  biru: '#24427F',
  cokelat: '#6E4C36',
}
export const PAINT_ORDER = Object.keys(PAINTS) as CarPaint[]
export const DEFAULT_PAINT: CarPaint = 'silver'

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c: number) => {
  const v = Math.min(1, Math.max(0, c))
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055
}

/** 5-tap binomial blur, separable, edges clamped. */
function blur(src: Float32Array, w: number, h: number) {
  const k = [1, 4, 6, 4, 1].map((x) => x / 16)
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let i = -2; i <= 2; i++) s += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * k[i + 2]
      tmp[y * w + x] = s
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0
      for (let i = -2; i <= 2; i++) s += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * k[i + 2]
      out[y * w + x] = s
    }
  return out
}

/**
 * Repaints the key-green body of a vehicle render, in place. The same method
 * as the render kit's recolor.py: each pixel's share of the green (by hue and
 * saturation) is the body, its brightness against the typical body brightness
 * is the shading, and the paint is multiplied by that shading in linear light
 * with highlights lifted toward white. Green spill on the edges is removed.
 */
export function paintPixels(px: Uint8ClampedArray, width: number, height: number, hex: string) {
  const n = width * height
  const weight = new Float32Array(n)
  const value = new Float32Array(n)
  const core: number[] = []
  for (let i = 0; i < n; i++) {
    const r = px[i * 4] / 255
    const g = px[i * 4 + 1] / 255
    const b = px[i * 4 + 2] / 255
    const mx = Math.max(r, g, b)
    const d = mx - Math.min(r, g, b)
    const sat = mx > 0 ? d / mx : 0
    let hue = 0
    if (d > 1e-6) {
      hue = mx === r ? ((((g - b) / d) % 6) + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
      hue *= 60
    }
    const w = (1 - smooth(0, 20, Math.max(Math.abs(hue - 142) - 32, 0))) * smooth(0.12, 0.35, sat) * smooth(0.04, 0.1, mx)
    weight[i] = w
    value[i] = mx
    if (w > 0.95) core.push(mx)
  }
  core.sort((a, b) => a - b)
  const v0 = core.length ? core[core.length >> 1] : 0.8
  // Shading is smoothed inside the body only, so the grain of the green does not show in dark paints.
  const sw = blur(Float32Array.from(value, (v, i) => v * weight[i]), width, height)
  const ww = blur(weight, width, height)

  const c = [1, 3, 5].map((o) => toLin(parseInt(hex.slice(o, o + 2), 16) / 255))
  const lift = (1 - (c[0] + c[1] + c[2]) / 3) * 0.06
  for (let i = 0; i < n; i++) {
    const w = weight[i]
    const r = px[i * 4]
    const b = px[i * 4 + 2]
    const g = Math.min(px[i * 4 + 1], Math.max(r, b))
    if (w <= 0) {
      px[i * 4 + 1] = g
      continue
    }
    const s = (w > 0.02 ? sw[i] / Math.max(ww[i], 1e-6) : value[i]) / v0
    const sl = s ** 2.2
    const rest = [r, g, b]
    for (let k = 0; k < 3; k++) {
      let body = sl <= 1 ? c[k] * sl : c[k] + (1 - c[k]) * Math.min(1, sl - 1) * 1.2
      body += lift * Math.min(1, Math.max(0, sl - 0.6))
      px[i * 4 + k] = Math.round(rest[k] * (1 - w) + toSrgb(body) * 255 * w)
    }
  }
}

const painted = new Map<string, Promise<string>>()

/** A render repainted in one paint, as an object URL. Each pair is painted once per session. */
export function paintedSprite(url: string, paint: CarPaint): Promise<string> {
  const key = `${url}|${paint}`
  let job = painted.get(key)
  if (!job) {
    job = (async () => {
      const img = new Image()
      img.src = url
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('no 2d context')
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      paintPixels(data.data, canvas.width, canvas.height, PAINTS[paint])
      ctx.putImageData(data, 0, 0)
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
      )
      return URL.createObjectURL(blob)
    })()
    job.catch(() => painted.delete(key))
    painted.set(key, job)
  }
  return job
}

/** The painted render for an icon. Keeps the previous one on screen while a new paint is made. */
export function usePaintedSprite(url: string | undefined, paint: CarPaint): string | undefined {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    if (!url) return
    let alive = true
    paintedSprite(url, paint)
      .then((s) => alive && setSrc(s))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [url, paint])
  return url ? src : undefined
}
