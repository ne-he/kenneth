import { MapPin } from '@phosphor-icons/react'
import clsx from 'clsx'
import { lazy, Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { offers, pinFact, type PinFact } from '../../engine/modes'
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
import { fitPoints, flyTo, glideTo } from '../map/mapApi'
import { DriveHud, NavBanner } from '../nav/NavOverlay'
import { DockSheet, type Snap } from './DockSheet'
import { LiveStrip } from './LiveStrip'
import { ModeMenu } from './ModeMenu'
import { MapButtons, TopBar } from './TopBar'
import { VenueDetail, VenueDetailHeader } from './VenueDetail'
import { VenueCarousel } from './VenueCarousel'
import { VenueList } from './VenueList'

const MapView = lazy(() => import('../map/MapView').then((m) => ({ default: m.MapView })))

// First view: the three Kemanggisan campuses and the malls within walking distance of Tanjung Duren.
const INITIAL_BOUNDS = [BINUS_ANGGREK, ...VENUES.filter((v) => haversineKm(BINUS_ANGGREK, v.coords) < 3.3).map((v) => v.coords)]

const FILTERS: VenueFilter[] = ['all', 'fav', 'kampus', 'mall']

/**
 * The Parkir tab. One template for every mode: a big map, search and the mode
 * dropdown on top, one sheet at the bottom. The mode changes what the pins say
 * and which button the place card leads with, never the layout.
 */
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
  const mode = useUi((s) => s.mode)
  const setMode = useUi((s) => s.setMode)
  const homeTick = useUi((s) => s.homeTick)
  const favorites = useApp((s) => s.favorites)
  const plan = useApp((s) => s.plan)
  const kind = useVehicle().kind
  const [snap, setSnap] = useState<Snap>('half')
  const [menu, setMenu] = useState(false)
  // Home is map first: the list stays hidden until asked for, cards ride over the map.
  const [listOpen, setListOpen] = useState(false)
  const [focused, setFocused] = useState<VenueId | null>(null)

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

  // Opening a venue (or coming back to it after driving) resets the sheet and flies the camera there.
  const focus = selected && !route ? selected : null
  const [lastFocus, setLastFocus] = useState(focus)
  if (focus !== lastFocus) {
    setLastFocus(focus)
    if (focus) {
      setSnap('half')
      setListOpen(false)
    }
  }
  useEffect(() => {
    if (focus) flyTo(VENUE_BY_ID[focus].coords)
  }, [focus])

  // The card in view on the home row: the camera glides to it, with the row's own height as padding.
  useEffect(() => {
    if (focused && !selected && !route) glideTo(VENUE_BY_ID[focused].coords, 236)
  }, [focused, selected, route])
  // The row always starts on the best option.
  const first = shown[0]?.venue.id ?? null
  useEffect(() => {
    if (!focused || !shown.some((r) => r.venue.id === focused)) setFocused(first)
  }, [first, focused, shown])

  // A new filter frames what it shows. The first render keeps the opening view.
  const framed = useRef(filter)
  useEffect(() => {
    if (framed.current === filter) return
    framed.current = filter
    if (useUi.getState().selected || byFilter.length === 0) return
    fitPoints(filter === 'all' ? INITIAL_BOUNDS : byFilter.map((r) => r.venue.coords))
  }, [filter, byFilter])

  // Tapping the K while already home: back to the overview around where you are.
  const home = useRef(homeTick)
  useEffect(() => {
    if (home.current === homeTick) return
    home.current = homeTick
    setSnap('half')
    setListOpen(false)
    fitPoints([origin, ...INITIAL_BOUNDS.slice(1)])
  }, [homeTick, origin])

  const back = () => {
    select(null)
    setSnap('half')
    fitPoints([origin, ...INITIAL_BOUNDS.slice(1)], 236)
  }

  const showSheet = !!route || !!current || listOpen

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
    header = (
      <div className="pb-3">
        <LiveStrip />
        <div className="px-5 pb-3">
          <h1 className="truncate text-[21px] leading-tight font-semibold tracking-tight">{t.modes.listTitle[mode]}</h1>
          <div className="mt-0.5 flex items-center justify-between gap-3 text-[13px] text-ink-3">
            <p className="min-w-0 truncate">{t.modes.count[mode](shown.length)}</p>
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
              <MapPin size={12} weight="fill" />
              {originLabel === 'gps' ? t.explore.fromGps : t.explore.fromBinus}
            </span>
          </div>
        </div>
        {/* The selected filter is the one ink pill in the row, the rest are plain words. */}
        <div className="no-scrollbar flex gap-0.5 overflow-x-auto px-5" role="radiogroup" aria-label={t.modes.listTitle[mode]}>
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
                'h-8 shrink-0 rounded-full px-3.5 text-[13.5px] font-medium transition-colors',
                filter === f ? 'bg-ink text-canvas' : 'text-ink-3 hover:text-ink',
              )}
            >
              {t.explore.filters[f]}
            </button>
          ))}
        </div>
      </div>
    )
    body = <VenueList ranked={shown} facts={facts} mode={mode} ts={ts} now={now} previewing={previewing} filter={filter} />
  }

  return (
    <div className="absolute inset-0 overflow-hidden" data-map-slot>
      <Suspense fallback={<div className="absolute inset-0 bg-canvas" />}>
        <MapView
          theme={theme}
          snapshots={onMap}
          facts={facts}
          selected={selected}
          focused={selected ? null : focused}
          onSelect={(id) => {
            // On the home row a tap on a pin brings its card over, a second tap opens it.
            if (!listOpen && !selected && id && id !== focused) setFocused(id)
            else select(id)
          }}
          origin={origin}
          route={route}
          initialBounds={INITIAL_BOUNDS}
        />
      </Suspense>
      {!route && <TopBar now={now} menuOpen={menu} onMenu={() => setMenu(!menu)} />}
      <NavBanner route={route} now={now} />
      {!route && <MapButtons />}
      {/* The sheet lives above the tab bar, the map runs underneath both. */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ bottom: route ? 0 : 'var(--nav-h)' }}>
        {showSheet ? (
          <DockSheet
            snap={route ? 'peek' : snap}
            onSnap={(s) => {
              // Dragging the list all the way down hands the screen back to the map.
              if (s === 'peek' && !route && !current) setListOpen(false)
              else setSnap(s)
            }}
            peek={route ? 176 : 214}
            contentKey={route ? 'route' : (selected ?? `list-${filter}-${mode}`)}
            header={header}
          >
            {body}
          </DockSheet>
        ) : (
          <VenueCarousel
            ranked={shown}
            facts={facts}
            focused={focused}
            onFocus={setFocused}
            onList={() => {
              setSnap('half')
              setListOpen(true)
            }}
          />
        )}
      </div>
      {!route && <ModeMenu open={menu} onClose={() => setMenu(false)} />}
    </div>
  )
}
