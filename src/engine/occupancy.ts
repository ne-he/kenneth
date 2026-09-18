import type { Gate, OccupancyStatus, Venue } from '../data/types'
import { atWib, wib } from '../lib/time'

/*
  Occupancy model for the prototype.

  Real product: occupancy = cars in minus cars out, read from the barrier
  system every few minutes. Prototype: a deterministic curve per day type,
  scaled per venue, plus a slow "breathing" term so the numbers move while
  someone is looking at the screen. Same inputs always give the same output,
  which keeps demos repeatable and tests stable.
*/

// Share of capacity in use for each WIB hour, 0..23.
const WEEKEND = [
  0.06, 0.05, 0.04, 0.04, 0.04, 0.05, 0.06, 0.08, 0.12, 0.2, 0.34, 0.54, 0.74, 0.87, 0.95, 0.97,
  0.9, 0.76, 0.84, 0.9, 0.82, 0.6, 0.3, 0.12,
]
const WEEKDAY = [
  0.05, 0.04, 0.04, 0.04, 0.04, 0.05, 0.07, 0.1, 0.14, 0.18, 0.26, 0.38, 0.55, 0.56, 0.46, 0.44,
  0.5, 0.6, 0.72, 0.75, 0.64, 0.44, 0.2, 0.08,
]
const FRIDAY = WEEKDAY.map((v, h) => (h >= 17 ? Math.min(0.97, v * 1.18) : v))

const FLOOR = 0.04

export const OPEN_HOUR = 10
export const CLOSE_HOUR = 22

export const THRESHOLD = { ramai: 0.7, penuh: 0.9 } as const

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function curveFor(day: number) {
  if (day === 0 || day === 6) return WEEKEND
  if (day === 5) return FRIDAY
  return WEEKDAY
}

/** Cosine interpolation between hourly points, smooth enough for a chart. */
function sampleCurve(curve: number[], hourF: number) {
  const h = ((hourF % 24) + 24) % 24
  const i = Math.floor(h)
  const t = h - i
  const a = curve[i]
  const b = curve[(i + 1) % 24]
  const w = (1 - Math.cos(t * Math.PI)) / 2
  return a * (1 - w) + b * w
}

function seedOf(id: string) {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 9973
  return s / 9973
}

/** Small, slow, deterministic movement so live numbers never look frozen. */
function breathing(id: string, ts: number) {
  const minutes = ts / 60_000
  const seed = seedOf(id) * Math.PI * 2
  return (
    0.011 * Math.sin((minutes / 17) * Math.PI * 2 + seed) +
    0.007 * Math.sin((minutes / 43) * Math.PI * 2 + seed * 2.3)
  )
}

/** Fraction of capacity in use, 0..1. */
export function occupancyAt(venue: Venue, ts: number): number {
  const shifted = ts - venue.shiftMin * 60_000
  const p = wib(shifted)
  const base = sampleCurve(curveFor(p.day), p.hourF)
  const crowd = FLOOR + (base - FLOOR) * venue.load
  const open = p.hourF >= OPEN_HOUR - 1 && p.hourF <= CLOSE_HOUR + 0.5
  const noise = open ? breathing(venue.id, ts) * Math.min(1, venue.load) : 0
  return clamp(crowd + noise, 0.02, 0.995)
}

export function statusOf(occ: number): OccupancyStatus {
  if (occ >= THRESHOLD.penuh) return 'penuh'
  if (occ >= THRESHOLD.ramai) return 'ramai'
  return 'lega'
}

export const freeSlots = (venue: Venue, occ: number) => Math.max(0, Math.round(venue.capacity * (1 - occ)))

/**
 * Minutes waiting at an average gate. Flat while arrivals are absorbed,
 * then grows quickly once exits stop keeping up with entries.
 */
export function baseQueueMin(occ: number): number {
  if (occ < 0.8) return occ * 1.2
  const x = (occ - 0.8) / 0.2
  return 0.96 + x * x * 16
}

