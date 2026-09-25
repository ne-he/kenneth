import type { VehicleKind, Venue } from '../data/types'
import { zoneOf } from './zone'

/**
 * Things you can book at a venue. 'zone' is a Zona KENNETH bay. Called
 * 'priority' until v0.4; the value is never saved, so renaming it was safe.
 */
export type Service = 'zone' | 'valet' | 'ev'

/**
 * What this venue offers this vehicle. Motorbikes get none of the three:
 * no Zona KENNETH bays, no runner valet, no car chargers. Campuses sell nothing, they
 * only show how full they are.
 */
export function servicesFor(venue: Venue, kind: VehicleKind): Service[] {
  if (kind !== 'mobil') return []
  const out: Service[] = []
  if (zoneOf(venue)) out.push('zone')
  if (venue.valet) out.push('valet')
  if (venue.ev.chargers > 0) out.push('ev')
  return out
}
