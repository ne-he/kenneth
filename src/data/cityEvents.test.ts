import { describe, expect, it } from 'vitest'
import { eventsToday } from './cityEvents'
import { PROMOS } from './promos'
import { VENUE_BY_ID } from './venues'
import { CITY_EVENTS } from './cityEvents'

const at = (day: string, hour: number) => Date.parse(`${day}T${String(hour).padStart(2, '0')}:00:00+07:00`)

describe('city events', () => {
  it('point at real places', () => {
    for (const e of CITY_EVENTS) for (const v of e.venues) expect(VENUE_BY_ID[v], `${e.id} ${v}`).toBeTruthy()
  })

  it('shows Car Free Day on a Sunday morning only, and busy venue events', () => {
    const sunday = eventsToday(at('2026-10-18', 8), PROMOS).map((e) => e.id)
    expect(sunday).toContain('cfd-sudirman')
    expect(sunday).toContain('cp-bazar')
    expect(eventsToday(at('2026-10-18', 12), PROMOS).map((e) => e.id)).not.toContain('cfd-sudirman')
    expect(eventsToday(at('2026-10-14', 8), PROMOS).map((e) => e.id)).not.toContain('cfd-sudirman')
  })
})
