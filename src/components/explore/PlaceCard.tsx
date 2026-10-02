import {
  BellSimple,
  CaretRight,
  CarProfile,
  ChargingStation,
  CheckCircle,
  Crown,
  DotsThree,
  Key,
  NavigationArrow,
  PersonSimpleWalk,
  ShareNetwork,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import type { OccupancyStatus } from '../../data/types'
import { VENUES } from '../../data/venues'
import { SERVICES, chargersFree, valetFacts } from '../../engine/modes'
import { defaultGate, forKind, nextRelief } from '../../engine/occupancy'
import { formatRupiah, zonePrice, zoneWorthIt } from '../../engine/pricing'
import { alternativesFor, type Ranked } from '../../engine/recommend'
import { servicesFor, type Service } from '../../engine/services'
import { baysLeft, zoneOf } from '../../engine/zone'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { askNotificationPermission } from '../../lib/notify'
import { shareSpot } from '../../lib/share'
import { STATUS, formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { uid, useApp, useVehicle } from '../../store/app'
import { useUi } from '../../store/ui'
import { useNavigation } from '../nav/useNavigation'

/**
 * The top of a place, all a driver needs at a glance: the services as a chip
 * row, one line of context, three numbers when a service is involved, and one
 * button that does what the mode is for. Everything else sits below it and
 * shows when the sheet is pulled up.
 */
export function PlaceCard({ snap, ts, previewing }: { snap: Ranked; ts: number; previewing: boolean }) {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const vehicle = useVehicle()
  const venue = snap.venue
  const services = servicesFor(venue, vehicle.kind)
  // A service that is on but not sold here falls back to plain parking; the dimmed chip says why.
  const active = mode !== 'park' && services.includes(mode) ? mode : null

  return (
    <Card>
      <ServiceChips services={services} />
      {mode !== 'park' && !active && <Note>{t.modes.none[mode]}</Note>}
      {active ? <ServiceCard mode={active} snap={snap} ts={ts} /> : <ParkCard snap={snap} ts={ts} previewing={previewing} />}
    </Card>
  )
}

/**
 * The three paid services as switches. The one that is on wears the brand
 * tint; one this place does not sell is dimmed and cannot be turned on, but
 * the active one can always be turned off, which is the way back to parking.
 */
function ServiceChips({ services }: { services: Service[] }) {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const toggleService = useUi((s) => s.toggleService)
  const vehicle = useVehicle()
  const car = vehicle.kind === 'mobil'
  return (
    <div role="group" aria-label={t.venue.services} className="no-scrollbar -mx-5 mb-3 flex gap-1 overflow-x-auto px-5">
      {SERVICES.map((m) => {
        const on = mode === m
        const offered = services.includes(m)
        const why = !car ? t.modes.carOnly : !offered ? t.modes.none[m] : undefined
        return (
          <button
            key={m}
            type="button"
            role="switch"
            aria-checked={on}
            disabled={!car || (!offered && !on)}
            title={why}
            onClick={() => {
              haptic('tap')
              toggleService(m)
            }}
            className={clsx(
              'h-8 shrink-0 rounded-full px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:text-ink-3 disabled:opacity-50',
              on ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              on && !offered && 'opacity-60',
            )}
          >
            {t.book.services[m]}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A service that is on and sold here: where it is, its numbers in one quiet
 * line, the one brand-filled button in the app to book it, and the route as a
 * hairline row under it. The price sits in the button, so the line does not
 * repeat it.
 */
function ServiceCard({ mode, snap, ts }: { mode: Service; snap: Ranked; ts: number }) {
  const t = useT()
  const open = useUi((s) => s.open)
  const plan = useApp((s) => s.plan)
  const vehicle = useVehicle()
  const nav = useNavigation()
  const venue = snap.venue

  let line: string
  let facts: string
  let dot: OccupancyStatus | undefined
  let note: string | null = null
  let cta: ReactNode
  if (mode === 'zone') {
    const zone = zoneOf(venue)!
    const left = baysLeft(venue, ts, snap.occ)
    line = t.card.zoneLine(zone.level, zone.lobby, zone.gate.name)
    facts = t.card.zoneFacts(left, zone.bays)
    dot = left === 0 ? 'penuh' : left <= 3 ? 'ramai' : 'lega'
    if (left === 0) note = t.card.zoneGone
    cta = (
      <>
        <Crown size={17} weight="fill" /> {t.card.zoneCta} · {formatRupiah(zonePrice(snap.occ, plan), true)}
      </>
    )
  } else if (mode === 'valet' && venue.valet) {
    const f = valetFacts(snap)
    line = t.card.valetLine(venue.valet.lobbies.join(' / '))
    facts = t.card.valetFacts(f.drop, f.back)
    cta = (
      <>
        <Key size={17} weight="fill" /> {t.card.valetCta} · {formatRupiah(venue.valet.price, true)}
      </>
    )
  } else {
    const free = chargersFree(snap, ts)
    line = t.card.evLine(venue.ev.kw)
    facts = t.card.evFacts(free, venue.ev.chargers, venue.ev.kw)
    dot = free === 0 ? 'penuh' : 'lega'
    if (!vehicle.isEV) note = t.card.evNotEv
    cta = (
      <>
        <ChargingStation size={17} weight="fill" /> {t.card.evCta}
      </>
    )
  }

  const queue = snap.bestGateQueueMin < 3 ? t.card.routeClear : t.card.routeQueue(formatMin(snap.bestGateQueueMin))
  return (
    <>
      <Line>{line}</Line>
      <Facts dot={dot}>{facts}</Facts>
      {note && <Note>{note}</Note>}
      <Btn tone="brand" onClick={() => open({ kind: 'book', id: venue.id, service: mode })}>
        {cta}
      </Btn>
      <Rows>
        <Row icon={<NavigationArrow size={16} weight="fill" />} onClick={() => nav.start(venue.id)}>
          {t.card.routeTo(snap.bestGate.name)}
          <span className="text-ink-3">, {queue}</span>
        </Row>
      </Rows>
    </>
  )
}

/** Plain parking: which gate, the route there, and a nudge only when it would actually help. */
function ParkCard({ snap, ts, previewing }: { snap: Ranked; ts: number; previewing: boolean }) {
  const t = useT()
  const open = useUi((s) => s.open)
  const select = useUi((s) => s.select)
  const notify = useUi((s) => s.notify)
  const plan = useApp((s) => s.plan)
  const reminders = useApp((s) => s.reminders)
  const addReminder = useApp((s) => s.addReminder)
  const vehicle = useVehicle()
  const nav = useNavigation()
  const [more, setMore] = useState(false)
  const venue = snap.venue
  const services = servicesFor(venue, vehicle.kind)

  const pool = useMemo(() => VENUES.map((v) => forKind(v, vehicle.kind)), [vehicle.kind])
  const alt = snap.status !== 'lega' ? alternativesFor(venue, pool, ts)[0] : undefined
  const relief = !previewing ? nextRelief(venue, ts) : null
  const reminded = reminders.some((r) => r.venueId === venue.id)
  const bookHint = services.includes('zone') && zoneWorthIt(snap.occ)

  const main = defaultGate(venue)
  const split = snap.bestGate.id !== main.id && snap.queueMin - snap.bestGateQueueMin >= 2
  const line = split
    ? t.card.queueSplit(main.name, formatMin(snap.queueMin), snap.bestGate.name, formatMin(snap.bestGateQueueMin))
    : snap.bestGateQueueMin < 3
      ? t.card.queueCalm(snap.bestGate.name)
      : t.venue.gatesSummary(snap.bestGate.name, formatMin(snap.bestGateQueueMin))

  const remind = () => {
    if (!relief || reminded) return
    haptic('success')
    addReminder({ id: uid(), venueId: venue.id, at: relief, createdAt: wallClock() })
    notify(t.explore.reminded)
    askNotificationPermission()
  }

  return (
    <>
      <Line dot={!split && snap.bestGateQueueMin < 3 ? 'lega' : undefined}>{line}</Line>
      <div className="flex gap-2">
        <Btn tone="ink" onClick={() => nav.start(venue.id)}>
          <NavigationArrow size={17} weight="fill" /> {t.card.routeTo(snap.bestGate.name)}
        </Btn>
        <button
          type="button"
          aria-label={t.card.more}
          aria-expanded={more}
          onClick={() => {
            haptic('tap')
            setMore(!more)
          }}
          className={clsx(
            'grid size-12 shrink-0 place-items-center rounded-full border transition-colors',
            more ? 'border-transparent bg-ink text-canvas' : 'border-line-strong text-ink hover:bg-surface-2',
          )}
        >
          <DotsThree size={22} weight="bold" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {more && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Rows>
              <Row icon={<CarProfile size={16} weight="fill" />} onClick={() => open({ kind: 'save-spot', id: venue.id })}>
                {t.card.saveSpot}
              </Row>
              {relief && (
                <Row
                  icon={reminded ? <CheckCircle size={16} weight="fill" /> : <BellSimple size={16} weight="fill" />}
                  onClick={remind}
                  muted={reminded}
                >
                  {reminded ? t.card.reminded : t.card.remind(clock(relief))}
                </Row>
              )}
              <Row
                icon={<ShareNetwork size={16} weight="bold" />}
                onClick={() =>
                  shareSpot(t.venue.shareText(venue.name, snap.pct, t.status[snap.status], window.location.origin), () =>
                    notify(t.activity.shared),
                  )
                }
              >
                {t.card.share}
              </Row>
            </Rows>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nudges read as plain rows, not cards. Zona KENNETH keeps the one touch of cornflower. */}
      {(bookHint || alt) && (
        <Rows>
          {bookHint && (
            <Row
              icon={<Crown size={16} weight="fill" className="text-brand-600 dark:text-brand-300" />}
              onClick={() => open({ kind: 'book', id: venue.id, service: 'zone' })}
              next
            >
              {t.card.bookHint(formatRupiah(zonePrice(snap.occ, plan), true))}
            </Row>
          )}
          {alt && (
            <Row
              icon={alt.walk ? <PersonSimpleWalk size={16} weight="bold" /> : <CarProfile size={16} weight="fill" />}
              onClick={() => select(alt.snap.venue.id)}
              next
            >
              <span className={clsx('mr-1.5 inline-block size-2 rounded-full align-[1px]', STATUS[alt.snap.status].dot)} aria-hidden="true" />
              {t.card.altHint(alt.snap.venue.name, alt.snap.pct)}
              <span className="text-ink-3">, {alt.walk ? t.venue.walk(alt.walk.minutes, alt.walk.via).toLowerCase() : t.venue.drive(formatKm(alt.km))}</span>
            </Row>
          )}
        </Rows>
      )}
    </>
  )
}

/** Real time for the record, outside render so the purity rule stays happy. */
const wallClock = () => Date.now()

function Card({ children }: { children: ReactNode }) {
  return <section className="px-1 pb-2">{children}</section>
}

/** The one line of context above the button. A status dot only when the line is about how clear it is. */
function Line({ children, dot }: { children: ReactNode; dot?: OccupancyStatus }) {
  return (
    <p className="mb-4 flex items-baseline gap-2 text-[13.5px] leading-snug text-ink-2">
      {dot && <span className={clsx('size-2 shrink-0 -translate-y-px rounded-full', STATUS[dot].dot)} aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="-mt-1 mb-4 text-[12.5px] leading-snug text-ink-3">{children}</p>
}

/** The numbers of a service in one quiet line under the context. A dot marks the one that carries a status. */
function Facts({ dot, children }: { dot?: OccupancyStatus; children: ReactNode }) {
  return (
    <p className="-mt-2 mb-4 flex items-center gap-2 text-[12.5px] leading-snug text-ink-3 tabular">
      {dot && <span className={clsx('size-2 shrink-0 rounded-full', STATUS[dot].dot)} aria-hidden="true" />}
      <span>{children}</span>
    </p>
  )
}

/**
 * The main action is an ink pill. Booking a service is the one brand-filled
 * button in the app, so the paid step reads differently from the free one.
 */
function Btn({ tone, onClick, children }: { tone: 'ink' | 'brand'; onClick: () => void; children: ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className={clsx(
        'flex h-12 w-full min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-5 text-[14.5px] font-semibold tracking-tight transition-colors',
        tone === 'ink' && 'bg-ink text-canvas hover:opacity-90',
        tone === 'brand' && 'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400',
      )}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">{children}</span>
    </motion.button>
  )
}

/** A hairline list under the button: the extra actions and the nudges. */
function Rows({ children }: { children: ReactNode }) {
  return <div className="mt-3 divide-y divide-line border-t border-line">{children}</div>
}

function Row({
  icon,
  onClick,
  muted,
  next,
  children,
}: {
  icon: ReactNode
  onClick: () => void
  muted?: boolean
  /** Opens something else, so it gets a caret. */
  next?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className={clsx(
        'flex w-full items-center gap-3 py-3.5 text-left text-[13.5px] leading-snug transition-opacity hover:opacity-80 active:opacity-60',
        muted ? 'text-ink-3' : 'text-ink',
      )}
    >
      <span className="shrink-0 text-ink-3">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
      {next && <CaretRight size={12} weight="bold" className="shrink-0 text-ink-3" />}
    </button>
  )
}
