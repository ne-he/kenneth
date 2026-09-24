import {
  CarProfile,
  CurrencyCircleDollar,
  Database,
  DoorOpen,
  Info,
  Megaphone,
  NavigationArrow,
  PersonSimpleWalk,
  ShieldCheck,
  Sparkle,
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
import { forKind, reservedFree } from '../../engine/occupancy'
import { formatRupiah, parkingCost } from '../../engine/pricing'
import { alternativesFor, type Ranked } from '../../engine/recommend'
import { servicesFor, type Service } from '../../engine/services'
import { dropQueueMin, retrievalMin } from '../../engine/valet'
import { baysLeft, zoneOf } from '../../engine/zone'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { STATUS, formatMin } from '../../lib/status'
import { useApp, useVehicle, type CommunityReport } from '../../store/app'
import { useUi } from '../../store/ui'
import { useNavigation } from '../nav/useNavigation'
import { Stepper } from '../ui/Controls'
import { Disclosure, Label, List, StatusPill, VenueGlyph } from '../ui/Kit'
import { LedBoard } from './LedBoard'
import { PlaceCard } from './PlaceCard'
import { TimeScrubber } from './TimeScrubber'

export function VenueDetailHeader({ venue, snap, onBack }: { venue: Venue; snap?: Ranked; onBack: () => void }) {
  const t = useT()
  const fav = useApp((s) => s.favorites.includes(venue.id))
  const toggleFavorite = useApp((s) => s.toggleFavorite)
  const notify = useUi((s) => s.notify)
  return (
    <div className="flex items-center gap-3 px-5 pb-3">
      <VenueGlyph category={venue.category} size={42} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[19px] leading-tight font-bold tracking-tight">{venue.name}</h2>
        <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden text-[12.5px] whitespace-nowrap text-ink-3">
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
      </div>
      <button
        type="button"
        aria-pressed={fav}
        aria-label={t.venue.favorite}
        onClick={() => {
          haptic(fav ? 'tap' : 'success')
          toggleFavorite(venue.id)
          notify(fav ? t.venue.unfavorited : t.venue.favorited)
        }}
        className={clsx(
          'grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 transition-colors',
          fav ? 'text-ramai' : 'text-ink-3 hover:text-ink',
        )}
      >
        <Star size={16} weight={fav ? 'fill' : 'bold'} />
      </button>
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
  const select = useUi((s) => s.select)
  const vehicle = useVehicle()

  const pool = useMemo(() => VENUES.map((v) => forKind(v, vehicle.kind)), [vehicle.kind])
  const alts = snap.status !== 'lega' ? alternativesFor(venue, pool, ts) : []
  const services = servicesFor(venue, vehicle.kind)

  return (
    <div className="px-4 pb-10">
      <PlaceCard snap={snap} ts={ts} previewing={previewing} />

      {/* Below the fold: shows when the sheet is pulled up. */}
      <div className="mt-5 space-y-5">
        <LedBoard snap={snap} kind={vehicle.kind} />

        {alts.length > 0 && (
          <section>
            <Label>{t.venue.alternatives}</Label>
            <List>
              {alts.map((a) => (
                <button
                  key={a.snap.venue.id}
                  type="button"
                  onClick={() => {
                    haptic('tap')
                    select(a.snap.venue.id)
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-2/60"
                >
                  <VenueGlyph category={a.snap.venue.category} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{a.snap.venue.name}</span>
                    <span className="mt-0.5 flex items-start gap-1 text-[12px] leading-snug text-ink-3">
                      {a.walk ? <PersonSimpleWalk size={13} className="mt-px shrink-0" /> : <CarProfile size={13} className="mt-px shrink-0" />}
                      <span className="line-clamp-2">{a.walk ? t.venue.walk(a.walk.minutes, a.walk.via) : t.venue.drive(formatKm(a.km))}</span>
                    </span>
                  </span>
                  <StatusPill status={a.snap.status} pct={a.snap.pct} />
                </button>
              ))}
            </List>
          </section>
        )}

        <section className="rounded-[18px] border border-line bg-surface p-3.5">
          <TimeScrubber venues={[venue]} now={now} title={t.venue.forecast} />
        </section>

        <List>
          <GatesRow snap={snap} />
          <CostRow venue={venue} />
          {services.length > 0 && <ServicesRow venue={venue} snap={snap} services={services} ts={ts} />}
          <SpecialRow venue={venue} snap={snap} ts={ts} />
          {vehicle.kind === 'mobil' && <GageRow venue={venue} ts={ts} />}
          {venue.tenants.length > 0 && <TenantsRow venue={venue} />}
          <ReportRow venue={venue} now={now} />
        </List>

        {services.length === 0 && (
          <p className="px-2 text-center text-[12.5px] leading-snug text-ink-3">{vehicle.kind === 'motor' ? t.venue.motorNoBook : t.venue.noBook}</p>
        )}

        <p className="flex gap-2 px-1 text-[11.5px] leading-snug text-ink-3">
          <Info size={14} className="mt-[1px] shrink-0" />
          <span>
            {venue.source === 'palang' ? t.source.palangNote : t.source.estimasiNote} {t.source.prototype}
          </span>
        </p>
      </div>
    </div>
  )
}

function GatesRow({ snap }: { snap: Ranked }) {
  const t = useT()
  const nav = useNavigation()
  return (
    <Disclosure
      icon={<DoorOpen size={17} weight="fill" />}
      title={t.venue.gates}
      summary={t.venue.gatesSummary(snap.bestGate.name, formatMin(snap.bestGateQueueMin))}
    >
      <div className="divide-y divide-line">
        {snap.gates.map(({ gate, queueMin }, i) => (
          <div key={gate.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                {gate.name}
                {i === 0 && <span className="text-[11px] font-bold text-brand-700 dark:text-brand-300">{t.venue.recommended}</span>}
              </span>
              <span className="mt-0.5 block text-[12px] text-ink-3">
                {gate.hint}
                {gate.priorityLane ? ` · ${t.venue.priorityLane}` : ''}
              </span>
            </span>
            <span className={clsx('text-[14px] font-bold tabular', STATUS[queueMin < 5 ? 'lega' : queueMin < 10 ? 'ramai' : 'penuh'].text)}>
              {formatMin(queueMin)} {t.unit.min}
            </span>
            <button
              type="button"
              aria-label={`${t.venue.actions.route} ${gate.name}`}
              onClick={() => nav.start(snap.venue.id, gate.id)}
              className="grid size-8 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
            >
              <NavigationArrow size={14} weight="fill" />
            </button>
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

function CostRow({ venue }: { venue: Venue }) {
  const t = useT()
  const [hours, setHours] = useState(3)
  return (
    <Disclosure
      icon={<CurrencyCircleDollar size={17} weight="fill" />}
      title={t.venue.cost}
      summary={t.venue.costSummary(formatRupiah(venue.tariff.firstHour, true))}
    >
      <div className="flex items-center justify-between gap-3">
        <Stepper value={hours} onChange={setHours} min={1} max={10} label={t.venue.cost} format={(v) => t.venue.stay(v)} />
        <motion.span key={hours} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[20px] font-bold tracking-tight tabular">
          {formatRupiah(parkingCost(venue, hours))}
        </motion.span>
      </div>
      <p className="mt-2.5 text-[12px] leading-snug text-ink-3">
        {t.venue.tariff(formatRupiah(venue.tariff.firstHour), formatRupiah(venue.tariff.nextHour))}. {t.venue.tariffNote}
      </p>
    </Disclosure>
  )
}

function ServicesRow({ venue, snap, services, ts }: { venue: Venue; snap: Ranked; services: Service[]; ts: number }) {
  const t = useT()
  const open = useUi((s) => s.open)
  const zone = zoneOf(venue)
  const detail: Record<Service, string> = {
    priority: zone ? t.venue.priorityDetail(baysLeft(venue, ts, snap.occ), zone.bays, zone.level) : '',
    valet: venue.valet ? t.venue.valetDetail(formatRupiah(venue.valet.price, true), dropQueueMin(snap.occ), retrievalMin(snap.occ)) : '',
    ev: t.venue.evDetail(reservedFree(venue.ev.chargers, snap.occ * 0.9, venue.id + 'e', ts), venue.ev.chargers, venue.ev.kw),
  }
  return (
    <Disclosure
      icon={<Sparkle size={17} weight="fill" />}
      title={t.venue.services}
      summary={services.map((s) => t.book.services[s]).join(' · ')}
    >
      <div className="divide-y divide-line">
        {services.map((s) => (
          <div key={s} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">{t.book.services[s]}</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{detail[s]}</span>
            </span>
            <button
              type="button"
              onClick={() => open({ kind: 'book', id: venue.id, service: s })}
              className="h-8 shrink-0 rounded-full bg-ink px-3.5 text-[12.5px] font-bold text-canvas"
            >
              {t.venue.actions.book}
            </button>
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

function SpecialRow({ venue, snap, ts }: { venue: Venue; snap: Ranked; ts: number }) {
  const t = useT()
  const d = reservedFree(venue.accessible.difabel, snap.occ, venue.id + 'd', ts)
  const h = reservedFree(venue.accessible.ibuHamil, snap.occ, venue.id + 'h', ts)
  return (
    <Disclosure icon={<Wheelchair size={17} weight="fill" />} title={t.venue.special} summary={t.venue.specialSummary(d, h)}>
      <div className="grid grid-cols-2 gap-2">
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
    <div className="rounded-[14px] bg-surface-2 p-3">
      <span className={clsx('block text-[18px] leading-none font-bold tabular', STATUS[tone].text)}>
        {free}
        <span className="text-[11px] font-semibold text-ink-3">/{total}</span>
      </span>
      <span className="mt-1 block text-[12px] text-ink-3">
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
    <Disclosure
      icon={bad ? <Warning size={17} weight="fill" className="text-penuh" /> : <ShieldCheck size={17} weight="fill" />}
      title={t.venue.gage}
      summary={text}
      tone={bad ? 'penuh' : undefined}
    >
      <p className="text-[12.5px] leading-relaxed text-ink-2">{t.venue.gageRule}</p>
      {verdict.kind === 'unknown' && (
        <button
          type="button"
          onClick={() => open({ kind: 'vehicle' })}
          className="mt-3 h-9 rounded-full bg-ink px-4 text-[12.5px] font-bold text-canvas"
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
    <Disclosure icon={<Storefront size={17} weight="fill" />} title={t.venue.tenants} summary={venue.tenants.map((x) => x.name).join(', ')}>
      <div className="divide-y divide-line">
        {venue.tenants.map((ten) => (
          <div key={ten.name} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">{ten.name}</span>
              <span className="text-[12px] text-ink-3">{t.venue.tenantRoute(ten.lift, ten.floor)}</span>
            </span>
            <span className="flex items-center gap-1 text-[12.5px] font-semibold text-ink-2 tabular">
              <PersonSimpleWalk size={14} /> {ten.walkMin} {t.unit.min}
            </span>
          </div>
        ))}
      </div>
    </Disclosure>
  )
}

function ReportRow({ venue, now }: { venue: Venue; now: number }) {
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
  const chip = 'h-9 flex-1 rounded-full bg-surface-2 text-[12.5px] font-semibold transition-colors hover:bg-surface-3 active:scale-[0.97]'
  return (
    <Disclosure
      icon={<Megaphone size={17} weight="fill" />}
      title={t.venue.report}
      summary={recent > 0 ? t.venue.reportsRecent(recent) : t.venue.reportHint}
    >
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
    </Disclosure>
  )
}
