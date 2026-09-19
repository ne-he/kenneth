import type { VehicleKind, Venue } from '../data/types'

/** Things you can book at a venue. Each one only exists where it can actually be kept. */
export type Service = 'priority' | 'valet' | 'ev'

/**
 * What this venue offers this vehicle. Motorbikes get none of the three:
 * no priority lanes, no valet, no car chargers. Campuses sell nothing, they
 * only show how full they are.
 */
export function servicesFor(venue: Venue, kind: VehicleKind): Service[] {
  if (kind !== 'mobil') return []
  const out: Service[] = []
  if (venue.gates.some((g) => g.priorityLane)) out.push('priority')
  if (venue.valet) out.push('valet')
  if (venue.ev.chargers > 0) out.push('ev')
  return out
}
