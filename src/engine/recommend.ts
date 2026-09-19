import type { LngLat, Venue, VenueId } from '../data/types'
import { VENUE_BY_ID } from '../data/venues'
import { estimateDrive, haversineKm } from '../lib/geo'
import { snapshot, type Snapshot } from './occupancy'

export interface Travel {
  km: number
  minutes: number
  /** 'road' when it came from the routing service, 'estimate' otherwise. */
  source: 'road' | 'estimate'
}

export interface Ranked extends Snapshot {
  travel: Travel
  /** Drive + queue at the recommended gate + circling for a bay. */
  timeToPark: number
  /** Same trip for someone without the app: default gate, no heads-up. */
  timeToParkBlind: number
}

export type TravelLookup = Partial<Record<VenueId, Travel>>

export function travelTo(venue: Venue, origin: LngLat, lookup?: TravelLookup): Travel {
  const known = lookup?.[venue.id]
  if (known) return known
  const { km, minutes } = estimateDrive(origin, venue.coords)
  return { km, minutes, source: 'estimate' }
}

export function rankVenues(venues: Venue[], ts: number, origin: LngLat, lookup?: TravelLookup): Ranked[] {
  return venues
    .map((venue) => {
      const snap = snapshot(venue, ts)
      const travel = travelTo(venue, origin, lookup)
      return {
        ...snap,
        travel,
        timeToPark: travel.minutes + snap.bestGateQueueMin + snap.cruiseMin,
        timeToParkBlind: travel.minutes + snap.queueMin + snap.cruiseMin,
      }
    })
    .sort((a, b) => a.timeToPark - b.timeToPark)
}

export interface Alternative {
  snap: Snapshot
  /** Distance between the two venues, not from the user. */
  km: number
  walk?: { minutes: number; via: string }
}

/**
 * Nearby venues that are not full, for when the chosen one is. Venues the
 * user can walk to from the original destination come first, because that
 * keeps the original plan alive (park next door, walk over). A full campus
 * points to the other campuses and to anything within walking distance, not
 * to a mall across town.
 */
export function alternativesFor(venue: Venue, venues: Venue[], ts: number, limit = 2): Alternative[] {
  return venues
    .filter((v) => v.id !== venue.id)
    .filter((v) => v.category === venue.category || venue.walkLinks.some((l) => l.to === v.id))
    .map((v) => {
      const link = venue.walkLinks.find((l) => l.to === v.id)
      return {
        snap: snapshot(v, ts),
        km: haversineKm(venue.coords, v.coords),
        walk: link ? { minutes: link.minutes, via: link.via } : undefined,
      }
    })
    .filter((a) => a.snap.status !== 'penuh' && a.km < 6)
    .sort((a, b) => Number(!!b.walk) - Number(!!a.walk) || a.km - b.km)
    .slice(0, limit)
}

export const venueName = (id: VenueId) => VENUE_BY_ID[id].name
