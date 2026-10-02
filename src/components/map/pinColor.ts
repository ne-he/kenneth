import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { STATUS } from '../../lib/status'

const INK = '#121216'
const EV = '#2f5bd3'
const MUTED = '#9a9aa0'

/** Colour of a pin in the current mode: status for how full, red when the zone is sold out, ink for valet, cornflower for chargers, grey when not offered. */
export function factHex(fact: PinFact | undefined, snap: Snapshot): string {
  if (!fact) return STATUS[snap.status].hex
  switch (fact.kind) {
    case 'pct':
      return STATUS[snap.status].hex
    case 'price':
      return fact.left > 0 ? STATUS[snap.status].hex : STATUS.penuh.hex
    case 'wait':
      return INK
    case 'chargers':
      return fact.free === 0 ? STATUS.penuh.hex : EV
    case 'none':
      return MUTED
  }
}
