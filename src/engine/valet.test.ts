import { describe, expect, it } from 'vitest'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { nextSaturdayAt } from '../lib/time'
import { snapshot } from './occupancy'
import { alternativesFor } from './recommend'
import { servicesFor } from './services'
import { VALET_HOLD_MIN, dropQueueMin, retrievalMin, runnerFor, valetOpen, valetPhase, type ValetTicket } from './valet'

const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const MIN = 60_000

const ticket = (patch: Partial<ValetTicket> = {}): ValetTicket => ({
  id: 't1',
  venueId: 'central-park',
  lobby: 'Lobi A',
  arriveAt: SAT,
  price: 50_000,
  token: 'VLT-TEST',
  createdAt: SAT - 30 * MIN,
  status: 'active',
  ...patch,
})

describe('valet', () => {
  it('brings the car back from the zone fast, a little slower when the mall is packed', () => {
    expect(retrievalMin(0.3)).toBe(4)
    expect(retrievalMin(0.97)).toBe(10)
    expect(retrievalMin(0.8)).toBeGreaterThan(retrievalMin(0.6))
    expect(dropQueueMin(0.95)).toBeGreaterThan(dropQueueMin(0.4))
  })

  it('walks through its phases from timestamps alone', () => {
    expect(valetPhase(ticket(), SAT - MIN)).toBe('booked')
    expect(valetPhase(ticket(), SAT + (VALET_HOLD_MIN + 1) * MIN)).toBe('lapsed')
    const dropped = ticket({ droppedAt: SAT + 5 * MIN })
    expect(valetPhase(dropped, SAT + 3 * 60 * MIN)).toBe('parked')
    const called = ticket({ droppedAt: SAT, requestedAt: SAT + 60 * MIN, readyAt: SAT + 72 * MIN })
    expect(valetPhase(called, SAT + 70 * MIN)).toBe('fetching')
    expect(valetPhase(called, SAT + 72 * MIN)).toBe('ready')
    expect(valetPhase(ticket({ status: 'done' }), SAT)).toBe('done')
  })

  it('puts the same runner on a ticket every time', () => {
    expect(runnerFor('t1')).toEqual(runnerFor('t1'))
    expect(runnerFor('t1').badge).toMatch(/^R-\d{3}$/)
  })

  it('only keeps open tickets in the active list', () => {
    expect(valetOpen(ticket(), SAT)).toBe(true)
    expect(valetOpen(ticket(), SAT + (VALET_HOLD_MIN + 1) * MIN)).toBe(false)
    expect(valetOpen(ticket({ status: 'cancelled' }), SAT)).toBe(false)
  })
})

describe('what can be booked', () => {
  it('offers the KENNETH Zone, runner valet and chargers at a big mall, to a car', () => {
    expect(servicesFor(VENUE_BY_ID['central-park'], 'mobil')).toEqual(['zone', 'valet', 'ev'])
  })

  it('sells nothing at a campus and nothing to a motorbike', () => {
    expect(servicesFor(VENUE_BY_ID['binus-anggrek'], 'mobil')).toEqual([])
    expect(servicesFor(VENUE_BY_ID['central-park'], 'motor')).toEqual([])
  })

  it('leaves out chargers where a venue has none', () => {
    expect(servicesFor(VENUE_BY_ID['slipi-jaya'], 'mobil')).not.toContain('ev')
  })
})

describe('alternatives for a full campus', () => {
  it('points to another campus or somewhere within walking distance, never a mall across town', () => {
    const tue = SAT - 4 * 86_400_000 + (10 - 14) * 60 * MIN - 7 * MIN
    const anggrek = VENUE_BY_ID['binus-anggrek']
    expect(snapshot(anggrek, tue).status).not.toBe('lega')
    const alts = alternativesFor(anggrek, VENUES, tue, 5)
    alts.forEach((a) => {
      const walkable = anggrek.walkLinks.some((l) => l.to === a.snap.venue.id)
      expect(a.snap.venue.category === 'kampus' || walkable, a.snap.venue.id).toBe(true)
    })
  })
})
