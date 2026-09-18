import {
  BellSimple,
  CarProfile,
  ChargingStation,
  Compass,
  Gauge,
  Lightning,
  LockSimple,
  MapPin,
  ShareNetwork,
  Sparkle,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { impactOf, sumImpact } from '../../engine/impact'
import { forecastDay, occupancyAt, quietestHour } from '../../engine/occupancy'
import { formatRupiah, parkingCost } from '../../engine/pricing'
import { useDayLabel, useLang, useT } from '../../i18n'
import { shareSpot } from '../../lib/share'
import { clock, dayDiff, dayName, hourLabel, shortDate, stopwatch, wib } from '../../lib/time'
import { useApp, type Visit } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { passPhase } from '../sheets/PassSheet'
import { Button } from '../ui/Button'
import { CountUp, Plate } from '../ui/Display'

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 32, delay: 0.04 + i * 0.05 },
})

export function Activity() {
  const t = useT()
  const lang = useLang()
  const now = useNow(1000)
  const parked = useApp((s) => s.parked)
  const passes = useApp((s) => s.passes)
  const evBookings = useApp((s) => s.evBookings)
  const reminders = useApp((s) => s.reminders)
  const history = useApp((s) => s.history)

  const activePasses = passes.filter((p) => p.status === 'active' && passPhase(p.windowStart, now) !== 'expired')
  const liveEv = evBookings.filter((b) => b.start + b.durationMin * 60_000 > now)

  let i = 0
  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-safe pb-28">
      <header className="flex items-end justify-between pt-3 pb-4">
        <div>
          <p className="text-[12px] font-semibold text-ink-3">
            {dayName(now, lang, false)}, {clock(now)}
          </p>
          <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">{t.activity.title}</h1>
        </div>
      </header>

      <motion.div {...stagger(i++)}>{parked ? <ParkedCard now={now} /> : <EmptyParked />}</motion.div>

      {activePasses.map((p) => (
        <motion.div key={p.id} {...stagger(i++)}>
          <PassCard passId={p.id} now={now} />
        </motion.div>
      ))}

      {liveEv.map((b) => (
        <motion.div key={b.id} {...stagger(i++)}>
          <EvCard id={b.id} now={now} />
        </motion.div>
      ))}

      {reminders.length > 0 && (
        <motion.section {...stagger(i++)} className="mt-3">
          <Title>{t.activity.reminders}</Title>
          <div className="space-y-2">
            {reminders.map((r) => (
              <ReminderRow key={r.id} id={r.id} venueId={r.venueId} at={r.at} />
            ))}
          </div>
        </motion.section>
      )}

      <motion.div {...stagger(i++)}>
        <ImpactCard history={history} now={now} />
      </motion.div>

      <motion.div {...stagger(i++)}>
        <PatternCard history={history} now={now} />
      </motion.div>

      {history.length > 0 && (
        <motion.section {...stagger(i++)} className="mt-5">
          <Title>{t.activity.history}</Title>
          <div className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-surface">
            {history.slice(0, 12).map((v) => (
              <HistoryRow key={v.id} v={v} />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  )
}

function Title({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{children}</h2>
}

function ParkedCard({ now }: { now: number }) {
  const t = useT()
  const spot = useApp((s) => s.parked)!
  const { open, notify } = useUi.getState()
  const venue = VENUE_BY_ID[spot.venueId]
  const elapsed = now - spot.at
  const cost = parkingCost(venue, elapsed / 3_600_000)
  const exitMin = Math.max(1, Math.round(1 + occupancyAt(venue, now) * 3))
  return (
    <section className="relative overflow-hidden rounded-[26px] bg-[#0f1311] p-4 text-white shadow-[0_24px_50px_-24px_rgb(0_0_0/0.7)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(90% 70% at 100% 0%, rgb(67 255 159 / 0.18), transparent 60%)' }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-led-lega uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-led-lega" /> {t.activity.parked}
          </div>
          <h3 className="mt-1 text-[20px] leading-tight font-extrabold">{venue.name}</h3>
          <p className="mt-0.5 text-[13px] text-white/60">
            {spot.level} · {t.park.zone} {spot.zone} · {t.park.pillar} {spot.zone}-{spot.pillar}
          </p>
        </div>
        <div className="text-right">
          <div className="font-led text-[30px] leading-none font-black text-led-lega tabular">{stopwatch(elapsed)}</div>
          <div className="mt-1.5 text-[12px] text-white/60">
            {t.activity.running} <span className="font-bold text-white">{formatRupiah(cost)}</span>
          </div>
        </div>
      </div>
      <div className="relative mt-3.5 flex items-center justify-between rounded-[14px] bg-white/6 px-3 py-2 text-[12px]">
        <span className="flex items-center gap-1.5 text-white/60">
          <Gauge size={15} /> {t.activity.exit}
        </span>
        <span className="font-semibold text-led-lega">{t.activity.exitSmooth(exitMin)}</span>
      </div>
      <div className="relative mt-3 grid grid-cols-[1.4fr_1fr] gap-2">
        <button
          type="button"
          onClick={() => open({ kind: 'find-car' })}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-brand-500 text-[13.5px] font-bold text-white"
        >
          <MapPin size={17} weight="fill" /> {t.park.findCar}
        </button>
        <button
          type="button"
          onClick={() =>
            shareSpot(`${venue.name}, ${spot.level} ${spot.zone}-${spot.pillar}, ${spot.lobby}`, () => notify(t.activity.shared))
          }
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 text-[13.5px] font-bold text-white"
        >
          <ShareNetwork size={17} weight="bold" /> {t.activity.share}
        </button>
      </div>
    </section>
  )
}

function EmptyParked() {
  const t = useT()
  const setTab = useUi((s) => s.setTab)
  return (
    <section className="flex items-center gap-3.5 rounded-[26px] border border-dashed border-line-strong p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink-3">
        <CarProfile size={24} />
      </span>
      <span className="flex-1">
        <span className="block text-[14.5px] font-bold">{t.activity.noParked}</span>
        <span className="text-[12.5px] leading-snug text-ink-3">{t.activity.noParkedHint}</span>
      </span>
      <Button size="sm" variant="secondary" onClick={() => setTab('explore')} aria-label={t.tabs.explore}>
        <Compass size={15} weight="bold" />
      </Button>
    </section>
  )
}

function PassCard({ passId, now }: { passId: string; now: number }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const pass = useApp((s) => s.passes.find((p) => p.id === passId))!
  const plate = useApp((s) => s.vehicle.plate)
  const open = useUi((s) => s.open)
  const venue = VENUE_BY_ID[pass.venueId]
  const gate = venue.gates.find((g) => g.id === pass.gateId)!
  const phase = passPhase(pass.windowStart, now)
  const end = pass.windowStart + 15 * 60_000
  return (
    <button
      type="button"
      onClick={() => open({ kind: 'pass', id: pass.id })}
      className="relative mt-3 block w-full overflow-hidden rounded-[26px] bg-gradient-to-br from-[#161b18] to-[#0b0e0d] p-4 text-left text-white"
    >
      <span aria-hidden="true" className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-canvas" />
      <span aria-hidden="true" className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-canvas" />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-led-lega uppercase">
            <Lightning size={12} weight="fill" /> {t.activity.passTitle}
          </div>
          <div className="mt-1 text-[17px] font-extrabold">
            {venue.name} · {gate.name}
          </div>
        </div>
        <Plate plate={plate} />
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-dashed border-white/15 pt-3">
        <div>
          <div className="text-[10px] font-bold tracking-[0.12em] text-white/45 uppercase">{t.activity.window}</div>
          <div className="font-mono text-[15px] font-bold tabular">
            {clock(pass.windowStart)}-{clock(end)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-[0.12em] text-white/45 uppercase">
            {phase === 'upcoming' ? t.activity.upcoming : t.activity.open}
          </div>
          <div className={clsx('font-mono text-[15px] font-bold tabular', phase === 'open' && 'text-led-lega')}>
            {dayDiff(now, pass.windowStart) > 0
              ? dayLabel(pass.windowStart, now)
              : stopwatch(phase === 'upcoming' ? pass.windowStart - now : end - now)}
          </div>
        </div>
        <span className="rounded-full bg-led-lega px-3 py-1.5 text-[12px] font-extrabold text-[#0c0f0d]">{t.activity.showQr}</span>
      </div>
    </button>
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
    <section className="mt-3 rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[14px] bg-ev/12 text-ev">
          <ChargingStation size={20} weight="fill" />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-bold">
            {t.activity.evTitle} · {b.charger}
          </span>
          <span className="text-[12px] text-ink-3 tabular">
            {venue.name} · {clock(b.start)}-{clock(end)} · {venue.ev.kw} kW
          </span>
        </span>
        {!charging && (
          <button type="button" onClick={() => cancel(b.id)} aria-label={t.activity.cancelPass} className="text-ink-3">
            <X size={16} weight="bold" />
          </button>
        )}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div className="h-full rounded-full bg-ev" initial={{ width: 0 }} animate={{ width: `${pct}%` }} />
      </div>
    </section>
  )
}

function ReminderRow({ id, venueId, at }: { id: string; venueId: keyof typeof VENUE_BY_ID; at: number }) {
  const t = useT()
  const remove = useApp((s) => s.removeReminder)
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
      <BellSimple size={18} weight="fill" className="text-brand-600" />
      <span className="flex-1 text-[13.5px] font-semibold">{t.activity.reminderAt(VENUE_BY_ID[venueId].name, clock(at))}</span>
      <button type="button" onClick={() => remove(id)} aria-label={t.common.cancel} className="text-ink-3">
        <X size={15} weight="bold" />
      </button>
    </div>
  )
}

function ImpactCard({ history, now }: { history: Visit[]; now: number }) {
  const t = useT()
  const vehicle = useApp((s) => s.vehicle)
  const open = useUi((s) => s.open)
  const month = history.filter((v) => now - v.at < 31 * 86_400_000)
  const total = sumImpact(month.map((v) => impactOf(v.minutesSaved, vehicle.isEV)))
  const max = Math.max(1, ...month.map((v) => v.minutesSaved))
  return (
    <section className="mt-5 rounded-[26px] border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold">{t.activity.impact}</h2>
        <button type="button" onClick={() => open({ kind: 'impact' })} className="text-[12px] font-semibold text-brand-700 dark:text-brand-300">
          {t.activity.impactHow}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label={t.activity.impactTime} value={total.minutes} unit={t.unit.min} />
        <Metric label={t.activity.impactFuel} value={total.fuelL} unit="L" decimals={2} />
        <Metric label={t.activity.impactCo2} value={total.co2Kg} unit="kg" decimals={2} />
      </div>
      {month.length > 0 && (
        <div className="mt-4 flex h-14 items-end gap-1.5" aria-hidden="true">
          {[...month].reverse().map((v, i) => (
            <motion.span
              key={v.id}
              className="flex-1 rounded-t-[4px] bg-brand-500/80"
              initial={{ height: 0 }}
              animate={{ height: `${(v.minutesSaved / max) * 100}%` }}
              transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 200, damping: 22 }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, unit, decimals = 0 }: { label: string; value: number; unit: string; decimals?: number }) {
  return (
    <div className="rounded-[16px] bg-surface-2 p-3">
      <div className="text-[11px] font-semibold text-ink-3">{label}</div>
      <div className="mt-1 text-[20px] leading-none font-extrabold tracking-tight">
        <CountUp value={value} decimals={decimals} />
        <span className="ml-0.5 text-[11px] font-bold text-ink-3">{unit}</span>
      </div>
    </div>
  )
}

/** Feature 11, personal pattern. Premium only, shown as a teaser on Free. */
function PatternCard({ history, now }: { history: Visit[]; now: number }) {
  const t = useT()
  const lang = useLang()
  const plan = useApp((s) => s.plan)
  const open = useUi((s) => s.open)
  if (history.length < 3) return null

  const counts = new Map<string, number>()
  history.forEach((v) => counts.set(v.venueId, (counts.get(v.venueId) ?? 0) + 1))
  const fav = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] as keyof typeof VENUE_BY_ID
  const venue = VENUE_BY_ID[fav]
  // Assume the habit is the weekend peak, the scenario most people describe.
  const sat = history.find((v) => wib(v.at).day === 6)?.at ?? now
  const series = forecastDay(venue, sat)
  const worst = series.filter((p) => p.hour >= 11 && p.hour <= 20).reduce((a, b) => (b.queueMin > a.queueMin ? b : a))
  const best = quietestHour(venue, sat)
  const diff = Math.max(1, Math.round(worst.queueMin - best.queueMin))
  const body = t.premium.patternBody(venue.name, dayName(sat, lang, false), hourLabel(worst.hour), hourLabel(best.hour), diff)

  return (
    <section className="relative mt-3 overflow-hidden rounded-[26px] border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">
        <Sparkle size={13} weight="fill" className="text-brand-500" /> {t.premium.pattern}
      </div>
      <p className={clsx('mt-2 text-[14px] leading-relaxed font-medium', plan !== 'premium' && 'blur-[5px] select-none')}>{body}</p>
      {plan !== 'premium' && (
        <div className="absolute inset-0 grid place-items-center bg-surface/40">
          <Button size="sm" variant="dark" onClick={() => open({ kind: 'premium' })}>
            <LockSimple size={14} weight="fill" /> {t.premium.locked}
          </Button>
        </div>
      )}
    </section>
  )
}

function HistoryRow({ v }: { v: Visit }) {
  const t = useT()
  const lang = useLang()
  const venue = VENUE_BY_ID[v.venueId]
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-surface-2 text-[11px] font-extrabold text-ink-2">
        {venue.short}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{venue.name}</span>
        <span className="text-[12px] text-ink-3">
          {shortDate(v.at, lang)}
          {v.divertedFrom ? ` · ${t.activity.diverted(VENUE_BY_ID[v.divertedFrom].name)}` : ''}
        </span>
      </span>
      {v.minutesSaved > 0 && (
        <span className="rounded-full bg-lega-soft px-2 py-1 text-[11px] font-bold text-lega-ink dark:bg-lega/15 dark:text-led-lega">
          {t.activity.saved(v.minutesSaved)}
        </span>
      )}
    </div>
  )
}
