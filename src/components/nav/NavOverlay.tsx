import { ArrowBendUpRight, CarProfile, NavigationArrow } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import type { Gate } from '../../data/types'
import { VENUE_BY_ID } from '../../data/venues'
import { forKind, snapshot } from '../../engine/occupancy'
import { zoneOf } from '../../engine/zone'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { useVehicle } from '../../store/app'
import type { Route } from '../../store/ui'
import { useUi } from '../../store/ui'
import { buttonClass } from '../ui/buttonStyles'
import { useNavigation } from './useNavigation'

/** Turn banner up top while driving. Tells you which gate, not which street. */
export function NavBanner({ route, now }: { route: Route | null; now: number }) {
  const t = useT()
  return (
    <AnimatePresence>
      {route && <BannerBody key={route.startedAt} route={route} now={now} t={t} />}
    </AnimatePresence>
  )
}

/** The route goes to the zone gate because Zona KENNETH was on, so the driver should hear it is the booked one. */
function useZoneGate(route: Route, gate: Gate) {
  const mode = useUi((s) => s.mode)
  return mode === 'zone' && gate.zoneLane && zoneOf(VENUE_BY_ID[route.venueId])?.gate.id === gate.id
}

function BannerBody({ route, now, t }: { route: Route; now: number; t: ReturnType<typeof useT> }) {
  // A motorbike queues against the motorbike bays, like everywhere else in the app.
  const venue = forKind(VENUE_BY_ID[route.venueId], useVehicle().kind)
  const gate = venue.gates.find((g) => g.id === route.gateId)!
  const booked = useZoneGate(route, gate)
  // The queue that matters is the one waiting when you get there, not the one now.
  const eta = route.startedAt + route.minutes * 60_000
  const snap = snapshot(venue, Math.max(now, eta))
  const q = snap.gates.find((g) => g.gate.id === gate.id)?.queueMin ?? 0
  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -90, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="pt-safe absolute inset-x-0 top-0 z-40 px-3.5"
    >
      <div className="shadow-float flex items-center gap-3 rounded-[24px] border border-line bg-surface p-3 pr-4 text-ink">
        <span className="btn-primary grid size-12 shrink-0 place-items-center rounded-[16px] text-white">
          <ArrowBendUpRight size={26} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium text-ink-3">
            {booked ? `${venue.name} · ${t.modes.zone.label}` : venue.name}
          </span>
          <span className="block truncate text-[17px] leading-tight font-semibold tracking-tight">
            {t.nav.toward(gate.name)} <span className="font-medium text-ink-3">· {gate.hint}</span>
          </span>
          <span className="mt-0.5 block text-[12px] font-medium text-ink-2">
            {t.nav.thenQueue(`${formatMin(q)} ${t.unit.min}`)}
          </span>
        </span>
      </div>
    </motion.div>
  )
}

/** Replaces the sheet body while driving: ETA, distance, the booked gate when there is one, and the two exits. */
export function DriveHud({ route, now }: { route: Route; now: number }) {
  const t = useT()
  const nav = useNavigation()
  const open = useUi((s) => s.open)
  const setRoute = useUi((s) => s.setRoute)
  const gate = VENUE_BY_ID[route.venueId].gates.find((g) => g.id === route.gateId)!
  const booked = useZoneGate(route, gate)
  const eta = route.startedAt + route.minutes * 60_000
  const left = Math.max(0, Math.round((eta - now) / 60_000))
  return (
    <div className="px-4 pb-2">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-brand-600 text-white">
          <NavigationArrow size={20} weight="fill" />
        </span>
        <div className="flex-1">
          <div className="text-[24px] leading-none font-extrabold tracking-tight tabular">
            {left}
            <span className="ml-1 text-[13px] font-bold text-ink-3">{t.unit.min}</span>
            <span className="ml-2 text-[15px] font-bold text-ink-2">
              {t.nav.eta} {clock(eta)}
            </span>
          </div>
          <div className="mt-1 text-[12px] text-ink-3 tabular">
            {formatKm(route.km)} · {route.source === 'road' ? t.nav.roadRoute : t.nav.estRoute}
          </div>
          {/* The one cornflower here matches the zone pins: this is the gate the bay is booked through. */}
          {booked && (
            <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
              <span className="size-1.5 shrink-0 rounded-full bg-brand-600 dark:bg-brand-400" aria-hidden="true" />
              <span className="truncate">{t.nav.zoneGate(gate.name)}</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={nav.stop}
          className={buttonClass('ghost', 'md')}
        >
          {t.nav.end}
        </button>
        <button
          type="button"
          onClick={() => {
            const id = route.venueId
            setRoute(null)
            open({ kind: 'save-spot', id })
          }}
          className={buttonClass('primary', 'md')}
        >
          <CarProfile size={17} weight="fill" />
          {t.nav.arrive}
        </button>
      </div>
    </div>
  )
}
