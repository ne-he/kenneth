import {
  BellSimple,
  CarProfile,
  CaretRight,
  ChargingStation,
  Key,
  Lightning,
  MapTrifold,
  Motorcycle,
  ShareNetwork,
  Ticket,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { forKind, occupancyAt } from '../../engine/occupancy'
import { passPhase } from '../../engine/pass'
import { WINDOW_MINUTES, formatRupiah, parkingCost } from '../../engine/pricing'
import { valetOpen, valetPhase, type ValetTicket } from '../../engine/valet'
import { useDayLabel, useLang, useT } from '../../i18n'
import { shareSpot } from '../../lib/share'
import { clock, dayDiff, dayName, shortDate, stopwatch } from '../../lib/time'
import { useApp, type Visit } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Label, List, VenueGlyph } from '../ui/Kit'
import { useValetActions } from '../sheets/book/useValetActions'

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring' as const, stiffness: 420, damping: 34, delay: 0.03 + i * 0.04 },
})

/** Everything in progress, then reminders, then what already happened. Nothing else. */
export function Tickets() {
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
  const setTab = useUi((s) => s.setTab)
  const [all, setAll] = useState(false)

  const activePasses = passes.filter((p) => p.status === 'active' && passPhase(p.windowStart, now) !== 'expired')
  const liveEv = evBookings.filter((b) => b.start + b.durationMin * 60_000 > now)
  const liveValets = valets.filter((v) => valetOpen(v, now))
  const count = (parked ? 1 : 0) + activePasses.length + liveEv.length + liveValets.length

  let i = 0
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-safe pb-[calc(var(--nav-h)+24px)]">
      <header className="pt-3 pb-5">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight">{t.tickets.title}</h1>
        <p className="mt-0.5 text-[13px] text-ink-3">
          {dayName(now, lang, false)}, {clock(now)}
          {clockMode === 'scenario' ? ` · ${t.common.simulated}` : ''}
        </p>
      </header>

      {count === 0 ? (
        <motion.section {...rise(i++)} className="flex flex-col items-center rounded-[22px] border border-dashed border-line-strong px-6 py-9 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface-2 text-ink-3">
            <Ticket size={26} />
          </span>
          <h2 className="mt-3 text-[16px] font-bold">{t.tickets.empty}</h2>
          <p className="mt-1 max-w-[280px] text-[13px] leading-relaxed text-ink-3">{t.tickets.emptyHint}</p>
          <Button variant="dark" size="md" className="mt-4" onClick={() => setTab('explore')}>
            <MapTrifold size={17} weight="bold" /> {t.tickets.findParking}
          </Button>
        </motion.section>
      ) : (
        <section>
          <Label>{t.tickets.active(count)}</Label>
          <div className="space-y-2.5">
            {parked && (
              <motion.div {...rise(i++)}>
                <ParkedCard now={now} />
              </motion.div>
            )}
            {liveValets.map((v) => (
              <motion.div key={v.id} {...rise(i++)}>
                <ValetCard ticket={v} now={now} />
              </motion.div>
            ))}
            {activePasses.map((p) => (
              <motion.div key={p.id} {...rise(i++)}>
                <PassCard passId={p.id} now={now} />
              </motion.div>
            ))}
            {liveEv.map((b) => (
              <motion.div key={b.id} {...rise(i++)}>
                <EvCard id={b.id} now={now} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {reminders.length > 0 && (
        <motion.section {...rise(i++)} className="mt-6">
          <Label>{t.activity.reminders}</Label>
          <List>
            {reminders.map((r) => (
              <ReminderRow key={r.id} id={r.id} venueId={r.venueId} at={r.at} />
            ))}
          </List>
        </motion.section>
      )}

      {history.length > 0 && (
        <motion.section {...rise(i++)} className="mt-6">
          <Label
            aside={
              history.length > 4 && (
                <button type="button" onClick={() => setAll(!all)} className="font-semibold text-ink-2 hover:text-ink">
                  {all ? t.tickets.less : t.tickets.all(history.length)}
                </button>
              )
            }
          >
            {t.activity.history}
          </Label>
          <List>
            {history.slice(0, all ? 30 : 4).map((v) => (
              <HistoryRow key={v.id} v={v} />
            ))}
          </List>
        </motion.section>
      )}
    </div>
  )
}

/** Shared frame for every ticket: icon, what and where, then one line of state. */
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
      meta={`${spot.level} · ${t.park.zone} ${spot.zone} · ${spot.zone}-${spot.pillar} · ${spot.lobby}`}
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
          onClick={() => shareSpot(`${venue.name}, ${spot.level} ${spot.zone}-${spot.pillar}, ${spot.lobby}`, () => notify(t.activity.shared))}
        >
          <ShareNetwork size={17} weight="bold" /> {t.activity.share}
        </Button>
      </div>
    </Card>
  )
}

function ValetCard({ ticket, now }: { ticket: ValetTicket; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
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
          : t.valet.phases[phase]
  return (
    <Card
      icon={<Key size={22} weight="fill" />}
      tone={phase === 'ready' ? 'brand' : 'ink'}
      eyebrow={`${t.book.services.valet} · ${t.valet.phases[phase]}`}
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
    </Card>
  )
}

function PassCard({ passId, now }: { passId: string; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const pass = useApp((s) => s.passes.find((p) => p.id === passId))!
  const open = useUi((s) => s.open)
  const venue = VENUE_BY_ID[pass.venueId]
  const gate = venue.gates.find((g) => g.id === pass.gateId)!
  const phase = passPhase(pass.windowStart, now)
  const end = pass.windowStart + WINDOW_MINUTES * 60_000
  const when =
    dayDiff(now, pass.windowStart) > 0
      ? `${dayLabel(pass.windowStart, now)}, ${clock(pass.windowStart)}`
      : stopwatch(phase === 'upcoming' ? pass.windowStart - now : end - now)
  return (
    <Card
      icon={<Lightning size={22} weight="fill" />}
      tone="brand"
      eyebrow={`${t.activity.passTitle} · ${phase === 'upcoming' ? t.activity.upcoming : t.activity.open}`}
      title={`${venue.name} · ${gate.name}`}
      meta={`${clock(pass.windowStart)}-${clock(end)} · ${when}`}
      onClick={() => open({ kind: 'pass', id: pass.id })}
      right={<span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[12px] font-bold text-canvas">{t.activity.showQr}</span>}
    />
  )
}

function EvCard({ id, now }: { id: string; now: number }) {
  const t = useT()
  const b = useApp((s) => s.evBookings.find((x) => x.id === id))!
  const cancel = useApp((s) => s.cancelEvBooking)
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
      meta={`${clock(b.start)}-${clock(end)} · ${venue.ev.kw} kW`}
      right={
        !charging && (
          <button type="button" onClick={() => cancel(b.id)} aria-label={t.activity.cancelPass} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2">
            <X size={15} weight="bold" />
          </button>
        )
      }
    >
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full rounded-full bg-ev" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
      </div>
    </Card>
  )
}

function ReminderRow({ id, venueId, at }: { id: string; venueId: VenueId; at: number }) {
  const t = useT()
  const remove = useApp((s) => s.removeReminder)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <BellSimple size={18} weight="fill" className="text-ink-2" />
      <span className="flex-1 text-[13.5px] font-medium">{t.activity.reminderAt(VENUE_BY_ID[venueId].name, clock(at))}</span>
      <button type="button" onClick={() => remove(id)} aria-label={t.common.cancel} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2">
        <X size={15} weight="bold" />
      </button>
    </div>
  )
}

function HistoryRow({ v }: { v: Visit }) {
  const t = useT()
  const lang = useLang()
  const venue = VENUE_BY_ID[v.venueId]
  return (
    <div className="flex items-center gap-3 px-3.5 py-3">
      <VenueGlyph category={venue.category} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{venue.name}</span>
        <span className="block truncate text-[12px] text-ink-3">
          {shortDate(v.at, lang)}
          {v.divertedFrom ? ` · ${t.activity.diverted(VENUE_BY_ID[v.divertedFrom].name)}` : ''}
        </span>
      </span>
      {v.minutesSaved > 0 && <span className="shrink-0 text-[12px] font-semibold text-lega-ink dark:text-led-lega">{t.activity.saved(v.minutesSaved)}</span>}
    </div>
  )
}
