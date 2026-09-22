import type { VenueId } from '../data/types'
import type { EvBooking, ParkedSpot, PriorityPass, Reminder, Visit } from '../store/app'
import { passPhase } from './pass'
import { valetPhase, VALET_HOLD_MIN, type ValetTicket } from './valet'

/*
  The Aktivitas tab in three buckets. Sekarang is whatever needs the user
  today and is already under way, Nanti is booked but not started, Riwayat is
  everything that is over, including what was cancelled or lapsed, so a
  cancelled booking never just disappears.
*/

export type Current =
  | { kind: 'parked'; at: number }
  | { kind: 'valet'; id: string; at: number }
  | { kind: 'pass'; id: string; at: number }
  | { kind: 'ev'; id: string; at: number }

export type Upcoming =
  | { kind: 'valet'; id: string; at: number }
  | { kind: 'pass'; id: string; at: number }
  | { kind: 'ev'; id: string; at: number }
  | { kind: 'reminder'; id: string; at: number }

export type PastKind = 'park' | 'valet' | 'priority' | 'ev'
export type Outcome = 'done' | 'cancelled' | 'lapsed'

export interface Past {
  key: string
  service: PastKind
  outcome: Outcome
  venueId: VenueId
  at: number
  visit?: Visit
}

export interface ActivityInput {
  parked: ParkedSpot | null
  passes: PriorityPass[]
  valets: ValetTicket[]
  evBookings: EvBooking[]
  reminders: Reminder[]
  history: Visit[]
}

export interface Split {
  current: Current[]
  upcoming: Upcoming[]
  past: Past[]
}

// Lower comes first: a car waiting at the lobby beats a parked car nobody is looking for.
const URGENCY: Record<string, number> = {
  'valet:ready': 0,
  'valet:fetching': 1,
  'pass:open': 2,
  'valet:booked': 3,
  parked: 4,
  'valet:parked': 5,
  ev: 6,
}

export function splitActivity(s: ActivityInput, now: number): Split {
  const current: { rank: number; item: Current }[] = []
  const upcoming: Upcoming[] = []
  const past: Past[] = []

  if (s.parked) current.push({ rank: URGENCY.parked, item: { kind: 'parked', at: s.parked.at } })

  for (const v of s.valets) {
    const phase = valetPhase(v, now)
    if (phase === 'booked') {
      // Booked for later is Nanti. Once the arrival time comes it moves up and waits for the user.
      if (v.arriveAt > now) upcoming.push({ kind: 'valet', id: v.id, at: v.arriveAt })
      else current.push({ rank: URGENCY['valet:booked'], item: { kind: 'valet', id: v.id, at: v.arriveAt } })
    } else if (phase === 'parked' || phase === 'fetching' || phase === 'ready') {
      current.push({ rank: URGENCY[`valet:${phase}`], item: { kind: 'valet', id: v.id, at: v.droppedAt ?? v.arriveAt } })
    } else if (phase === 'cancelled') {
      past.push({ key: `v:${v.id}`, service: 'valet', outcome: 'cancelled', venueId: v.venueId, at: v.closedAt ?? v.createdAt })
    } else if (phase === 'lapsed') {
      past.push({
        key: `v:${v.id}`,
        service: 'valet',
        outcome: 'lapsed',
        venueId: v.venueId,
        at: v.arriveAt + VALET_HOLD_MIN * 60_000,
      })
    }
    // Done valets already left a Visit in history, listing them again would double count.
  }

  for (const p of s.passes) {
    if (p.status === 'cancelled') {
      past.push({ key: `p:${p.id}`, service: 'priority', outcome: 'cancelled', venueId: p.venueId, at: p.cancelledAt ?? p.createdAt })
      continue
    }
    const phase = passPhase(p.windowStart, now)
    if (phase === 'open') current.push({ rank: URGENCY['pass:open'], item: { kind: 'pass', id: p.id, at: p.windowStart } })
    else if (phase === 'upcoming') upcoming.push({ kind: 'pass', id: p.id, at: p.windowStart })
    else past.push({ key: `p:${p.id}`, service: 'priority', outcome: 'done', venueId: p.venueId, at: p.windowStart })
  }

  for (const b of s.evBookings) {
    const end = b.start + b.durationMin * 60_000
    if (b.cancelledAt) past.push({ key: `e:${b.id}`, service: 'ev', outcome: 'cancelled', venueId: b.venueId, at: b.cancelledAt })
    else if (now >= end) past.push({ key: `e:${b.id}`, service: 'ev', outcome: 'done', venueId: b.venueId, at: b.start })
    else if (now >= b.start) current.push({ rank: URGENCY.ev, item: { kind: 'ev', id: b.id, at: b.start } })
    else upcoming.push({ kind: 'ev', id: b.id, at: b.start })
  }

  for (const r of s.reminders) upcoming.push({ kind: 'reminder', id: r.id, at: r.at })

  for (const v of s.history) {
    past.push({ key: `h:${v.id}`, service: v.via === 'valet' ? 'valet' : 'park', outcome: 'done', venueId: v.venueId, at: v.at, visit: v })
  }

  return {
    current: current.sort((a, b) => a.rank - b.rank || a.item.at - b.item.at).map((c) => c.item),
    upcoming: upcoming.sort((a, b) => a.at - b.at),
    // Newest first.
    past: past.sort((a, b) => b.at - a.at),
  }
}

/** The one thing worth a line on the map screen, if any: the most urgent current item, or a pass starting within the hour. */
export function headline(split: Split, now: number): Current | Upcoming | null {
  if (split.current.length > 0) return split.current[0]
  const soon = split.upcoming.find((u) => u.kind !== 'reminder' && u.at - now <= 60 * 60_000)
  return soon ?? null
}
