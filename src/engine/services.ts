import type { VehicleKind, Venue } from '../data/types'
import { zoneOf } from './zone'

/**
 * Things you can book at a venue. 'zone' is a Zona KENNETH bay. Called
 * 'priority' until v0.4; the value is never saved, so renaming it was safe.
 */
export type Service = 'zone' | 'valet' | 'ev'

/**
 * What this venue offers this vehicle: whatever the place has set up, a
 * zone lane, a runner desk, chargers. Malls, campuses and offices follow the
 * same rules (decision 2 Oct 2026). Motorbikes get none of the three.
 */
export function servicesFor(venue: Venue, kind: VehicleKind): Service[] {
  if (kind !== 'mobil') return []
  const out: Service[] = []
  if (zoneOf(venue)) out.push('zone')
  if (venue.valet) out.push('valet')
  if (venue.ev.chargers > 0) out.push('ev')
  return out
}
