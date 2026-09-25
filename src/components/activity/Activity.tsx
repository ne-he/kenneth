import {
  ArrowClockwise,
  BellSimple,
  CaretRight,
  CarProfile,
  ChargingStation,
  Crown,
  Key,
  MapTrifold,
  Motorcycle,
  ShareNetwork,
  Ticket,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { splitActivity, type Past } from '../../engine/activity'
import { forKind, occupancyAt } from '../../engine/occupancy'
import { passPhase } from '../../engine/pass'
import { formatRupiah, parkingCost } from '../../engine/pricing'
import { runnerFor, valetPhase, type ValetTicket } from '../../engine/valet'
import { ZONE_HOLD_MIN, bayOf, zoneOf } from '../../engine/zone'
import { useDayLabel, useLang, useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { shareSpot } from '../../lib/share'
import { clock, dayDiff, dayName, shortDate, stopwatch } from '../../lib/time'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { CancelConfirm } from '../ui/CancelConfirm'
import { Label, List } from '../ui/Kit'
import { useValetActions } from '../sheets/book/useValetActions'
import { useCancel } from './useCancel'

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 34, delay: 0.03 + i * 0.04 },
})

const PAST_PREVIEW = 5

/**
 * The left tab. What is going on now, what is booked for later, and what
 * already happened. Every booking that can still be cancelled says so on its
 * card. Every row in Riwayat can be booked again with one tap, so the history
 * is a shortcut, not an archive.
 */
