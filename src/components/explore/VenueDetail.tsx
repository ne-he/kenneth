import {
  CarProfile,
  ChargingStation,
  Crown,
  CurrencyCircleDollar,
  Database,
  DoorOpen,
  Info,
  Key,
  ListBullets,
  Megaphone,
  NavigationArrow,
  PersonSimpleWalk,
  ShieldCheck,
  Star,
  Storefront,
  Warning,
  Wheelchair,
  X,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { VENUES } from '../../data/venues'
import type { Venue } from '../../data/types'
import { checkGage } from '../../engine/gage'
import { pinFact } from '../../engine/modes'
import { forKind, reservedFree } from '../../engine/occupancy'
import { formatRupiah, parkingCost } from '../../engine/pricing'
import { alternativesFor, type Ranked } from '../../engine/recommend'
import { servicesFor } from '../../engine/services'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { shareReport, sharedAvailable } from '../../lib/shared'
import { STATUS, formatMin } from '../../lib/status'
import { useApp, useVehicle, type CommunityReport } from '../../store/app'
import { useRealNow, useViewTs } from '../../store/clock'
import { useSharedReports } from '../../store/shared'
import { useUi } from '../../store/ui'
import { useNavigation } from '../nav/useNavigation'
import { Stepper } from '../ui/Controls'
import { Disclosure, Label, List, StatusPill } from '../ui/Kit'
import { buttonClass } from '../ui/buttonStyles'
import { PlaceCard } from './PlaceCard'
import { SlotsLeft } from './SlotsLeft'
import { TimeScrubber } from './TimeScrubber'

export function VenueDetailHeader({ venue, snap, onBack }: { venue: Venue; snap?: Ranked; onBack: () => void }) {
  const t = useT()
  const fav = useApp((s) => s.favorites.includes(venue.id))
  const toggleFavorite = useApp((s) => s.toggleFavorite)
  const notify = useUi((s) => s.notify)
  return (
    <div className="px-5 pt-1 pb-4">
      {/* The round buttons pull in a little so the title row stays as tall as the name. */}
      <div className="flex items-center gap-1.5">
        <h2 className="min-w-0 flex-1 truncate text-[21px] leading-tight font-semibold tracking-tight">{venue.name}</h2>
        <button
          type="button"
          aria-pressed={fav}
          aria-label={t.venue.favorite}
          onClick={() => {
            haptic(fav ? 'tap' : 'success')
            toggleFavorite(venue.id)
            notify(fav ? t.venue.unfavorited : t.venue.favorited)
          }}
          className={clsx('-my-1 grid size-9 shrink-0 place-items-center rounded-full transition-colors', fav ? 'text-ink' : 'text-ink-3 hover:text-ink')}
        >
          <Star size={18} weight={fav ? 'fill' : 'regular'} />
        </button>
        <button
          type="button"
          onClick={onBack}
          aria-label={t.common.close}
          className="-my-1 grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
        >
          <X size={15} weight="bold" />
        </button>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3 text-[13px] text-ink-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
          <span>{t.venue.category[venue.category]}</span>
          <span>·</span>
          <SourceChip venue={venue} />
          {snap && (
            <>
              <span>·</span>
              <span className="tabular">{snap.travel.km < 0.15 ? t.explore.here : formatKm(snap.travel.km)}</span>
            </>
          )}
        </div>
        {snap && <HeaderFact snap={snap} />}
      </div>
    </div>
  )
}

/**
 * The number the mode is about, at the right end of the header: how full when
 * just parking, otherwise the bay price, the minutes until the car is back, or
 * the free chargers. The same number the row in the list showed before the tap.
 */
function HeaderFact({ snap }: { snap: Ranked }) {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const plan = useApp((s) => s.plan)
  const vehicle = useVehicle()
  const { ts } = useViewTs()
  const fact = pinFact(snap, mode, vehicle.kind, plan, ts)
  const icon = 'shrink-0 self-center'
  const word = 'text-[12.5px] font-medium text-ink-3'
  let body
  switch (fact.kind) {
    case 'price':
      body = (
        <>
          <Crown size={12} weight="fill" className={clsx(icon, 'text-brand-600 dark:text-brand-300')} />
          {fact.left > 0 ? formatRupiah(fact.price, true) : <span className="text-[13px] text-penuh-ink dark:text-led-penuh">{t.modes.soldOut}</span>}
        </>
      )
      break
    case 'wait':
      body = (
        <>
          <Key size={12} weight="fill" className={clsx(icon, 'text-ink-3')} />
          {fact.min}
          <span className={word}>{t.unit.min}</span>
        </>
      )
      break
    case 'chargers':
      body = (
        <>
          <ChargingStation size={12} weight="fill" className={clsx(icon, 'text-ev')} />
          {t.modes.free(fact.free, fact.total)}
          <span className={word}>{t.card.evFree.toLowerCase()}</span>
        </>
      )
      break
    default:
      // Plain parking, or a service this place does not sell: how full it is, dot in the status color.
      body = (
        <>
          <span className={clsx(icon, 'size-2 rounded-full', STATUS[snap.status].dot)} aria-hidden="true" />
          {snap.pct}%<span className={word}>{t.status[snap.status]}</span>
        </>
      )
  }
  return <span className="flex shrink-0 items-baseline gap-1 text-[15px] font-semibold tracking-tight text-ink tabular">{body}</span>
}

/** Where the numbers come from. Always shown; yellow stays reserved for "Ramai", so an estimate reads in ink. */
function SourceChip({ venue }: { venue: Venue }) {
  const t = useT()
  const palang = venue.source === 'palang'
  return (
    <span className={clsx('inline-flex items-center gap-1 font-medium', palang ? 'text-brand-700 dark:text-brand-300' : 'text-ink-2')}>
      {palang ? <Database size={11} weight="fill" /> : <Info size={11} weight="fill" />}
      {palang ? t.source.palang : t.source.estimasi}
    </span>
  )
}

export function VenueDetail({ snap, ts, now, previewing }: { snap: Ranked; ts: number; now: number; previewing: boolean }) {
  const t = useT()
  const venue = snap.venue
  const select = useUi((s) => s.select)
  const mode = useUi((s) => s.mode)
  const vehicle = useVehicle()

  const pool = useMemo(() => VENUES.map((v) => forKind(v, vehicle.kind)), [vehicle.kind])
  // In park mode the card above already suggests the first one, so the list starts after it.
  const alts = snap.status !== 'lega' ? alternativesFor(venue, pool, ts).slice(mode === 'park' ? 1 : 0) : []
  const services = servicesFor(venue, vehicle.kind)
  // Odd-even only matters on a corridor route. A plate that is blocked today is a warning, so it stays in view.
  const gage = vehicle.kind === 'mobil' && venue.gageCorridor ? checkGage(venue, vehicle.plate, vehicle.isEV, ts) : null
  const blocked = gage?.kind === 'blocked'
  const unit = vehicle.kind === 'motor' ? t.unit.motorSlots : t.unit.slots

  return (
    <div className="px-4 pb-10">
      <PlaceCard snap={snap} ts={ts} previewing={previewing} />

      {/*
        Below the card: how the day goes here, places to try instead, then the
        rest behind one row (UX audit #5), and the report, which people use on
        the spot.
      */}
      <div className="mt-6 space-y-8">
        <section className="border-t border-line px-1 pt-5">
          <TimeScrubber venues={[venue]} now={now} title={t.venue.forecast} />
        </section>

        {alts.length > 0 && (
          <section>
            <Label>{t.venue.alternatives}</Label>
            <List plain>
              {alts.map((a) => (
                <button
                  key={a.snap.venue.id}
                  type="button"
                  onClick={() => {
                    haptic('tap')
                    select(a.snap.venue.id)
                  }}
                  className="flex w-full items-center gap-3 px-1 py-3.5 text-left transition-opacity hover:opacity-80"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium">{a.snap.venue.name}</span>
                    <span className="mt-0.5 flex items-start gap-1 text-[12.5px] leading-snug text-ink-3">
                      {a.walk ? <PersonSimpleWalk size={13} className="mt-px shrink-0" /> : <CarProfile size={13} className="mt-px shrink-0" />}
                      <span className="line-clamp-2">{a.walk ? t.venue.walk(a.walk.minutes, a.walk.via) : t.venue.drive(formatKm(a.km))}</span>
                    </span>
                  </span>
                  <StatusPill status={a.snap.status} pct={a.snap.pct} label={t.status[a.snap.status]} />
                </button>
              ))}
            </List>
          </section>
        )}

        <List plain>
          {blocked && <GageRow venue={venue} ts={ts} />}
          <Disclosure
            icon={<ListBullets size={17} />}
            title={t.venue.details}
            summary={t.venue.detailsSummary(snap.free.toLocaleString('id-ID'), unit, formatRupiah(venue.tariff.firstHour, true))}
          >
            <div className="pt-1">
              <SlotsLeft snap={snap} kind={vehicle.kind} source={<SourceChip venue={venue} />} />
            </div>
            <List plain className="mt-4">
              <GatesRow snap={snap} />
              <CostRow venue={venue} />
              {/* Which services this place sells is the chip row at the top of the card, so no row repeats it. */}
              <SpecialRow venue={venue} snap={snap} ts={ts} />
              {gage && !blocked && <GageRow venue={venue} ts={ts} />}
              {venue.tenants.length > 0 && <TenantsRow venue={venue} />}
            </List>
            <p className="mt-4 flex gap-2 text-[11.5px] leading-snug text-ink-3">
              <Info size={14} className="mt-[1px] shrink-0" />
              <span>
                {venue.source === 'palang' ? t.source.palangNote : t.source.estimasiNote} {t.source.prototype}
              </span>
            </p>
          </Disclosure>
          <ReportRow venue={venue} now={now} />
        </List>

        {services.length === 0 && (
          <p className="px-2 text-center text-[12.5px] leading-snug text-ink-3">{vehicle.kind === 'motor' ? t.venue.motorNoBook : t.venue.noBook}</p>
        )}
      </div>
    </div>
  )
}

function GatesRow({ snap }: { snap: Ranked }) {
  const t = useT()
  const nav = useNavigation()
  return (
    <Disclosure
      icon={<DoorOpen size={17} />}
      title={t.venue.gates}
      summary={gateSpread(t, snap.gates.map((g) => g.queueMin))}
    >
      <div className="divide-y divide-line">
        {snap.gates.map(({ gate, queueMin }, i) => (
          <div key={gate.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2 text-[13.5px] font-medium">
                {gate.name}
                {i === 0 && <span className="text-[11.5px] font-medium text-brand-600 dark:text-brand-300">{t.venue.recommended}</span>}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-3">
                {gate.hint}
                {gate.zoneLane ? ` · ${t.venue.zoneLane}` : ''}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[14px] font-semibold tabular">
              <span className={clsx('size-2 rounded-full', STATUS[queueMin < 5 ? 'lega' : queueMin < 10 ? 'ramai' : 'penuh'].dot)} aria-hidden="true" />
              {formatMin(queueMin)} {t.unit.min}
            </span>
            <button
              type="button"
              aria-label={`${t.venue.actions.route} ${gate.name}`}
              onClick={() => nav.start(snap.venue.id, gate.id)}
              className="grid size-8 place-items-center rounded-full border border-line-strong text-ink-2 transition-colors hover:text-ink"
            >
              <NavigationArrow size={14} weight="fill" />
            </button>
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

/**
 * The card above already names the best gate, so the summary gives the spread:
 * "semua lancar" when every gate is quick, never a range like "<1-1".
 */
function gateSpread(t: ReturnType<typeof useT>, queues: number[]) {
  const n = queues.length
  const lo = Math.min(...queues)
  const hi = Math.max(...queues)
  if (hi < 3) return t.venue.gatesCalm(n)
  if (lo < 1) return t.venue.gatesUpTo(n, formatMin(hi))
  return t.venue.gatesRange(n, formatMin(lo), formatMin(hi))
}

function CostRow({ venue }: { venue: Venue }) {
  const t = useT()
  const [hours, setHours] = useState(3)
  return (
    <Disclosure
      icon={<CurrencyCircleDollar size={17} />}
      title={t.venue.cost}
      summary={t.venue.costSummary(formatRupiah(venue.tariff.firstHour, true))}
    >
      <div className="flex items-center justify-between gap-3">
        <Stepper value={hours} onChange={setHours} min={1} max={10} label={t.venue.cost} format={(v) => t.venue.stay(v)} />
        <motion.span key={hours} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[20px] font-semibold tracking-tight tabular">
          {formatRupiah(parkingCost(venue, hours))}
        </motion.span>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink-3">
        {t.venue.tariff(formatRupiah(venue.tariff.firstHour), formatRupiah(venue.tariff.nextHour))}. {t.venue.tariffNote}
      </p>
    </Disclosure>
  )
}

function SpecialRow({ venue, snap, ts }: { venue: Venue; snap: Ranked; ts: number }) {
  const t = useT()
  const d = reservedFree(venue.accessible.difabel, snap.occ, venue.id + 'd', ts)
  const h = reservedFree(venue.accessible.ibuHamil, snap.occ, venue.id + 'h', ts)
  return (
    <Disclosure icon={<Wheelchair size={17} />} title={t.venue.special} summary={t.venue.specialSummary(d, h)}>
      <div className="grid grid-cols-2 divide-x divide-line">
        <Reserved label={t.venue.difabel} free={d} total={venue.accessible.difabel} />
        <Reserved label={t.venue.ibuHamil} free={h} total={venue.accessible.ibuHamil} />
      </div>
    </Disclosure>
  )
}

function Reserved({ label, free, total }: { label: string; free: number; total: number }) {
  const t = useT()
  const tone = free === 0 ? 'penuh' : free <= Math.ceil(total * 0.25) ? 'ramai' : 'lega'
  return (
    <div className="first:pr-4 last:pl-4">
      <span className="flex items-center gap-1.5 text-[18px] leading-none font-semibold tabular">
        <span className={clsx('size-2 rounded-full', STATUS[tone].dot)} aria-hidden="true" />
        {free}
        <span className="text-[11.5px] font-medium text-ink-3">/{total}</span>
      </span>
      <span className="mt-1.5 block text-[12px] text-ink-3">
        {label} {t.venue.available}
      </span>
    </div>
  )
}

function GageRow({ venue, ts }: { venue: Venue; ts: number }) {
  const t = useT()
  const open = useUi((s) => s.open)
  const vehicle = useVehicle()
  const verdict = checkGage(venue, vehicle.plate, vehicle.isEV, ts)
  let text = ''
  let bad = false
  switch (verdict.kind) {
    case 'not-applicable':
      text =
        verdict.reason === 'weekend'
          ? t.venue.gageWeekend
          : verdict.reason === 'holiday'
            ? t.venue.gageHoliday
            : verdict.reason === 'hours'
              ? t.venue.gageHours
              : t.venue.gageNA
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
    <Disclosure
      icon={bad ? <Warning size={17} weight="fill" className="text-penuh" /> : <ShieldCheck size={17} />}
      title={t.venue.gage}
      summary={text}
      tone={bad ? 'penuh' : undefined}
    >
      <p className="text-[12.5px] leading-relaxed text-ink-2">{t.venue.gageRule}</p>
      {verdict.kind === 'unknown' && (
        <button
          type="button"
          onClick={() => open({ kind: 'vehicle' })}
          className={clsx(buttonClass('primary', 'sm'), 'mt-3')}
        >
          {t.venue.gageFill}
        </button>
      )}
    </Disclosure>
  )
}

function TenantsRow({ venue }: { venue: Venue }) {
  const t = useT()
  return (
    <Disclosure icon={<Storefront size={17} />} title={t.venue.tenants} summary={venue.tenants.map((x) => x.name).join(', ')}>
      <div className="divide-y divide-line">
        {venue.tenants.map((ten) => (
          <div key={ten.name} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium">{ten.name}</span>
              <span className="text-[12px] text-ink-3">{t.venue.tenantRoute(ten.lift, ten.floor)}</span>
            </span>
            <span className="flex items-center gap-1 text-[12.5px] font-medium text-ink-2 tabular">
              <PersonSimpleWalk size={14} /> {ten.walkMin} {t.unit.min}
            </span>
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

const HOUR = 3_600_000
/** One report per place every 10 minutes from a phone, so one excited thumb cannot fill the count. */
const REPORT_GAP = 10 * 60_000

function ReportRow({ venue, now }: { venue: Venue; now: number }) {
  const t = useT()
  const reports = useApp((s) => s.reports)
  const addReport = useApp((s) => s.addReport)
  const notify = useUi((s) => s.notify)
  const everyone = useSharedReports()
  const realNow = useRealNow()
  // Everyone's reports when this build shares them (stamped with the real time), otherwise this phone's own.
  const recent = everyone
    ? everyone.filter((r) => r.venueId === venue.id && realNow - r.at < HOUR)
    : reports.filter((r) => r.venueId === venue.id && now - r.at < HOUR)
  const mine = reports.find((r) => r.venueId === venue.id && Math.abs(now - r.at) < REPORT_GAP)
  const send = (kind: CommunityReport['kind']) => {
    if (mine) {
      notify(t.venue.reportWait(Math.min(10, Math.max(1, Math.ceil((REPORT_GAP - Math.abs(now - mine.at)) / 60_000)))))
      return
    }
    haptic('success')
    addReport({ venueId: venue.id, kind, at: now })
    if (sharedAvailable) shareReport(venue.id, kind).catch(() => undefined)
    notify(t.venue.reportThanks)
  }
  const chip = 'btn-tile flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border text-[12.5px] font-medium tracking-[-0.01em] transition-colors duration-150 active:scale-[0.98]'
  const kinds: [CommunityReport['kind'], string][] = [
    ['penuh', t.venue.reportPenuh],
    ['antri', t.venue.reportAntri],
    ['lega', t.venue.reportLega],
  ]
  return (
    <Disclosure
      icon={<Megaphone size={17} />}
      title={t.venue.report}
      summary={recent.length > 0 ? t.venue.reportsRecent(recent.length) : t.venue.reportHint}
    >
      <div className="flex gap-2">
        {kinds.map(([kind, label]) => {
          const n = recent.filter((r) => r.kind === kind).length
          const picked = mine?.kind === kind
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={picked}
              className={clsx(
                chip,
                picked
                  ? 'border-brand-500 text-brand-700 dark:border-brand-400 dark:text-brand-200'
                  : 'border-line text-ink-2 hover:border-line-strong hover:text-ink',
              )}
              onClick={() => send(kind)}
            >
              {label}
              {n > 0 && <span className="tabular font-semibold text-ink-3">{n}</span>}
            </button>
          )
        })}
      </div>
    </Disclosure>
  )
}
