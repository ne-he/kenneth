import type { VehicleKind, Venue } from '../data/types'
import { zoneOf } from './zone'

/**
 * Things you can book at a venue. 'priority' is the Zona KENNETH bay. The key
 * kept its v0.3 name so bookings already saved on phones still load.
 */
export type Service = 'priority' | 'valet' | 'ev'

/**
 * What this venue offers this vehicle. Motorbikes get none of the three:
 * no Zona KENNETH bays, no runner valet, no car chargers. Campuses sell nothing, they
 * only show how full they are.
 */
export function servicesFor(venue: Venue, kind: VehicleKind): Service[] {
  if (kind !== 'mobil') return []
  const out: Service[] = []
  if (zoneOf(venue)) out.push('priority')
  if (venue.valet) out.push('valet')
  if (venue.ev.chargers > 0) out.push('ev')
  return out
}
