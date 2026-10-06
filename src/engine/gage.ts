import type { Venue } from '../data/types'
import { wib } from '../lib/time'

/*
  Ganjil-genap (odd-even plate) check for Jakarta.

  Rule used here: weekdays only, 06.00 to 10.00 and 16.00 to 21.00, on the
  designated corridors, and never on a national holiday. Electric vehicles
  are exempt. The UI still phrases this as a reminder, not a legal guarantee.
*/

/**
 * National holidays (hari libur nasional) from the SKB 3 Menteri for 2026 (No. 1497/2025) and 2027
 * (No. 1205/2026), as published on setneg.go.id. The rule lifts odd-even on these days, as on weekends.
 * Cuti bersama is not a national holiday, so the rule still applies then. Add a year when its SKB is out.
 */
const NATIONAL_HOLIDAYS = new Set([
  // 2026
  '2026-01-01', '2026-01-16', '2026-02-17', '2026-03-19', '2026-03-21', '2026-03-22', '2026-04-03', '2026-04-05',
  '2026-05-01', '2026-05-14', '2026-05-27', '2026-05-31', '2026-06-01', '2026-06-16', '2026-08-17', '2026-08-25',
  '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-05', '2027-02-06', '2027-03-08', '2027-03-10', '2027-03-11', '2027-03-26', '2027-03-28',
  '2027-05-01', '2027-05-06', '2027-05-17', '2027-05-20', '2027-06-01', '2027-06-06', '2027-08-15', '2027-08-17',
  '2027-12-25', '2027-12-26',
])

const pad = (n: number) => String(n).padStart(2, '0')

/** True on a national holiday, read in WIB. */
export function isNationalHoliday(ts: number): boolean {
  const { year, month, date } = wib(ts)
  return NATIONAL_HOLIDAYS.has(`${year}-${pad(month + 1)}-${pad(date)}`)
}

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
  | { kind: 'not-applicable'; reason: 'weekend' | 'holiday' | 'hours' | 'corridor' }
  | { kind: 'exempt' }
  | { kind: 'ok'; parity: Parity }
  | { kind: 'blocked'; parity: Parity }
  | { kind: 'unknown' }

export function checkGage(venue: Venue, plate: string, isEV: boolean, ts: number): GageVerdict {
  const { day } = wib(ts)
  if (!venue.gageCorridor) return { kind: 'not-applicable', reason: 'corridor' }
  if (day === 0 || day === 6) return { kind: 'not-applicable', reason: 'weekend' }
  if (isNationalHoliday(ts)) return { kind: 'not-applicable', reason: 'holiday' }
  if (!gageHoursActive(ts)) return { kind: 'not-applicable', reason: 'hours' }
  if (isEV) return { kind: 'exempt' }
  const parity = plateParity(plate)
  if (!parity) return { kind: 'unknown' }
  return parity === dateParity(ts) ? { kind: 'ok', parity } : { kind: 'blocked', parity }
}
