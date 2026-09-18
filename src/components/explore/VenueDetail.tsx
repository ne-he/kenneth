import {
  ArrowLeft,
  Baby,
  BellSimple,
  CarProfile,
  ChargingStation,
  Clock,
  Database,
  Info,
  Lightning,
  MapPin,
  NavigationArrow,
  PersonSimpleWalk,
  ShieldCheck,
  Storefront,
  Ticket,
  Warning,
  Wheelchair,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { VENUES } from '../../data/venues'
import type { Venue } from '../../data/types'
import { checkGage } from '../../engine/gage'
import { nextRelief, reservedFree } from '../../engine/occupancy'
import { formatRupiah, parkingCost, priorityWorthIt } from '../../engine/pricing'
import { alternativesFor, type Ranked } from '../../engine/recommend'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { STATUS, formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { uid, useApp, type CommunityReport } from '../../store/app'
import { useUi } from '../../store/ui'
import { useNavigation } from '../nav/useNavigation'
import { Button } from '../ui/Button'
import { Stepper } from '../ui/Controls'
import { StatusBadge } from '../ui/Display'
import { LedBoard } from './LedBoard'
import { TimeScrubber } from './TimeScrubber'

export function VenueDetailHeader({ venue, snap, onBack }: { venue: Venue; snap?: Ranked; onBack: () => void }) {
  const t = useT()
  return (
    <div className="flex items-center gap-2 px-5 pb-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-[21px] leading-tight font-extrabold tracking-tight">{venue.name}</h2>
          {snap && <StatusBadge status={snap.status} className="shrink-0" />}
        </div>
        <div className="mt-1 flex items-center gap-1.5 overflow-hidden text-[12px] whitespace-nowrap text-ink-3">
          <span>{venue.district}</span>
          <span>·</span>
          <SourceChip venue={venue} />
          {snap && (
            <>
              <span>·</span>
              <span className="tabular">{formatKm(snap.travel.km)}</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        aria-label={t.common.close}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
      >
        <X size={15} weight="bold" />
      </button>
    </div>
  )
}

function SourceChip({ venue }: { venue: Venue }) {
  const t = useT()
  const palang = venue.source === 'palang'
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold',
        palang ? 'text-brand-700 dark:text-brand-300' : 'text-ramai-ink dark:text-led-ramai',
      )}
    >
      {palang ? <Database size={11} weight="fill" /> : <Info size={11} weight="fill" />}
      {palang ? t.source.palang : t.source.estimasi}
    </span>
  )
}

export function VenueDetail({ snap, ts, now, previewing }: { snap: Ranked; ts: number; now: number; previewing: boolean }) {
  const t = useT()
  const venue = snap.venue
  const nav = useNavigation()
  const open = useUi((s) => s.open)
  const select = useUi((s) => s.select)
  const notify = useUi((s) => s.notify)
  const vehicle = useApp((s) => s.vehicle)
  const reminders = useApp((s) => s.reminders)
  const addReminder = useApp((s) => s.addReminder)
  const [hours, setHours] = useState(3)

  const relief = !previewing ? nextRelief(venue, ts) : null
  const alts = snap.status !== 'lega' ? alternativesFor(venue, VENUES, ts) : []
  const priority = priorityWorthIt(snap.occ) && venue.gates.some((g) => g.priorityLane)
  const reminded = reminders.some((r) => r.venueId === venue.id)
  const gage = checkGage(venue, vehicle.plate, vehicle.isEV, ts)

  return (
    <div className="space-y-3 px-4 pb-8">
      <LedBoard snap={snap} />

      <div className="grid grid-cols-3 gap-2">
        <Stat label={t.venue.queueAtMain} value={formatMin(snap.queueMin)} unit={t.unit.min} tone={snap.queueMin >= 10 ? 'penuh' : snap.queueMin >= 5 ? 'ramai' : 'lega'} />
        <Stat label={t.venue.bestGate} value={formatMin(snap.bestGateQueueMin)} unit={t.unit.min} tone="lega" hint={snap.bestGate.name} />
        <Stat label={t.venue.cruise} value={formatMin(snap.cruiseMin)} unit={t.unit.min} tone={snap.cruiseMin >= 3 ? 'ramai' : 'lega'} />
      </div>

      <div className="grid grid-cols-[1.3fr_1fr] gap-2">
        <Button variant="primary" size="lg" onClick={() => nav.start(venue.id)}>
          <NavigationArrow size={18} weight="fill" />
          {t.venue.route}
          <span className="font-medium opacity-80 tabular">{Math.round(snap.travel.minutes)} {t.unit.min}</span>
        </Button>
        {priority ? (
          <Button variant="dark" size="lg" onClick={() => open({ kind: 'book', id: venue.id })}>
            <Ticket size={18} weight="fill" />
            {t.venue.book}
          </Button>
        ) : (
          <Button variant="secondary" size="lg" onClick={() => open({ kind: 'save-spot', id: venue.id })}>
            <CarProfile size={18} weight="fill" />
            {t.venue.parkHere}
          </Button>
        )}
      </div>

      {relief && (
        <div className="flex items-center gap-3 rounded-[20px] border border-line bg-surface-2 p-3">
          <Clock size={20} className="shrink-0 text-ink-2" />
          <span className="flex-1 text-[13px] leading-snug">{t.explore.relief(venue.name, clock(relief))}</span>
          <Button
            size="sm"
            variant={reminded ? 'secondary' : 'dark'}
            disabled={reminded}
            onClick={() => {
              addReminder({ id: uid(), venueId: venue.id, at: relief, createdAt: Date.now() })
              notify(t.explore.reminded)
            }}
          >
            <BellSimple size={14} weight="fill" />
            {reminded ? t.explore.remindSet : t.venue.remind}
          </Button>
        </div>
      )}

      {alts.length > 0 && (
        <Section title={t.venue.alternatives}>
          <div className="space-y-2">
            {alts.map((a) => (
              <button
                key={a.snap.venue.id}
                type="button"
                onClick={() => {
                  haptic('tap')
                  select(a.snap.venue.id)
                }}
                className="flex w-full items-center gap-3 rounded-[18px] border border-line bg-surface p-3 text-left transition-colors hover:bg-surface-2"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-[14px] text-[13px] font-extrabold text-white tabular"
                  style={{ background: STATUS[a.snap.status].hex }}
                >
                  {a.snap.pct}%
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold">{a.snap.venue.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                    {a.walk ? <PersonSimpleWalk size={13} /> : <MapPin size={13} />}
                    {a.walk ? t.venue.walk(a.walk.minutes, a.walk.via) : t.venue.drive(formatKm(a.km))}
                  </span>
                </span>
                <ArrowLeft size={15} className="rotate-180 text-ink-3" />
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title={t.venue.forecast} aside={t.venue.forecastHint}>
        <TimeScrubber venues={[venue]} now={now} compact />
      </Section>

      <Section title={t.venue.gates}>
        <div className="divide-y divide-line overflow-hidden rounded-[18px] border border-line">
          {snap.gates.map(({ gate, queueMin }, i) => (
            <div key={gate.id} className="flex items-center gap-3 bg-surface px-3.5 py-3">
              <span
                className={clsx(
                  'grid size-8 place-items-center rounded-full text-[12px] font-extrabold',
                  i === 0 ? 'bg-brand-600 text-white' : 'bg-surface-2 text-ink-2',
                )}
              >
                {gate.name.replace('Gerbang ', '')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13.5px] font-bold">
                  {gate.name}
                  {i === 0 && (
                    <span className="rounded-full bg-brand-50 px-1.5 py-[1px] text-[10px] font-bold text-brand-700 dark:bg-brand-400/15 dark:text-brand-300">
                      {t.venue.recommended}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                  {gate.hint}
                  {gate.priorityLane && (
                    <span className="flex items-center gap-0.5 font-semibold text-ink-2">
                      · <Lightning size={11} weight="fill" /> {t.venue.priorityLane}
                    </span>
                  )}
                </span>
              </span>
              <span className={clsx('text-[15px] font-extrabold tabular', STATUS[queueMin < 5 ? 'lega' : queueMin < 10 ? 'ramai' : 'penuh'].text)}>
                {formatMin(queueMin)} <span className="text-[11px] font-bold">{t.unit.min}</span>
              </span>
              <button
                type="button"
                aria-label={`${t.venue.route} ${gate.name}`}
                onClick={() => nav.start(venue.id, gate.id)}
                className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
              >
                <NavigationArrow size={14} weight="fill" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.venue.cost}>
        <div className="rounded-[18px] border border-line bg-surface p-3.5">
          <div className="flex items-center justify-between gap-3">
            <Stepper value={hours} onChange={setHours} min={1} max={10} label={t.venue.cost} format={(v) => t.venue.stay(v)} />
            <motion.span key={hours} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[22px] font-extrabold tracking-tight tabular">
              {formatRupiah(parkingCost(venue, hours))}
            </motion.span>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-snug text-ink-3">
            {t.venue.tariff(formatRupiah(venue.tariff.firstHour), formatRupiah(venue.tariff.nextHour))}. {t.venue.tariffNote}
          </p>
        </div>
      </Section>

      <Section title={t.venue.special}>
        <div className="grid grid-cols-2 gap-2">
          <Reserved icon={<Wheelchair size={18} weight="fill" />} label={t.venue.difabel} free={reservedFree(venue.accessible.difabel, snap.occ, venue.id + 'd', ts)} total={venue.accessible.difabel} />
          <Reserved icon={<Baby size={18} weight="fill" />} label={t.venue.ibuHamil} free={reservedFree(venue.accessible.ibuHamil, snap.occ, venue.id + 'h', ts)} total={venue.accessible.ibuHamil} />
        </div>
      </Section>

      <Section title={t.venue.ev}>
        <div className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
          <span className="grid size-10 place-items-center rounded-[14px] bg-ev/12 text-ev">
            <ChargingStation size={20} weight="fill" />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold tabular">
              {reservedFree(venue.ev.chargers, snap.occ * 0.9, venue.id + 'e', ts)}/{venue.ev.chargers} {t.venue.available}
            </span>
            <span className="text-[12px] text-ink-3">{t.venue.evDetail(venue.ev.chargers, venue.ev.kw)}</span>
          </span>
          <Button size="sm" variant="secondary" onClick={() => open({ kind: 'ev', id: venue.id })}>
            {t.venue.bookEv}
          </Button>
        </div>
      </Section>

      <GageRow verdict={gage} />

      <Section title={t.venue.tenants}>
        <div className="divide-y divide-line overflow-hidden rounded-[18px] border border-line">
          {venue.tenants.map((ten) => (
            <div key={ten.name} className="flex items-center gap-3 bg-surface px-3.5 py-3">
              <Storefront size={18} className="shrink-0 text-ink-3" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold">{ten.name}</span>
                <span className="text-[11.5px] text-ink-3">{t.venue.tenantRoute(ten.lift, ten.floor)}</span>
              </span>
              <span className="flex items-center gap-1 text-[12.5px] font-bold text-ink-2 tabular">
                <PersonSimpleWalk size={14} /> {ten.walkMin} {t.unit.min}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <ReportBar venue={venue} now={now} />

      <p className="flex gap-2 rounded-[16px] bg-surface-2 p-3 text-[11.5px] leading-snug text-ink-3">
        <Info size={15} className="mt-[1px] shrink-0" />
        <span>
          {venue.source === 'palang' ? t.source.palangNote : t.source.estimasiNote} {t.source.prototype}
        </span>
      </p>
    </div>
  )
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="pt-2">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{title}</h3>
        {aside && <span className="text-[10.5px] text-ink-3">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, unit, tone, hint }: { label: string; value: string; unit: string; tone: 'lega' | 'ramai' | 'penuh'; hint?: string }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-3">
      <div className="text-[10.5px] leading-tight font-semibold text-ink-3">{label}</div>
      <div className={clsx('mt-1.5 text-[22px] leading-none font-extrabold tracking-tight tabular', STATUS[tone].text)}>
        {value}
        <span className="ml-0.5 text-[11px] font-bold">{unit}</span>
      </div>
      {hint && <div className="mt-1 text-[10.5px] font-semibold text-ink-2">{hint}</div>}
    </div>
  )
}

function Reserved({ icon, label, free, total }: { icon: ReactNode; label: string; free: number; total: number }) {
  const t = useT()
  const tone = free === 0 ? 'penuh' : free <= Math.ceil(total * 0.25) ? 'ramai' : 'lega'
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] border border-line bg-surface p-3">
      <span className="grid size-9 place-items-center rounded-[12px] bg-signal/10 text-signal">{icon}</span>
      <span>
        <span className={clsx('block text-[16px] leading-none font-extrabold tabular', STATUS[tone].text)}>
          {free}
          <span className="text-[11px] font-bold text-ink-3">/{total}</span>
        </span>
        <span className="mt-1 block text-[11.5px] text-ink-3">
          {label} {t.venue.available}
        </span>
      </span>
    </div>
  )
}

function GageRow({ verdict }: { verdict: ReturnType<typeof checkGage> }) {
  const t = useT()
  const setTab = useUi((s) => s.setTab)
  let text = ''
  let bad = false
  switch (verdict.kind) {
    case 'not-applicable':
      text = verdict.reason === 'weekend' ? t.venue.gageWeekend : verdict.reason === 'hours' ? t.venue.gageHours : t.venue.gageNA
      break
    case 'exempt':
      text = t.venue.gageExempt
      break
    case 'ok':
      text = t.venue.gageOk(verdict.parity)
      break
    case 'blocked':
      text = t.venue.gageBlocked(verdict.parity)
      bad = true
      break
    case 'unknown':
      text = t.venue.gageUnknown
      break
  }
  return (
    <button
      type="button"
      onClick={() => verdict.kind === 'unknown' && setTab('profile')}
      className={clsx(
        'flex w-full items-center gap-3 rounded-[18px] border p-3.5 text-left',
        bad ? 'border-penuh/30 bg-penuh-soft dark:bg-penuh/10' : 'border-line bg-surface',
      )}
    >
      {bad ? <Warning size={19} weight="fill" className="text-penuh" /> : <ShieldCheck size={19} weight="fill" className="text-brand-600 dark:text-brand-400" />}
      <span className="flex-1">
        <span className="block text-[11px] font-bold tracking-[0.12em] text-ink-3 uppercase">{t.venue.gage}</span>
        <span className="text-[13.5px] font-semibold">{text}</span>
      </span>
    </button>
  )
}

function ReportBar({ venue, now }: { venue: Venue; now: number }) {
  const t = useT()
  const reports = useApp((s) => s.reports)
  const addReport = useApp((s) => s.addReport)
  const notify = useUi((s) => s.notify)
  const recent = reports.filter((r) => r.venueId === venue.id && now - r.at < 3_600_000).length
  const send = (kind: CommunityReport['kind']) => {
    haptic('success')
    addReport({ venueId: venue.id, kind, at: now })
    notify(t.venue.reportThanks)
  }
  const chip = 'h-9 flex-1 rounded-full border border-line bg-surface text-[12.5px] font-semibold transition-colors hover:bg-surface-2 active:scale-[0.97]'
  return (
    <section className="rounded-[20px] border border-dashed border-line-strong p-3.5">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="text-[13.5px] font-bold">{t.venue.report}</span>
        {recent > 0 && <span className="text-[11px] text-ink-3">{t.venue.reportsRecent(recent)}</span>}
      </div>
      <div className="flex gap-2">
        <button type="button" className={chip} onClick={() => send('penuh')}>
          {t.venue.reportPenuh}
        </button>
        <button type="button" className={chip} onClick={() => send('antri')}>
          {t.venue.reportAntri}
        </button>
        <button type="button" className={chip} onClick={() => send('lega')}>
          {t.venue.reportLega}
        </button>
      </div>
    </section>
  )
}
