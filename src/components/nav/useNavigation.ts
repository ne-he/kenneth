import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { forKind, snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { NAV_APP_NAME, externalNavUrl } from '../../lib/navApps'
import { fetchRoute } from '../../lib/routing'
import { activeVehicleOf, simNowOf, useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'

/**
 * Start and stop navigation to the quietest gate of a venue. With Google Maps
 * or Waze picked in Akun, the gate goes to that app instead and KENNETH stays
 * on the venue, ready for "Parkir" when the user arrives.
 */
export function useNavigation() {
  const t = useT()

  const start = async (venueId: VenueId, gateId?: string) => {
    // Same numbers as the card that offered the route, so a motorbike gets the motorbike's quietest gate.
    const venue = forKind(VENUE_BY_ID[venueId], activeVehicleOf(useApp.getState()).kind)
    const now = simNowOf(useApp.getState().clock)
    const snap = snapshot(venue, now)
    const gate = venue.gates.find((g) => g.id === gateId) ?? snap.bestGate
    const { origin, notify, setRoute, select } = useUi.getState()
    const app = useApp.getState().mapPrefs.navApp
    haptic('success')
    if (app !== 'kenneth') {
      window.open(externalNavUrl(app, gate.coords), '_blank', 'noopener')
      select(venueId)
      notify(t.mapOptions.openedIn(NAV_APP_NAME[app], gate.name))
      return
    }
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