export const gateQueueMin = (gate: Gate, occ: number) => baseQueueMin(occ) * gate.pull

/** Minutes spent circling inside for a free bay once past the gate. */
export function cruiseMin(occ: number): number {
  if (occ < 0.85) return 0
  const x = (occ - 0.85) / 0.15
  return x * x * 10
}

/** The gate most drivers default to (highest pull). */
export const defaultGate = (venue: Venue) =>
  venue.gates.reduce((a, b) => (b.pull > a.pull ? b : a))

export function bestGate(venue: Venue, occ: number) {
  return venue.gates.reduce((a, b) => (gateQueueMin(b, occ) < gateQueueMin(a, occ) ? b : a))
}

export interface Snapshot {
  venue: Venue
  occ: number
  pct: number
  status: OccupancyStatus
  free: number
  /** Queue at the default gate, what a driver without the app would face. */
  queueMin: number
  bestGate: Gate
  bestGateQueueMin: number
  cruiseMin: number
  gates: { gate: Gate; queueMin: number }[]
}

export function snapshot(venue: Venue, ts: number): Snapshot {
  const occ = occupancyAt(venue, ts)
  const best = bestGate(venue, occ)
  return {
    venue,
    occ,
    pct: Math.round(occ * 100),
    status: statusOf(occ),
    free: freeSlots(venue, occ),
    queueMin: gateQueueMin(defaultGate(venue), occ),
    bestGate: best,
    bestGateQueueMin: gateQueueMin(best, occ),
    cruiseMin: cruiseMin(occ),
    gates: venue.gates
      .map((gate) => ({ gate, queueMin: gateQueueMin(gate, occ) }))
      .sort((a, b) => a.queueMin - b.queueMin),
  }
}

export interface ForecastPoint {
  hour: number
  ts: number
  occ: number
  status: OccupancyStatus
  queueMin: number
}

/** Hourly forecast for the WIB day of `ts`, opening to closing. */
export function forecastDay(venue: Venue, ts: number): ForecastPoint[] {
  const out: ForecastPoint[] = []
  for (let hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
    const at = atWib(ts, hour, 0)
    const occ = occupancyAt(venue, at)
    out.push({ hour, ts: at, occ, status: statusOf(occ), queueMin: gateQueueMin(defaultGate(venue), occ) })
  }
  return out
}

/**
 * First moment after `ts` (same day, before closing) when the default gate
 * queue drops to 3 minutes or less. Null when it does not happen today.
 */
export function nextRelief(venue: Venue, ts: number): number | null {
  const now = snapshot(venue, ts)
  if (now.queueMin <= 3 && now.status !== 'penuh') return null
  const close = atWib(ts, CLOSE_HOUR, 0)
  for (let t = ts + 15 * 60_000; t <= close; t += 15 * 60_000) {
    const occ = occupancyAt(venue, t)
    if (gateQueueMin(defaultGate(venue), occ) <= 3 && statusOf(occ) !== 'penuh') {
      // Round down to the quarter hour so the copy reads naturally.
      return t - (t % (15 * 60_000))
    }
  }
  return null
}

/** Quietest hour of the day, used for the personal pattern insight. */
export function quietestHour(venue: Venue, ts: number, fromHour = 11, toHour = 20) {
  return forecastDay(venue, ts)
    .filter((p) => p.hour >= fromHour && p.hour <= toHour)
    .reduce((a, b) => (b.queueMin < a.queueMin ? b : a))
}

/**
 * Free reserved bays (disability, pregnancy, EV). They fill slower than
 * normal bays but still follow the crowd. Deterministic per hour.
 */
export function reservedFree(total: number, occ: number, salt: string, ts: number): number {
  if (total === 0) return 0
  const hour = Math.floor(ts / 3_600_000)
  const jitter = ((seedOf(salt) * 97 + hour) % 3) - 1
  const share = Math.min(1, Math.max(0, (1 - occ) * 1.7))
  return Math.min(total, Math.max(0, Math.round(total * share) + jitter))
}
