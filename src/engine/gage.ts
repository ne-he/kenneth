import type { Venue } from '../data/types'
import { wib } from '../lib/time'

/*
  Ganjil-genap (odd-even plate) check for Jakarta.

  Rule used here: weekdays only, 06.00 to 10.00 and 16.00 to 21.00, on the
  designated corridors. Electric vehicles are exempt. Public holidays are not
  modelled in the prototype, so the UI phrases this as a reminder, not a
  legal guarantee.
*/

export type Parity = 'ganjil' | 'genap'

export function plateParity(plate: string): Parity | null {
  const digits = plate.match(/\d+/)
  if (!digits) return null
  const last = Number(digits[0].slice(-1))
  return last % 2 === 0 ? 'genap' : 'ganjil'
}

export function dateParity(ts: number): Parity {
  return wib(ts).date % 2 === 0 ? 'genap' : 'ganjil'
}

export function gageHoursActive(ts: number): boolean {
  const { day, hourF } = wib(ts)
  if (day === 0 || day === 6) return false
  return (hourF >= 6 && hourF < 10) || (hourF >= 16 && hourF < 21)
}

export type GageVerdict =
  | { kind: 'not-applicable'; reason: 'weekend' | 'hours' | 'corridor' }
  | { kind: 'exempt' }
  | { kind: 'ok'; parity: Parity }
  | { kind: 'blocked'; parity: Parity }
  | { kind: 'unknown' }

export function checkGage(venue: Venue, plate: string, isEV: boolean, ts: number): GageVerdict {
  const { day } = wib(ts)
  if (!venue.gageCorridor) return { kind: 'not-applicable', reason: 'corridor' }
  if (day === 0 || day === 6) return { kind: 'not-applicable', reason: 'weekend' }
  if (!gageHoursActive(ts)) return { kind: 'not-applicable', reason: 'hours' }
  if (isEV) return { kind: 'exempt' }
  const parity = plateParity(plate)
  if (!parity) return { kind: 'unknown' }
  return parity === dateParity(ts) ? { kind: 'ok', parity } : { kind: 'blocked', parity }
}
