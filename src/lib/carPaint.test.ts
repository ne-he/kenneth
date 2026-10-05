import { describe, expect, it } from 'vitest'
import { PAINTS, paintPixels } from './carPaint'

const image = (pixels: number[][], width: number) => ({ data: new Uint8ClampedArray(pixels.flat()), width, height: pixels.length / width })

describe('repainting the key-green body', () => {
  it('turns an evenly lit green body into the paint, with the faint sheen of a lit face', () => {
    const green = [0, 200, 83, 255]
    const img = image(Array.from({ length: 25 }, () => green), 5)
    paintPixels(img.data, img.width, img.height, PAINTS.merah)
    const [r, g, b, a] = Array.from(img.data.slice(12 * 4, 12 * 4 + 4))
    // #B3262E is 179, 38, 46: the red stays put, the dark channels lift a little, no green is left.
    expect(Math.abs(r - 179)).toBeLessThanOrEqual(6)
    expect(g).toBeGreaterThanOrEqual(38)
    expect(g).toBeLessThan(70)
    expect(b).toBeLessThan(75)
    expect(r).toBeGreaterThan(g * 2.5)
    expect(a).toBe(255)
  })

  it('keeps the shading: a darker green becomes a darker paint', () => {
    const img = image([[0, 200, 83, 255], [0, 200, 83, 255], [0, 200, 83, 255], [0, 100, 41, 255]], 4)
    paintPixels(img.data, img.width, img.height, PAINTS.putih)
    expect(img.data[12]).toBeLessThan(img.data[0])
  })

  it('leaves the windows, tires and the transparent background alone', () => {
    const img = image([[43, 45, 53, 255], [28, 28, 33, 255], [0, 0, 0, 0]], 3)
    const before = Array.from(img.data)
    paintPixels(img.data, img.width, img.height, PAINTS.biru)
    expect(Array.from(img.data)).toEqual(before)
  })
})
