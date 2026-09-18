import { MapPin } from '@phosphor-icons/react'
import { lazy, Suspense, useEffect, useEffectEvent, useMemo, useState } from 'react'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../../data/venues'
import { rankVenues } from '../../engine/recommend'
import { useT } from '../../i18n'
import { fetchTravelTable } from '../../lib/routing'
import { useResolvedTheme } from '../../lib/theme'
import { useViewTs } from '../../store/clock'
import { useUi } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'
import { DriveHud, NavBanner } from '../nav/NavOverlay'
import { TabBar } from '../shell/TabBar'
import { DockSheet, type Snap } from './DockSheet'
import { TimeScrubber } from './TimeScrubber'
import { MapButtons, TopBar } from './TopBar'
import { VenueDetail, VenueDetailHeader } from './VenueDetail'
import { VenueList } from './VenueList'

const MapView = lazy(() => import('../map/MapView').then((m) => ({ default: m.MapView })))

// First view: the pilot cluster around BINUS, Grand Indonesia sits just off to the east.
const INITIAL_BOUNDS = [BINUS_ANGGREK, ...VENUES.filter((v) => v.area === 'Jakarta Barat').map((v) => v.coords)]

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
  const [snap, setSnap] = useState<Snap>('half')

  const ranked = useMemo(() => rankVenues(VENUES, ts, origin, travel), [ts, origin, travel])
  const current = ranked.find((r) => r.venue.id === selected)

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
        <div className="flex items-end justify-between px-5 pb-3">
          <div>
            <h1 className="text-[22px] leading-none font-extrabold tracking-tight">{t.explore.area}</h1>
            <p className="mt-1.5 text-[12px] text-ink-3">{t.explore.count(VENUES.length)}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-signal/10 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-signal dark:text-[#7fa6ff]">
            <MapPin size={12} weight="fill" />
            {originLabel === 'gps' ? t.explore.fromGps : t.explore.fromBinus}
          </span>
        </div>
        <TimeScrubber venues={VENUES} now={now} />
      </div>
    )
    body = <VenueList ranked={ranked} ts={ts} previewing={previewing} />
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Suspense fallback={<div className="absolute inset-0 bg-canvas" />}>
        <MapView
          theme={theme}
          snapshots={ranked}
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
      <DockSheet
        snap={route ? 'peek' : snap}
        onSnap={setSnap}
        peek={route ? 176 : 150}
        contentKey={route ? 'route' : (selected ?? 'list')}
        header={header}
        footer={route ? undefined : <TabBar variant="sunken" />}
      >
        {body}
      </DockSheet>
    </div>
  )
}
