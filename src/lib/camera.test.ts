import { describe, expect, it } from 'vitest'
import { GLIDE_ZOOM_MAX, GLIDE_ZOOM_MIN, glideZoom } from './camera'

describe('glideZoom', () => {
  it('keeps a zoom that is already in the band, so swiping cards pans instead of re-zooming', () => {
    expect(glideZoom(15)).toBe(15)
    expect(glideZoom(GLIDE_ZOOM_MIN)).toBe(GLIDE_ZOOM_MIN)
    expect(glideZoom(GLIDE_ZOOM_MAX)).toBe(GLIDE_ZOOM_MAX)
  })

  it('pulls a close-up back out and an overview in', () => {
    // 16.2 is where flyTo leaves a place, a wide fitBounds sits far below the band.
    expect(glideZoom(16.2)).toBe(15.6)
    expect(glideZoom(12)).toBe(14.2)
  })
})
