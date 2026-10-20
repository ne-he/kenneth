import { ArrowLeft, CaretRight, NavigationArrow, X } from '@phosphor-icons/react'
import clsx from 'clsx'
import { lazy, Suspense, useEffect, useMemo } from 'react'
import { BINUS_ANGGREK, VENUE_BY_ID, VENUES } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { pinFact, type PinFact } from '../../engine/modes'
import { forKind } from '../../engine/occupancy'
import { rankVenues } from '../../engine/recommend'
import { useT } from '../../i18n'
import { haversineKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { STATUS, formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useViewTs } from '../../store/clock'
import { useUi } from '../../store/ui'
import { fitPoints, flyTo } from '../map/mapApi'
import { useNavigation } from '../nav/useNavigation'
import { LogoMark } from '../ui/Logo'

const MapView = lazy(() => import('../map/MapView').then((m) => ({ default: m.MapView })))
const INITIAL_BOUNDS = [BINUS_ANGGREK, ...VENUES.filter((v) => haversineKm(BINUS_ANGGREK, v.coords) < 3.3).map((v) => v.coords)]
const ROWS = 5

/**
 * KENNETH on a car's dashboard screen, in the manner of CarPlay: always dark,
 * big type and big targets, one decision per screen. A side bar with the
 * clock, the nearest places beside the map, one tap for the place, one more
 * for the route. Shown in the car frame of the desktop stage; a real CarPlay
 * app would need a native build.
 */
export default function CarApp() {
  const t = useT()
  const { ts, now } = useViewTs()
  const origin = useUi((s) => s.origin)
  const travel = useUi((s) => s.travel)
  const selected = useUi((s) => s.selected)
  const select = useUi((s) => s.select)
  const route = useUi((s) => s.route)
  const plan = useApp((s) => s.plan)
  const kind = useVehicle().kind
  const nav = useNavigation()

  const venues = useMemo(() => VENUES.map((v) => forKind(v, kind)), [kind])
  const ranked = useMemo(() => rankVenues(venues, ts, origin, travel), [venues, ts, origin, travel])
  const facts = useMemo(() => new Map<VenueId, PinFact>(ranked.map((r) => [r.venue.id, pinFact(r, 'park', kind, plan, ts)])), [ranked, kind, plan, ts])
  const current = ranked.find((r) => r.venue.id === selected)
  const target = route ? ranked.find((r) => r.venue.id === route.venueId) : undefined

  // The map opens on the places around you, once the screen has its size.
  useEffect(() => {
    const id = window.setTimeout(() => fitPoints([origin, ...INITIAL_BOUNDS.slice(1)], 40, 15.5, 0), 1800)
    return () => window.clearTimeout(id)
  }, [origin])

  // The map frames the place picked; the list stays in the panel, so no room is kept for a sheet.
  useEffect(() => {
    if (selected && !route) flyTo(VENUE_BY_ID[selected].coords, 40, 16)
  }, [selected, route])

  return (
    <div data-theme="dark" className="flex h-full w-full bg-canvas text-ink">
      {/* Side bar, like the car's own: the time, and the app that is open. */}
      <div className="flex w-[92px] shrink-0 flex-col items-center gap-5 border-r border-line bg-surface-2 py-5">
        <span className="text-[19px] font-semibold tabular">{clock(now)}</span>
        <span className="rounded-[18px] bg-surface-3 p-1.5">
          <LogoMark size={56} />
        </span>
      </div>

      <div className="flex w-[460px] shrink-0 flex-col p-6">
        {route && target ? (
          <div className="flex h-full flex-col">
            <div className="text-[17px] font-medium text-ink-2">{t.car.heading}</div>
            <div className="mt-1 text-[34px] leading-tight font-semibold tracking-tight">{target.venue.name}</div>
            <div className="mt-2 text-[20px] text-ink-2">{VENUE_BY_ID[route.venueId].gates.find((g) => g.id === route.gateId)?.name}</div>
            <div className="mt-8 flex items-baseline gap-3">
              <span className="text-[64px] leading-none font-semibold tabular">{Math.max(1, Math.round(route.minutes))}</span>
              <span className="text-[22px] text-ink-2">{t.car.minutes(route.km.toFixed(1).replace('.', ','))}</span>
            </div>
            <Status r={target} className="mt-6" />
            <button
              type="button"
              onClick={() => {
                haptic('tap')
                nav.stop()
              }}
              className="mt-auto flex h-[72px] items-center justify-center gap-3 rounded-[22px] bg-penuh-ink text-[22px] font-semibold text-white"
            >
              <X size={24} weight="bold" /> {t.car.end}
            </button>
          </div>
        ) : current ? (
          <div className="flex h-full flex-col">
            <button
              type="button"
              onClick={() => select(null)}
              className="flex h-12 w-fit items-center gap-2 rounded-full bg-surface-3 px-4 text-[18px] font-medium text-ink-2"
            >
              <ArrowLeft size={20} weight="bold" /> {t.car.back}
            </button>
            <div className="mt-5 text-[34px] leading-tight font-semibold tracking-tight">{current.venue.name}</div>
            <Status r={current} className="mt-4" />
            <div className="mt-6 text-[20px] leading-snug text-ink-2">
              {t.car.gate(current.bestGate.name, formatMin(current.bestGateQueueMin))}
            </div>
            <div className="mt-2 text-[20px] text-ink-2">{t.car.parkIn(formatMin(current.timeToPark))}</div>
            <button
              type="button"
              onClick={() => {
                haptic('success')
                void nav.start(current.venue.id)
              }}
              className="btn-primary mt-auto flex h-[72px] items-center justify-center gap-3 rounded-[22px] text-[22px] font-semibold text-white"
            >
              <NavigationArrow size={24} weight="fill" /> {t.car.route(current.bestGate.name)}
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-3 text-[26px] font-semibold tracking-tight">{t.car.nearby}</div>
            <div className="flex-1 divide-y divide-line overflow-hidden rounded-[22px] bg-surface">
              {ranked.slice(0, ROWS).map((r) => (
                <button
                  key={r.venue.id}
                  type="button"
                  onClick={() => {
                    haptic('tap')
                    select(r.venue.id)
                  }}
                  className="flex h-[19.6%] w-full items-center gap-4 px-5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[21px] font-semibold">{r.venue.name}</span>
                    <span className="block text-[16px] text-ink-2">{t.car.parkIn(formatMin(r.timeToPark))}</span>
                  </span>
                  <span className={clsx('rounded-full px-3.5 py-1.5 text-[19px] font-semibold tabular', STATUS[r.status].soft)}>{r.pct}%</span>
                  <CaretRight size={20} className="text-ink-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-l-[26px]">
        <Suspense fallback={<div className="absolute inset-0 bg-surface-2" />}>
          <MapView
            theme="dark"
            snapshots={ranked}
            facts={facts}
            selected={selected}
            onSelect={select}
            origin={origin}
            route={route}
            initialBounds={INITIAL_BOUNDS}
          />
        </Suspense>
      </div>
    </div>
  )
}

function Status({ r, className }: { r: { status: keyof typeof STATUS; pct: number }; className?: string }) {
  const t = useT()
  return (
    <span className={clsx('inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2 text-[22px] font-semibold tabular', STATUS[r.status].soft, className)}>
      <span className={clsx('size-3 rounded-full', STATUS[r.status].dot)} />
      {r.pct}% {t.status[r.status]}
    </span>
  )
}
