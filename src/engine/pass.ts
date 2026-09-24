import { ZONE_HOLD_MIN } from './zone'

export type PassPhase = 'upcoming' | 'open' | 'expired'

/** Where a zone booking is: before the arrival time, bay held and waiting, or over. */
export function passPhase(arriveAt: number, now: number): PassPhase {
  if (now < arriveAt) return 'upcoming'
  if (now < arriveAt + ZONE_HOLD_MIN * 60_000) return 'open'
  return 'expired'
}
