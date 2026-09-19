import { MapPin } from '@phosphor-icons/react'
import clsx from 'clsx'
import { lazy, Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../../data/venues'
import { forKind } from '../../engine/occupancy'
import { rankVenues } from '../../engine/recommend'
import { useT } from '../../i18n'
import { haversineKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { fetchTravelTable } from '../../lib/routing'
import { useResolvedTheme } from '../../lib/theme'
import { useApp, useVehicle } from '../../store/app'
import { useViewTs } from '../../store/clock'
import { useUi, type VenueFilter } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'
import { DriveHud, NavBanner } from '../nav/NavOverlay'
import { DockSheet, type Snap } from './DockSheet'
import { MapButtons, TopBar } from './TopBar'
import { VenueDetail, VenueDetailHeader } from './VenueDetail'
import { VenueList } from './VenueList'

const MapView = lazy(() => import('../map/MapView').then((m) => ({ default: m.MapView })))

// First view: the three Kemanggisan campuses and the malls within walking distance of Tanjung Duren.
const INITIAL_BOUNDS = [BINUS_ANGGREK, ...VENUES.filter((v) => haversineKm(BINUS_ANGGREK, v.coords) < 3.3).map((v) => v.coords)]

const FILTERS: VenueFilter[] = ['all', 'fav', 'kampus', 'mall']

export function Explore() {
  const t = useT()
  const theme = useResolvedTheme()
  const { ts, now, previewing } = useViewTs()
  const origin = useUi((s) => s.origin)
  const originLabel = useUi((s) => s.originLabel)
  const travel = useUi((s) => s.travel)
  const setTravel = useUi((s) => s.setTravel)
  const selected = useUi((s) => s.selected)
  const select = useUi((s) => s.select)
  const route = useUi((s) => s.route)
  const filter = useUi((s) => s.filter)
  const setFilter = useUi((s) => s.setFilter)
  const favorites = useApp((s) => s.favorites)
  const kind = useVehicle().kind
  const [snap, setSnap] = useState<Snap>('half')

  // A motorbike sees motorbike bays: same places, different numbers.
  const venues = useMemo(() => VENUES.map((v) => forKind(v, kind)), [kind])
  const ranked = useMemo(() => rankVenues(venues, ts, origin, travel), [venues, ts, origin, travel])
  const shown = useMemo(
    () =>
      ranked.filter((r) =>
        filter === 'all' ? true : filter === 'fav' ? favorites.includes(r.venue.id) : r.venue.category === filter,
      ),
    [ranked, filter, favorites],
  )
  const current = ranked.find((r) => r.venue.id === selected)
  // The map follows the filter, but never hides the place you have open.
  const onMap = current && !shown.includes(current) ? [...shown, current] : shown

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

  // Opening a venue (or coming back to it after driving) resets the sheet and flies the camera there.
  const focus = selected && !route ? selected : null
  const [lastFocus, setLastFocus] = useState(focus)
  if (focus !== lastFocus) {
    setLastFocus(focus)
    if (focus) setSnap('half')
  }
  useEffect(() => {
    if (focus) flyTo(VENUE_BY_ID[focus].coords)
  }, [focus])

  // A new filter frames what it shows. The first render keeps the opening view.
  const framed = useRef(filter)
  useEffect(() => {
    if (framed.current === filter) return
    framed.current = filter
    if (useUi.getState().selected || shown.length === 0) return
    fitPoints(filter === 'all' ? INITIAL_BOUNDS : shown.map((r) => r.venue.coords))
  }, [filter, shown])

  const back = () => {
    select(null)
    setSnap('half')
    fitPoints([origin, ...INITIAL_BOUNDS.slice(1)])
  }

  let header
  let body
  if (route) {
    header = <DriveHud route={route} now={now} />
    body = null
  } else if (current) {
    header = <VenueDetailHeader venue={current.venue} snap={current} onBack={back} />
    body = <VenueDetail snap={current} ts={ts} now={now} previewing={previewing} />
  } else {
    header = (
      <div className="pb-3">
        <div className="flex items-center justify-between gap-3 px-5 pb-3">
          <div className="min-w-0">
            <h1 className="text-[20px] leading-tight font-bold tracking-tight">{t.explore.area}</h1>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-3">{t.explore.count(shown.length)}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold whitespace-nowrap text-ink-2">
            <MapPin size={13} weight="fill" className="text-signal" />
            {originLabel === 'gps' ? t.explore.fromGps : t.explore.fromBinus}
          </span>
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-5" role="radiogroup" aria-label={t.explore.area}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filter === f}
              onClick={() => {
                haptic('tap')
                setFilter(f)
              }}
              className={clsx(
                'h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-colors',
                filter === f ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2 hover:text-ink',
              )}
            >
              {t.explore.filters[f]}
            </button>
          ))}
        </div>
      </div>
    )
    body = <VenueList ranked={shown} ts={ts} now={now} previewing={previewing} filter={filter} />
  }

  return (
    <div className="absolute inset-0 overflow-hidden" data-map-slot>
      <Suspense fallback={<div className="absolute inset-0 bg-canvas" />}>
        <MapView
          theme={theme}
          snapshots={onMap}
          selected={selected}
          onSelect={select}
          origin={origin}
          route={route}
          initialBounds={INITIAL_BOUNDS}
        />
      </Suspense>
      {!route && <TopBar now={now} />}
      <NavBanner route={route} now={now} />
      {!route && <MapButtons />}
      {/* The sheet lives above the tab bar, the map runs underneath both. */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ bottom: route ? 0 : 'var(--nav-h)' }}>
        <DockSheet
          snap={route ? 'peek' : snap}
          onSnap={setSnap}
          peek={route ? 176 : 214}
          contentKey={route ? 'route' : (selected ?? `list-${filter}`)}
          header={header}
        >
          {body}
        </DockSheet>
      </div>
    </div>
  )
}
