/*
  All simulation math runs on Jakarta time (WIB, UTC+7) no matter where the
  device is, so a demo opened from a laptop set to another timezone still
  shows the same Saturday afternoon queue.
*/

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export interface WibParts {
  year: number
  month: number
  date: number
  /** 0 = Sunday, 6 = Saturday */
  day: number
  hour: number
  minute: number
  /** Hour with minutes as a fraction, e.g. 14.5 for 14:30 */
  hourF: number
}

export function wib(ts: number): WibParts {
  const d = new Date(ts + WIB_OFFSET_MS)
  const hour = d.getUTCHours()
  const minute = d.getUTCMinutes()
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    day: d.getUTCDay(),
    hour,
    minute,
    hourF: hour + minute / 60 + d.getUTCSeconds() / 3600,
  }
}

/** Timestamp for a WIB wall-clock time on the same WIB day as `ts`. */
export function atWib(ts: number, hour: number, minute = 0): number {
  const p = wib(ts)
  return Date.UTC(p.year, p.month, p.date, hour, minute) - WIB_OFFSET_MS
}

/** The upcoming (or current) Saturday at the given WIB time. */
export function nextSaturdayAt(ts: number, hour: number, minute: number): number {
  const p = wib(ts)
  const daysAhead = (6 - p.day + 7) % 7
  return atWib(ts + daysAhead * 86_400_000, hour, minute)
}

export const isWeekend = (ts: number) => {
  const { day } = wib(ts)
  return day === 0 || day === 6
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 14.07 style, the Indonesian convention for clock times. */
export function clock(ts: number, sep = '.'): string {
  const { hour, minute } = wib(ts)
  return `${pad(hour)}${sep}${pad(minute)}`
}

export function hourLabel(hour: number, sep = '.'): string {
  return `${pad(hour)}${sep}00`
}

export function dayName(ts: number, lang: 'id' | 'en', short = true): string {
  const id = short
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const en = short
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return (lang === 'id' ? id : en)[wib(ts).day]
}

/** Whole WIB calendar days from `from` to `to`: 0 is the same day, 1 is tomorrow. */
export function dayDiff(from: number, to: number): number {
  const a = wib(from)
  const b = wib(to)
  return Math.round((Date.UTC(b.year, b.month, b.date) - Date.UTC(a.year, a.month, a.date)) / 86_400_000)
}

/** Sab 20/9 style date, read in WIB. */
export function shortDate(ts: number, lang: 'id' | 'en'): string {
  const p = wib(ts)
  return `${dayName(ts, lang)} ${p.date}/${p.month + 1}`
}

/** mm:ss or h:mm:ss for running timers. */
export function stopwatch(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
