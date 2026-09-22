import { describe, expect, it } from 'vitest'
import { nextSaturdayAt } from '../lib/time'
import type { EvBooking, PriorityPass, Visit } from '../store/app'
import { headline, splitActivity, type ActivityInput } from './activity'
import { VALET_HOLD_MIN, type ValetTicket } from './valet'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const MIN = 60_000

const empty: ActivityInput = { parked: null, passes: [], valets: [], evBookings: [], reminders: [], history: [] }

const valet = (patch: Partial<ValetTicket> = {}): ValetTicket => ({
  id: 'v1',
  venueId: 'central-park',
  lobby: 'Lobi A',
  arriveAt: SAT + 30 * MIN,
  price: 50_000,
  token: 'VLT-TEST',
  createdAt: SAT,
  status: 'active',
  ...patch,
})

const pass = (patch: Partial<PriorityPass> = {}): PriorityPass => ({
  id: 'p1',
  venueId: 'taman-anggrek',
  gateId: 'g2',
  windowStart: SAT + 60 * MIN,
  price: 20_000,
  token: 'PASS',
  createdAt: SAT,
  status: 'active',
  ...patch,
})

const ev = (patch: Partial<EvBooking> = {}): EvBooking => ({
  id: 'e1',
  venueId: 'central-park',
  start: SAT + 10 * MIN,
  durationMin: 60,
  charger: 'A1',
  createdAt: SAT,
  ...patch,
})

describe('activity', () => {
  it('puts bookings that have not started under Nanti, soonest first', () => {
    const s = splitActivity({ ...empty, valets: [valet()], passes: [pass()], evBookings: [ev()] }, SAT)
    expect(s.current).toEqual([])
    expect(s.upcoming.map((u) => u.kind)).toEqual(['ev', 'valet', 'pass'])
  })

  it('moves a booking to Sekarang once it is under way, most urgent first', () => {
    const ready = valet({ id: 'ready', droppedAt: SAT - 90 * MIN, requestedAt: SAT - 15 * MIN, readyAt: SAT - MIN })
    const s = splitActivity(
      {
        ...empty,
        parked: { venueId: 'neo-soho', level: 'B2', zone: 'C', pillar: 12, lobby: 'Lobi A', at: SAT - 60 * MIN, savedMin: 5 },
        valets: [ready],
        passes: [pass({ windowStart: SAT - 5 * MIN })],
      },
      SAT,
    )
    expect(s.current.map((c) => c.kind)).toEqual(['valet', 'pass', 'parked'])
    expect(headline(s, SAT)).toEqual(s.current[0])
  })

  it('keeps cancelled and lapsed bookings in Riwayat instead of dropping them', () => {
    const s = splitActivity(
      {
        ...empty,
        valets: [valet({ id: 'gone', status: 'cancelled', closedAt: SAT + MIN }), valet({ id: 'late', arriveAt: SAT - (VALET_HOLD_MIN + 5) * MIN })],
        passes: [pass({ status: 'cancelled', cancelledAt: SAT + 2 * MIN })],
        evBookings: [ev({ cancelledAt: SAT + 3 * MIN })],
      },
      SAT + 10 * MIN,
    )
    expect(s.current).toEqual([])
    expect(s.upcoming).toEqual([])
    expect(s.past.map((p) => [p.service, p.outcome])).toEqual([
      ['ev', 'cancelled'],
      ['priority', 'cancelled'],
      ['valet', 'cancelled'],
      ['valet', 'lapsed'],
    ])
  })

  it('does not list a finished valet twice', () => {
    const visit: Visit = { id: 'h1', venueId: 'central-park', at: SAT - 3 * 60 * MIN, durationH: 3, minutesSaved: 12, via: 'valet' }
    const s = splitActivity({ ...empty, valets: [valet({ status: 'done', closedAt: SAT })], history: [visit] }, SAT)
    expect(s.past).toHaveLength(1)
    expect(s.past[0]).toMatchObject({ service: 'valet', outcome: 'done', visit })
  })

  it('only surfaces an upcoming booking on the map when it starts within the hour', () => {
    const later = splitActivity({ ...empty, passes: [pass({ windowStart: SAT + 3 * 60 * MIN })] }, SAT)
    expect(headline(later, SAT)).toBeNull()
    const soon = splitActivity({ ...empty, passes: [pass({ windowStart: SAT + 40 * MIN })] }, SAT)
    expect(headline(soon, SAT)).toMatchObject({ kind: 'pass' })
  })
})
