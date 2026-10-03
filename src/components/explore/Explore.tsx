import { lazy, Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { offers, pinFact, type PinFact } from '../../engine/modes'
import { forKind } from '../../engine/occupancy'
import { rankVenues } from '../../engine/recommend'
import { haversineKm } from '../../lib/geo'
import { fetchTravelTable } from '../../lib/routing'
import { useResolvedTheme } from '../../lib/theme'
import { useApp, useVehicle } from '../../store/app'
import { useViewTs } from '../../store/clock'
import { useUi } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'
import { DriveHud, NavBanner } from '../nav/NavOverlay'
import { DockSheet, type Snap } from './DockSheet'
import { HomeHeader, ListHeader } from './HomeSheet'
import { LiveStrip } from './LiveStrip'
import { TopBar } from './TopBar'
import { VenueDetail, VenueDetailHeader } from './VenueDetail'
import { VenueList } from './VenueList'

const MapView = lazy(() => import('../map/MapView').then((m) => ({ default: m.MapView })))

// First view: the three Kemanggisan campuses and the malls within walking distance of Tanjung Duren.
const INITIAL_BOUNDS = [BINUS_ANGGREK, ...VENUES.filter((v) => haversineKm(BINUS_ANGGREK, v.coords) < 3.3).map((v) => v.coords)]

/**
 * Beranda. The map is always the stage; one persistent sheet at the bottom
 * holds the hierarchy: search, the three services as toggles, the vehicle,
 * and the ranked list once pulled up. A picked service changes what the pins
 * say and which button the place card leads with, never the layout.
 */
export function Explore() {
  const theme = useResolvedTheme()
  const { ts, now, previewing } = useViewTs()
  const origin = useUi((s) => s.origin)
  const travel = useUi((s) => s.travel)
  const setTravel = useUi((s) => s.setTravel)
  const selected = useUi((s) => s.selected)
  const select = useUi((s) => s.select)
  const route = useUi((s) => s.route)
  const filter = useUi((s) => s.filter)
  const mode = useUi((s) => s.mode)
  const setMode = useUi((s) => s.setMode)
  const homeTick = useUi((s) => s.homeTick)
  const favorites = useApp((s) => s.favorites)
  const plan = useApp((s) => s.plan)
  const kind = useVehicle().kind
  const [snap, setSnap] = useState<Snap>('peek')
  // The home sheet at rest, measured by the sheet: the camera keeps the map above it.
  const [homePeek, setHomePeek] = useState(280)

  // A motorbike only parks. Switching to one (from anywhere) drops back to the parking mode.
  useEffect(() => {
    if (kind === 'motor' && mode !== 'park') setMode('park')
  }, [kind, mode, setMode])

  // A motorbike sees motorbike bays: same places, different numbers.
  const venues = useMemo(() => VENUES.map((v) => forKind(v, kind)), [kind])
  const ranked = useMemo(() => rankVenues(venues, ts, origin, travel), [venues, ts, origin, travel])
  const facts = useMemo(
    () => new Map<VenueId, PinFact>(ranked.map((r) => [r.venue.id, pinFact(r, mode, kind, plan, ts)])),
    [ranked, mode, kind, plan, ts],
  )
  // The map keeps every place of the filter (greyed when it lacks the mode), the list only the ones that offer it.
  const byFilter = useMemo(
    () =>
      ranked.filter((r) =>
        filter === 'all' ? true : filter === 'fav' ? favorites.includes(r.venue.id) : r.venue.category === filter,
      ),
    [ranked, filter, favorites],
  )
  const shown = useMemo(() => byFilter.filter((r) => offers(r.venue, kind, mode)), [byFilter, kind, mode])
  const current = ranked.find((r) => r.venue.id === selected)
  // Never hide the place you have open.
  const onMap = useMemo(() => (current && !byFilter.includes(current) ? [...byFilter, current] : byFilter), [current, byFilter])

  // Real road distances once per origin, not on every clock tick. The list works on estimates until then.
  const trafficAt = useEffectEvent(() => now)
  useEffect(() => {
    let alive = true
    fetchTravelTable(origin, VENUES, trafficAt())
      .then((table) => alive && setTravel(table))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [origin, setTravel])

  // Opening a venue (or coming back to it after driving) lifts the sheet and flies the camera there.
  // Closing it rests the home sheet again.
  const focus = selected && !route ? selected : null
  const [lastFocus, setLastFocus] = useState(focus)
  if (focus !== lastFocus) {
    setLastFocus(focus)
    setSnap(focus ? 'half' : 'peek')
  }
  useEffect(() => {
    if (focus) flyTo(VENUE_BY_ID[focus].coords)
  }, [focus])

  // The overview around where you are, framed above the resting home sheet.
  const fitHome = () => fitPoints([origin, ...INITIAL_BOUNDS.slice(1)], homePeek + 24)
  const refitHome = useEffectEvent(fitHome)

  // A new filter frames what it shows. The first render keeps the opening view.
  const framed = useRef(filter)
  useEffect(() => {
    if (framed.current === filter) return
    framed.current = filter
    if (useUi.getState().selected || byFilter.length === 0) return
    fitPoints(filter === 'all' ? INITIAL_BOUNDS : byFilter.map((r) => r.venue.coords))
  }, [filter, byFilter])

  // Tapping Beranda while already home: the sheet rests and the map goes back to the overview.
  const home = useRef(homeTick)
  useEffect(() => {
    if (home.current === homeTick) return
    home.current = homeTick
    setSnap('peek')
    refitHome()
  }, [homeTick])

  const back = () => {
    select(null)
    fitHome()
  }

  let header
  let body
  if (route) {
    header = <DriveHud route={route} now={now} />
    body = null
  } else if (current) {
    header = (
      <>
        <LiveStrip />
        <VenueDetailHeader venue={current.venue} snap={current} onBack={back} />
      </>
    )
    body = <VenueDetail snap={current} ts={ts} now={now} previewing={previewing} />
  } else {
    header = <HomeHeader />
    body = (
      <>
        <ListHeader mode={mode} count={shown.length} />
        <VenueList ranked={shown} facts={facts} mode={mode} ts={ts} now={now} previewing={previewing} filter={filter} />
      </>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden" data-map-slot>
      <Suspense fallback={<div className="absolute inset-0 bg-canvas" />}>
        <MapView
          theme={theme}
          snapshots={onMap}
          facts={facts}
          selected={selected}
          onSelect={select}
          origin={origin}
          route={route}
          initialBounds={INITIAL_BOUNDS}
        />
      </Suspense>
      {!route && <TopBar now={now} />}
      <NavBanner route={route} now={now} />
      {/* The sheet runs down to the screen edge under the floating dock, so no map shows between the two. */}
      <div className="pointer-events-none absolute inset-0">
        <DockSheet
          snap={route ? 'peek' : snap}
          onSnap={setSnap}
          peek={route ? 176 : current ? 214 : undefined}
          onPeek={route || current ? undefined : setHomePeek}
          contentKey={route ? 'route' : (selected ?? `list-${filter}-${mode}`)}
          header={header}
          inset={route ? undefined : 'var(--nav-h)'}
        >
          {body}
        </DockSheet>
      </div>
    </div>
  )
}
