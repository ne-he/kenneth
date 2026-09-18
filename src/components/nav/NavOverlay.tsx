import { ArrowBendUpRight, CarProfile, NavigationArrow } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { VENUE_BY_ID } from '../../data/venues'
import { snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import type { Route } from '../../store/ui'
import { useUi } from '../../store/ui'
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

function BannerBody({ route, now, t }: { route: Route; now: number; t: ReturnType<typeof useT> }) {
  const venue = VENUE_BY_ID[route.venueId]
  const gate = venue.gates.find((g) => g.id === route.gateId)!
  const snap = snapshot(venue, now)
  const q = snap.gates.find((g) => g.gate.id === gate.id)?.queueMin ?? 0
  return (
    <motion.div
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -90, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="pt-safe absolute inset-x-0 top-0 z-40 px-3.5"
    >
      <div className="flex items-center gap-3 rounded-[24px] bg-[#0f1311] p-3 pr-4 text-white shadow-[0_18px_40px_-14px_rgb(0_0_0/0.6)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-brand-500">
          <ArrowBendUpRight size={26} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
            {venue.name}
          </span>
          <span className="block truncate text-[17px] leading-tight font-extrabold">
            {t.nav.toward(gate.name)} <span className="font-semibold text-white/60">· {gate.hint}</span>
          </span>
          <span className="mt-0.5 block text-[12px] font-semibold text-led-lega">
            {t.nav.thenQueue(`${formatMin(q)} ${t.unit.min}`)}
          </span>
        </span>
      </div>
    </motion.div>
  )
}

/** Replaces the sheet body while driving: ETA, distance, and the two exits. */
export function DriveHud({ route, now }: { route: Route; now: number }) {
  const t = useT()
  const nav = useNavigation()
  const open = useUi((s) => s.open)
  const setRoute = useUi((s) => s.setRoute)
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
        </div>
      </div>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={nav.stop}
          className="h-11 rounded-2xl bg-surface-2 text-[13.5px] font-bold hover:bg-surface-3"
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
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-ink text-[13.5px] font-bold text-canvas"
        >
          <CarProfile size={17} weight="fill" />
          {t.nav.arrive}
        </button>
      </div>
    </div>
  )
}
