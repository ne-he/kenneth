import { WINDOW_MINUTES } from './pricing'

export type PassPhase = 'upcoming' | 'open' | 'expired'

/** Where a priority pass is in its life: before, during, or after its entry window. */
export function passPhase(windowStart: number, now: number): PassPhase {
  if (now < windowStart) return 'upcoming'
  if (now < windowStart + WINDOW_MINUTES * 60_000) return 'open'
  return 'expired'
}
