import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BINUS_ANGGREK, VENUE_BY_ID } from '../data/venues'
import { travelTo } from '../engine/recommend'
import { estimateDrive } from './geo'
import { fetchRoute, fetchTravelTable, trafficFactor } from './routing'
import { atWib, nextSaturdayAt } from './time'

const DAY = 86_400_000
// Saturday 14.07 WIB, and the Tuesday before it.
const SAT = nextSaturdayAt(Date.UTC(2026, 8, 14), 14, 7)
const TUE = SAT - 4 * DAY
const cp = VENUE_BY_ID['central-park']
const neo = VENUE_BY_ID['neo-soho']

const reply = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  // routing.ts sets its timeout on window, which the node test runner does not have.
  vi.stubGlobal('window', globalThis)
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('traffic factor', () => {
  it('stretches weekend trips from 11.00 to 21.00', () => {
    expect(trafficFactor(atWib(SAT, 10, 59))).toBe(1.4)
    expect(trafficFactor(atWib(SAT, 11, 0))).toBe(2.1)
    expect(trafficFactor(atWib(SAT, 20, 59))).toBe(2.1)
    expect(trafficFactor(atWib(SAT, 21, 0))).toBe(1.4)
    expect(trafficFactor(atWib(SAT + DAY, 14, 0))).toBe(2.1)
  })

  it('stretches weekday trips most in the two rush hours', () => {
    expect(trafficFactor(atWib(TUE, 6, 29))).toBe(1.6)
    expect(trafficFactor(atWib(TUE, 6, 30))).toBe(2.4)
    expect(trafficFactor(atWib(TUE, 9, 29))).toBe(2.4)
    expect(trafficFactor(atWib(TUE, 9, 30))).toBe(1.6)
    expect(trafficFactor(atWib(TUE, 16, 30))).toBe(2.4)
    expect(trafficFactor(atWib(TUE, 19, 59))).toBe(2.4)
    expect(trafficFactor(atWib(TUE, 20, 0))).toBe(1.6)
  })

  it('reads the day in WIB: Friday 17.00 UTC is already Saturday in Jakarta', () => {
    expect(trafficFactor(Date.UTC(2026, 8, 18, 16, 59))).toBe(1.6)
    expect(trafficFactor(Date.UTC(2026, 8, 18, 17, 0))).toBe(1.4)
  })
})

describe('route to a gate', () => {
  const gate = cp.gates[2].coords

  it('uses the OSRM road and stretches its free-flow time for traffic', async () => {
    const line: [number, number][] = [BINUS_ANGGREK, [106.785, -6.19], gate]
    fetchMock.mockReturnValue(reply({ code: 'Ok', routes: [{ distance: 4200, duration: 600, geometry: { coordinates: line } }] }))
    const r = await fetchRoute(BINUS_ANGGREK, gate, SAT)
    expect(r).toEqual({ coords: line, km: 4.2, minutes: 10 * 2.1, source: 'road' })
    // Longitude first, the order OSRM expects.
    expect(fetchMock.mock.calls[0][0]).toContain('/route/v1/driving/106.78117,-6.20194;106.79058,-6.17702?')
  })

  it.each([
    ['the network fails', () => Promise.reject(new TypeError('offline'))],
    ['the server errors', () => reply({ message: 'busy' }, 502)],
    ['OSRM finds no route', () => reply({ code: 'NoRoute', routes: [] })],
  ])('falls back to a bent estimate line when %s', async (_, answer) => {
    fetchMock.mockImplementation(answer)
    const r = await fetchRoute(BINUS_ANGGREK, gate, SAT)
    const est = estimateDrive(BINUS_ANGGREK, gate)
    expect(r.source).toBe('estimate')
    expect(r.km).toBe(est.km)
    expect(r.minutes).toBe(est.minutes)
    expect(r.coords).toHaveLength(3)
    expect(r.coords[0]).toEqual(BINUS_ANGGREK)
    expect(r.coords[2]).toEqual(gate)
  })

  it('gives up on a slow server after 6 seconds', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal!.addEventListener('abort', () => reject(new Error('aborted')))),
    )
    let done = false
    const pending = fetchRoute(BINUS_ANGGREK, gate, SAT).finally(() => (done = true))
    await vi.advanceTimersByTimeAsync(5_900)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(100)
    expect((await pending).source).toBe('estimate')
  })
})

describe('travel table', () => {
  it('turns one OSRM table into road times per venue, stretched for traffic', async () => {
    fetchMock.mockReturnValue(reply({ code: 'Ok', durations: [[0, 600, 300]], distances: [[0, 4200, 2100]] }))
    const table = await fetchTravelTable(BINUS_ANGGREK, [cp, neo], SAT)
    expect(table).toEqual({
      'central-park': { km: 4.2, minutes: 10 * 2.1, source: 'road' },
      'neo-soho': { km: 2.1, minutes: 5 * 2.1, source: 'road' },
    })
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain(`/table/v1/driving/106.78117,-6.20194;${cp.coords.map((n) => n.toFixed(5)).join(',')};`)
    expect(url).toContain('sources=0')
  })

  it('leaves out a venue OSRM cannot reach, so that one keeps the estimate', async () => {
    fetchMock.mockReturnValue(reply({ code: 'Ok', durations: [[0, null, 300]], distances: [[0, null, 2100]] }))
    const table = await fetchTravelTable(BINUS_ANGGREK, [cp, neo], SAT)
    expect(table['central-park']).toBeUndefined()
    expect(travelTo(cp, BINUS_ANGGREK, table).source).toBe('estimate')
    expect(travelTo(neo, BINUS_ANGGREK, table).source).toBe('road')
  })

  it('rejects when OSRM says no or cannot be reached, so the list keeps its estimates', async () => {
    fetchMock.mockReturnValue(reply({ code: 'InvalidQuery' }))
    await expect(fetchTravelTable(BINUS_ANGGREK, [cp], SAT)).rejects.toThrow('InvalidQuery')
    fetchMock.mockReturnValue(Promise.reject(new TypeError('offline')))
    await expect(fetchTravelTable(BINUS_ANGGREK, [cp], SAT)).rejects.toThrow('offline')
  })
})
