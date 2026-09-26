import { describe, expect, it } from 'vitest'
import type { LngLat } from '../data/types'
import { externalNavUrl } from './navApps'

// Gerbang 3 of Central Park. Stored longitude first, both apps want latitude first.
const gate: LngLat = [106.79058, -6.17702]

describe('external navigation links', () => {
  it('asks Google Maps for a driving route to the gate', () => {
    expect(externalNavUrl('gmaps', gate)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-6.177020,106.790580&travelmode=driving',
    )
  })

  it('starts Waze navigating to the gate', () => {
    expect(externalNavUrl('waze', gate)).toBe('https://waze.com/ul?ll=-6.177020,106.790580&navigate=yes')
  })
})
