import { wib } from '../lib/time'
import type { Promo } from './promos'
import type { VenueId } from './types'

/**
 * Things happening in the city that change how parking goes today. Only
 * events that really recur are written here; one-off concerts and matches
 * come from venues and merchants (busy events in the promos) instead of
 * being made up.
 */
export interface CityEvent {
  id: string
  title: { id: string; en: string }
  note: { id: string; en: string }
  days: number[]
  from: number
  to: number
  venues: VenueId[]
  /** 'closed': roads around are shut; 'busy': the car parks fill faster. */
  effect: 'closed' | 'busy'
}

export const CITY_EVENTS: CityEvent[] = [
  {
    id: 'cfd-sudirman',
    title: { id: 'Car Free Day Sudirman–Thamrin', en: 'Car Free Day on Sudirman–Thamrin' },
    note: {
      id: 'Jalan utama ditutup untuk kendaraan. Masuk lewat jalan samping, atau datang setelah 11.00.',
      en: 'The main road is closed to cars. Come in from the side streets, or after 11.00.',
    },
    days: [0],
    from: 6,
    to: 11,
    venues: ['fx-sudirman', 'grand-indonesia', 'plaza-indonesia', 'senayan-city', 'plaza-senayan'],
    effect: 'closed',
  },
]

/** Today's events that affect parking and have not ended: the city's, then busy events at single places. */
export function eventsToday(ts: number, promos: Promo[]): CityEvent[] {
  const { day, hourF } = wib(ts)
  const fromPromos: CityEvent[] = promos
    .filter((p) => p.kind === 'event' && p.busy)
    .map((p) => ({
      id: p.id,
      title: p.title,
      note: { id: `${p.merchant} · ${p.floor}`, en: `${p.merchant} · ${p.floor}` },
      days: p.days,
      from: p.from,
      to: p.to,
      venues: [p.venueId],
      effect: 'busy' as const,
    }))
  return [...CITY_EVENTS, ...fromPromos].filter((e) => e.days.includes(day) && hourF < e.to).sort((a, b) => a.from - b.from)
}