export function Activity() {
  const t = useT()
  const lang = useLang()
  const now = useNow(1000)
  const parked = useApp((s) => s.parked)
  const passes = useApp((s) => s.passes)
  const evBookings = useApp((s) => s.evBookings)
  const valets = useApp((s) => s.valets)
  const reminders = useApp((s) => s.reminders)
  const history = useApp((s) => s.history)
  const clockMode = useApp((s) => s.clock.mode)
  const { setTab, open } = useUi.getState()
  const [all, setAll] = useState(false)

  const split = useMemo(
    () => splitActivity({ parked, passes, valets, evBookings, reminders, history }, now),
    [parked, passes, valets, evBookings, reminders, history, now],
  )
  const { current, upcoming, past } = split
  const month = history.filter((v) => now - v.at < 31 * 86_400_000)
  const savedMin = month.reduce((sum, v) => sum + v.minutesSaved, 0)

  let i = 0
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-safe pb-[calc(var(--nav-h)+36px)]">
      <header className="pt-3 pb-4">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{t.activity.title}</h1>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {dayName(now, lang, false)}, {clock(now)}
          {clockMode === 'scenario' ? ` · ${t.common.simulated}` : ''}
        </p>
      </header>

      {current.length === 0 && upcoming.length === 0 && past.length > 0 && (
        <motion.section {...rise(i++)} className="mb-6 flex items-center gap-3 rounded-[20px] border border-dashed border-line-strong p-3.5 pl-4">
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink-2">{t.activity.nothingNow}</span>
          <Button variant="dark" size="sm" onClick={() => setTab('park')}>
            <MapTrifold size={15} weight="bold" /> {t.activity.findParking}
          </Button>
        </motion.section>
      )}

      {current.length === 0 && upcoming.length === 0 && past.length === 0 && (
        <motion.section {...rise(i++)} className="mb-6 flex flex-col items-center rounded-[22px] border border-dashed border-line-strong px-6 py-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-3">
            <Ticket size={26} />
          </span>
          <h2 className="mt-3 text-[16px] font-bold">{t.activity.emptyTitle}</h2>
          <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-ink-3">{t.activity.emptyHint}</p>
          <Button variant="dark" size="md" className="mt-4" onClick={() => setTab('park')}>
            <MapTrifold size={17} weight="bold" /> {t.activity.findParking}
          </Button>
        </motion.section>
      )}

      {current.length > 0 && (
        <section className="mb-6">
          <Label>{t.activity.now}</Label>
          <div className="space-y-2.5">
            {current.map((c) => (
              <motion.div key={c.kind === 'parked' ? 'parked' : `${c.kind}:${c.id}`} {...rise(i++)}>
                {c.kind === 'parked' && <ParkedCard now={now} />}
                {c.kind === 'valet' && <ValetCard id={c.id} now={now} />}
                {c.kind === 'pass' && <PassCard id={c.id} now={now} />}
                {c.kind === 'ev' && <EvCard id={c.id} now={now} />}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mb-6">
          <Label>{t.activity.next}</Label>
          <div className="space-y-2.5">
            {upcoming.map((u) => (
              <motion.div key={`${u.kind}:${u.id}`} {...rise(i++)}>
                {u.kind === 'valet' && <ValetCard id={u.id} now={now} />}
                {u.kind === 'pass' && <PassCard id={u.id} now={now} />}
                {u.kind === 'ev' && <EvCard id={u.id} now={now} />}
                {u.kind === 'reminder' && <ReminderCard id={u.id} />}
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <motion.section {...rise(i++)}>
          <Label
            aside={
              past.length > PAST_PREVIEW && (
                <button type="button" onClick={() => setAll(!all)} className="font-semibold text-brand-700 hover:text-brand-600 dark:text-brand-300">
                  {all ? t.activity.less : t.activity.all(past.length)}
                </button>
              )
            }
          >
            {t.activity.past}
          </Label>
          <List>
            {past.slice(0, all ? 40 : PAST_PREVIEW).map((p) => (
              <PastRow key={p.key} p={p} />
            ))}
          </List>
          {month.length > 0 && (
            <button
              type="button"
              onClick={() => open({ kind: 'impact' })}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-[16px] bg-lega-soft px-4 py-3 text-left text-[13px] font-bold text-lega-ink dark:bg-lega/15 dark:text-led-lega"
            >
              <span>{t.activity.summary(month.length)}</span>
              <span className="flex items-center gap-1">
                {t.activity.summarySaved(savedMin)} <CaretRight size={13} weight="bold" />
              </span>
            </button>
          )}
        </motion.section>
      )}
    </div>
  )
}

/** Shared frame for every booking: icon, what and where, then one line of state. */
function Card({
  icon,
  tone,
  eyebrow,
  title,
  meta,
  right,
  onClick,
  children,
}: {
  icon: ReactNode
  tone: 'brand' | 'ev' | 'ink'
  eyebrow: string
  title: string
  meta: ReactNode
  right?: ReactNode
  onClick?: () => void
  children?: ReactNode
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <section className="rounded-[22px] border border-line bg-surface p-4">
      <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <span
          className={clsx(
            'grid size-11 shrink-0 place-items-center rounded-[14px]',
            tone === 'brand' && 'bg-brand-600/10 text-brand-700 dark:bg-brand-400/15 dark:text-brand-300',
            tone === 'ev' && 'bg-ev/12 text-ev',
            tone === 'ink' && 'bg-surface-2 text-ink',
          )}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold text-ink-3">{eyebrow}</span>
          <span className="block truncate text-[15.5px] font-bold tracking-tight">{title}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-2">{meta}</span>
        </span>
        {right ?? (onClick && <CaretRight size={16} className="shrink-0 text-ink-3" />)}
      </Tag>
      {children}
    </section>
  )
}

function ParkedCard({ now }: { now: number }) {
  const t = useT()
  const spot = useApp((s) => s.parked)!
  const { open, notify } = useUi.getState()
  const venue = forKind(VENUE_BY_ID[spot.venueId], spot.kind ?? 'mobil')
  const elapsed = now - spot.at
  const cost = parkingCost(venue, elapsed / 3_600_000)
  const exitMin = Math.max(1, Math.round(1 + occupancyAt(venue, now) * 3))
  return (
    <Card
      icon={spot.kind === 'motor' ? <Motorcycle size={22} weight="fill" /> : <CarProfile size={22} weight="fill" />}
      tone="brand"
      eyebrow={spot.kind === 'motor' ? t.activity.parkedMotor : t.activity.parked}
      title={venue.name}
      meta={`${spot.level} · ${spot.section}-${spot.pillar} · ${spot.lobby}`}
      right={
        <span className="shrink-0 text-right">
          <span className="block font-mono text-[15px] font-bold tabular">{stopwatch(elapsed)}</span>
          <span className="text-[11.5px] text-ink-3 tabular">{formatRupiah(cost, true)}</span>
        </span>
      }
    >
      <p className="mt-3 rounded-[12px] bg-surface-2 px-3 py-2 text-[12px] text-ink-2">
        {t.activity.exit}: <span className="font-semibold text-lega-ink dark:text-led-lega">{t.activity.exitSmooth(exitMin)}</span>
      </p>
      <div className="mt-3 grid grid-cols-[1.4fr_1fr] gap-2">
        <Button variant="dark" onClick={() => open({ kind: 'find-car' })}>
          <MapTrifold size={17} weight="bold" /> {t.park.findCar}
        </Button>
        <Button
          onClick={() => shareSpot(`${venue.name}, ${spot.level} ${spot.section}-${spot.pillar}, ${spot.lobby}`, () => notify(t.activity.shared))}
        >
          <ShareNetwork size={17} weight="bold" /> {t.activity.share}
        </Button>
      </div>
    </Card>
  )
}

function ValetCard({ id, now }: { id: string; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const ticket = useApp((s) => s.valets.find((v) => v.id === id)) as ValetTicket
  const open = useUi((s) => s.open)
  const act = useValetActions()
  const venue = VENUE_BY_ID[ticket.venueId]
  const phase = valetPhase(ticket, now)
  const meta =
    phase === 'booked'
      ? t.valet.bookedMeta(ticket.lobby, `${dayLabel(ticket.arriveAt, now)}, ${clock(ticket.arriveAt)}`)
      : phase === 'fetching'
        ? t.valet.readyIn(stopwatch(Math.max(0, (ticket.readyAt ?? now) - now)))
        : phase === 'ready'
          ? t.valet.readyNow(ticket.lobby)
          : `${t.valet.phases[phase]} · ${ticket.lobby}`
  return (
    <Card
      icon={<Key size={22} weight="fill" />}
      tone={phase === 'ready' ? 'brand' : 'ink'}
      eyebrow={`${t.book.services.valet} · ${runnerFor(ticket.id).name}`}
      title={venue.name}
      meta={meta}
      onClick={() => open({ kind: 'valet', id: ticket.id })}
    >
      {phase === 'fetching' && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-brand-500"
            animate={{
              width: `${Math.min(100, ((now - (ticket.requestedAt ?? now)) / Math.max(1, (ticket.readyAt ?? now) - (ticket.requestedAt ?? now))) * 100)}%`,
            }}
          />
        </div>
      )}
      {(phase === 'booked' || phase === 'parked' || phase === 'ready') && (
        <Button
          variant={phase === 'parked' ? 'primary' : 'dark'}
          block
          className="mt-3"
          onClick={() => (phase === 'booked' ? act.handover(ticket) : phase === 'parked' ? act.call(ticket) : act.pickUp(ticket))}
        >
          {phase === 'booked' ? t.valet.handover : phase === 'parked' ? t.valet.callCar : t.valet.pickedUp}
        </Button>
      )}
      {phase === 'booked' && <CancelConfirm className="mt-1.5" policy={t.activity.valetCancelPolicy} onConfirm={() => act.cancel(ticket)} />}
    </Card>
  )
}

function PassCard({ id, now }: { id: string; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const pass = useApp((s) => s.passes.find((p) => p.id === id))!
  const open = useUi((s) => s.open)
  const cancel = useCancel()
  const venue = VENUE_BY_ID[pass.venueId]
  const zone = zoneOf(venue)
  const phase = passPhase(pass.windowStart, now)
  const end = pass.windowStart + ZONE_HOLD_MIN * 60_000
  const when =
    dayDiff(now, pass.windowStart) > 0
      ? dayLabel(pass.windowStart, now)
      : phase === 'upcoming'
        ? t.activity.startsIn(stopwatch(pass.windowStart - now))
        : t.activity.endsIn(stopwatch(end - now))
  return (
    <Card
      icon={<Crown size={22} weight="fill" />}
      tone="brand"
      eyebrow={`${t.activity.passTitle} · ${bayOf(pass, venue)}${zone ? ` · ${zone.level}` : ''}`}
      title={venue.name}
      meta={`${clock(pass.windowStart)} · ${when}`}
      onClick={() => open({ kind: 'pass', id: pass.id })}
      right={<span className="shrink-0 text-[13px] font-bold tabular">{formatRupiah(pass.price, true)}</span>}
    >
      <Button variant="dark" block className="mt-3" onClick={() => open({ kind: 'pass', id: pass.id })}>
        <Ticket size={17} weight="fill" /> {t.activity.showQr}
      </Button>
      {phase === 'upcoming' && <CancelConfirm className="mt-1.5" policy={t.activity.cancelPolicy} onConfirm={() => cancel.pass(pass.id)} />}
    </Card>
  )
}

function EvCard({ id, now }: { id: string; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const b = useApp((s) => s.evBookings.find((x) => x.id === id))!
  const cancel = useCancel()
  const venue = VENUE_BY_ID[b.venueId]
  const end = b.start + b.durationMin * 60_000
  const charging = now >= b.start
  const pct = charging ? Math.min(100, Math.round(((now - b.start) / (end - b.start)) * 100)) : 0
  return (
    <Card
      icon={<ChargingStation size={22} weight="fill" />}
      tone="ev"
      eyebrow={`${t.activity.evTitle} · ${b.charger}`}
      title={venue.name}
      meta={`${charging ? '' : `${dayLabel(b.start, now)}, `}${clock(b.start)}-${clock(end)} · ${venue.ev.kw} kW`}
    >
      {charging ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div className="h-full rounded-full bg-ev" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
        </div>
      ) : (
        <CancelConfirm className="mt-3" policy={t.activity.evCancelPolicy} onConfirm={() => cancel.ev(b.id)} />
      )}
    </Card>
  )
}

function ReminderCard({ id }: { id: string }) {
  const t = useT()
  const r = useApp((s) => s.reminders.find((x) => x.id === id))!
  const remove = useApp((s) => s.removeReminder)
  const notify = useUi((s) => s.notify)
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3">
      <BellSimple size={18} weight="fill" className="shrink-0 text-ink-2" />
      <span className="flex-1 text-[13.5px] font-medium">{t.activity.reminderAt(VENUE_BY_ID[r.venueId].name, clock(r.at))}</span>
      <button
        type="button"
        onClick={() => {
          remove(r.id)
          notify(t.activity.reminderCancelled)
        }}
        aria-label={t.common.cancel}
        className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2"
      >
        <X size={15} weight="bold" />
      </button>
    </div>
  )
}

const PAST_ICON: Record<Past['service'], (motor: boolean) => ReactNode> = {
  park: (motor) => (motor ? <Motorcycle size={17} weight="fill" /> : <CarProfile size={17} weight="fill" />),
  valet: () => <Key size={17} weight="fill" />,
  zone: () => <Crown size={17} weight="fill" />,
  ev: () => <ChargingStation size={17} weight="fill" />,
}

/** One finished thing, and the button that starts the same thing again. */
function PastRow({ p }: { p: Past }) {
  const t = useT()
  const lang = useLang()
  const venue = VENUE_BY_ID[p.venueId]
  const motor = p.visit?.kind === 'motor'
  // Plain parking already reads "parkir 2j" below, so only the paid services name themselves.
  const bits = p.service === 'park' ? [shortDate(p.at, lang)] : [shortDate(p.at, lang), t.activity.kind[p.service]]
  if (p.outcome !== 'done') bits.push(t.activity.outcome[p.outcome])
  else if (p.visit) {
    bits.push(t.activity.parkedFor(formatHours(p.visit.durationH, lang)))
    if (p.visit.divertedFrom) bits.push(t.activity.diverted(VENUE_BY_ID[p.visit.divertedFrom].name))
  }
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <span
        className={clsx(
          'grid size-9 shrink-0 place-items-center rounded-[12px]',
          p.outcome === 'done' ? 'bg-surface-2 text-ink-2' : 'bg-surface-2 text-ink-3',
        )}
      >
        {PAST_ICON[p.service](motor)}
      </span>
      <span className="min-w-0 flex-1">
        <span className={clsx('block truncate text-[14px] font-semibold', p.outcome !== 'done' && 'text-ink-2')}>{venue.name}</span>
        <span className="block truncate text-[12px] text-ink-3">{bits.join(' · ')}</span>
      </span>
      <AgainButton venueId={p.venueId} service={p.service} motor={motor} name={venue.name} />
    </div>
  )
}

function AgainButton({ venueId, service, motor, name }: { venueId: VenueId; service: Past['service']; motor: boolean; name: string }) {
  const t = useT()
  return (
    <button
      type="button"
      aria-label={t.activity.againLabel(name)}
      onClick={() => {
        haptic('tap')
        const ui = useUi.getState()
        // Parking again means the map with the place open. A booking again opens its form on top.
        ui.setMode(service === 'park' || motor ? 'park' : service)
        ui.setTab('park')
        ui.select(venueId)
        if (service !== 'park' && !motor) ui.open({ kind: 'book', id: venueId, service })
      }}
      className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-2 px-3 text-[12px] font-bold text-brand-700 transition-colors hover:bg-surface-3 dark:text-brand-300"
    >
      <ArrowClockwise size={13} weight="bold" /> {t.activity.again}
    </button>
  )
}

function formatHours(h: number, lang: 'id' | 'en'): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  const H = lang === 'id' ? 'j' : 'h'
  return hh > 0 ? `${hh}${H}${mm ? ` ${mm}m` : ''}` : `${mm}m`
}
