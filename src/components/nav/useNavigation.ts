import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { fetchRoute } from '../../lib/routing'
import { simNowOf, useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'

/** Start and stop in-app navigation to the quietest gate of a venue. */
export function useNavigation() {
  const t = useT()

  const start = async (venueId: VenueId, gateId?: string) => {
    const venue = VENUE_BY_ID[venueId]
    const now = simNowOf(useApp.getState().clock)
    const snap = snapshot(venue, now)
    const gate = venue.gates.find((g) => g.id === gateId) ?? snap.bestGate
    const { origin, notify, setRoute, select } = useUi.getState()
    haptic('success')
    const r = await fetchRoute(origin, gate.coords, now)
    select(venueId)
    setRoute({ venueId, gateId: gate.id, ...r, startedAt: now })
    fitPoints(r.coords, 200, 16)
    notify(t.nav.started)
  }

  const stop = () => {
    const { route, setRoute, notify } = useUi.getState()
    setRoute(null)
    if (route) flyTo(VENUE_BY_ID[route.venueId].coords, 360, 15.8)
    notify(t.nav.ended)
  }

  return { start, stop }
}
