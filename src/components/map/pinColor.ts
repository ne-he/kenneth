import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { STATUS } from '../../lib/status'

/** Zona KENNETH is the hero service, so its pins carry the one cornflower on the map. Lighter at night so it reads on onyx. */
const ZONE = 'bg-brand-600 dark:bg-brand-400'
/** Valet and chargers are services too, but they stay ink: a number, not a status. */
const SERVICE = 'bg-ink'
/** A place that does not offer the service on: still on the map, never a candidate. */
const MUTED = 'bg-ink-3'

/**
 * Background class of a pin's dot in the current mode. Plain parking shows the
 * status. With a service on, the dot says the service is on: cornflower for a
 * zone bay, ink for a valet wait or free chargers. Sold out bays and no free
 * chargers keep the red status dot, and places without the service go grey.
 */
export function factDot(fact: PinFact | undefined, snap: Snapshot): string {
  if (!fact) return STATUS[snap.status].dot
  switch (fact.kind) {
    case 'pct':
      return STATUS[snap.status].dot
    case 'price':
      return fact.left > 0 ? ZONE : STATUS.penuh.dot
    case 'wait':
      return SERVICE
    case 'chargers':
      return fact.free > 0 ? SERVICE : STATUS.penuh.dot
    case 'none':
      return MUTED
  }
}
