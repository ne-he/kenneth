import { describe, expect, it } from 'vitest'
import { atWib, clock, dayDiff, shortDate, stopwatch, wib } from './time'

// Saturday 19 September 2026, 14.07 WIB
const SAT = Date.UTC(2026, 8, 19, 7, 7)

describe('time in WIB', () => {
  it('reads wall-clock time in Jakarta, not the device zone', () => {
    const p = wib(SAT)
    expect(p.day).toBe(6)
    expect(clock(SAT)).toBe('14.07')
  })

  it('counts calendar days, not 24 hour blocks', () => {
    const lateNight = atWib(SAT, 23, 50)
    const earlyNext = atWib(SAT + 86_400_000, 0, 10)
    expect(dayDiff(lateNight, earlyNext)).toBe(1)
    expect(dayDiff(atWib(SAT, 0, 5), lateNight)).toBe(0)
    expect(dayDiff(SAT, SAT + 7 * 86_400_000)).toBe(7)
  })

  it('writes short dates the Indonesian way', () => {
    expect(shortDate(SAT, 'id')).toBe('Sab 19/9')
    expect(shortDate(SAT, 'en')).toBe('Sat 19/9')
  })

  it('formats timers with hours only when needed', () => {
    expect(stopwatch(65_000)).toBe('01:05')
    expect(stopwatch(3_725_000)).toBe('1:02:05')
    expect(stopwatch(-5)).toBe('00:00')
  })
})
