import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { STATUS } from '../../lib/status'

const INK = '#111512'
const EV = '#0b84f3'
const MUTED = '#9aa09c'

/** Colour of a pin in the current mode: status for how full, ink for valet, blue for chargers, grey when not offered. */
export function factHex(fact: PinFact | undefined, snap: Snapshot): string {
  if (!fact) return STATUS[snap.status].hex
  switch (fact.kind) {
    case 'pct':
      return STATUS[snap.status].hex
    case 'price':
      return fact.worth ? STATUS[snap.status].hex : STATUS.lega.hex
    case 'wait':
      return INK
    case 'chargers':
      return fact.free === 0 ? STATUS.penuh.hex : EV
    case 'none':
      return MUTED
  }
}
