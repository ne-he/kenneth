import { Crown, CreditCard, DoorOpen, Lightning, LockSimple, QrCode, Question, Wallet } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { forecastDay, occupancyAt, statusOf } from '../../../engine/occupancy'
import { FREE_BOOKING_AHEAD_H, PREMIUM_BOOKING_AHEAD_D, formatRupiah, zonePrice } from '../../../engine/pricing'
import { SLOT_MIN, ZONE_HOLD_MIN, bayFor, baysLeft, zoneOf } from '../../../engine/zone'
import { useDayLabel, useLang, useT } from '../../../i18n'
import { haptic } from '../../../lib/haptics'
import { STATUS } from '../../../lib/status'
import { atWib, clock, dayName, wib } from '../../../lib/time'
import { uid, useApp } from '../../../store/app'
import { useNow } from '../../../store/clock'
import { useUi } from '../../../store/ui'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Kit'
import type { Booked } from './BookHub'

type Method = 'qris' | 'ewallet' | 'card'
const Q = SLOT_MIN * 60_000
const DAY = 86_400_000

/** Zona KENNETH: pick a day, pick an arrival time, get a bay by the lobby. */
export function ZonePanel({ venueId, onDone }: { venueId: VenueId; onDone: (b: Booked) => void }) {
  const t = useT()
  const lang = useLang()
  const venue = VENUE_BY_ID[venueId]
  const zone = zoneOf(venue)!
  const now = useNow(30_000)
  const plan = useApp((s) => s.plan)
  const addPass = useApp((s) => s.addPass)
  const open = useUi((s) => s.open)
  const [method, setMethod] = useState<Method>('qris')
  const [paying, setPaying] = useState(false)
  const [day, setDay] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const dayLabel = useDayLabel()
  const [openH, closeH] = venue.hours

  // Today plus the Premium booking horizon, each tagged with the status at its busiest hour.
  const days = useMemo(
    () =>
      Array.from({ length: PREMIUM_BOOKING_AHEAD_D + 1 }, (_, i) => {
        const ts = now + i * DAY
        const peak = Math.max(...forecastDay(venue, ts).map((p) => p.occ))
        return { ts, peak: statusOf(peak), locked: plan === 'free' && i > 0 }
      }),
    [now, plan, venue],
  )

  const slots = useMemo(() => {
    const dayTs = now + day * DAY
    const first = Math.ceil((now + 5 * 60_000) / Q) * Q
    const from = day === 0 ? Math.max(first, atWib(dayTs, openH, 0)) : atWib(dayTs, openH, 0)
    let to = atWib(dayTs, closeH, 0) - 2 * Q
    if (plan === 'free') to = Math.min(to, first + ((FREE_BOOKING_AHEAD_H * 60) / SLOT_MIN - 1) * Q)
    const list = []
    for (let start = from; start <= to; start += Q) {
      const occ = occupancyAt(venue, start)
      list.push({ start, occ, price: zonePrice(occ, plan), left: baysLeft(venue, start, occ) })
    }
    return list
  }, [now, plan, venue, day, openH, closeH])

  const firstOpen = slots.findIndex((s) => s.left > 0)
  const pick = slots.find((s) => s.start === picked && s.left > 0) ?? slots[firstOpen]

  const pay = () => {
    if (!pick) return
    setPaying(true)
    haptic('tap')
    window.setTimeout(() => {
      const id = uid()
      const bay = bayFor(id, venue)
      addPass({
        id,
        venueId,
        gateId: zone.gate.id,
        windowStart: pick.start,
        bay,
        price: pick.price,
        token: `KNZ-${venue.short.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${id.slice(0, 4).toUpperCase()}`,
        createdAt: Date.now(),
        status: 'active',
      })
      haptic('success')
      onDone({ service: 'priority', id, line: `${t.activity.bay} ${bay} · ${dayLabel(pick.start, now)}, ${clock(pick.start)}` })
    }, 1100)
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3 rounded-[18px] bg-ink p-3.5 text-canvas">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-500 text-white">
          <Crown size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold opacity-60">{t.book.zoneWhere}</span>
          <span className="block text-[15px] leading-tight font-bold">{t.activity.bayWhere(zone.level, zone.lobby)}</span>
          <span className="mt-0.5 flex items-center gap-1 text-[12px] opacity-70">
            <DoorOpen size={13} weight="fill" /> {zone.gate.name} · {t.book.zoneBays(zone.bays)}
          </span>
        </span>
      </div>

      <Label>{t.book.day}</Label>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label={t.book.day}>
        {days.map((d, i) => {
          const active = i === day
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={d.locked ? `${dayLabel(d.ts, now)}, ${t.book.lockedDay}` : dayLabel(d.ts, now)}
              onClick={() => {
                haptic('tap')
                if (d.locked) return open({ kind: 'premium' })
                setDay(i)
                setPicked(null)
              }}
              className={clsx(
                'relative flex w-[60px] shrink-0 flex-col items-center rounded-[16px] py-2 transition-colors',
                active ? 'bg-ink text-canvas' : 'bg-surface-2',
                d.locked && 'text-ink-3',
              )}
            >
              <span className="text-[10.5px] font-semibold opacity-70">
                {i === 0 ? t.common.today : i === 1 ? t.common.tomorrow : dayName(d.ts, lang)}
              </span>
              <span className="text-[17px] leading-tight font-bold tabular">{wib(d.ts).date}</span>
              {d.locked ? (
                <LockSimple size={11} weight="bold" className="mt-0.5" />
              ) : (
                <span className="mt-1 size-1.5 rounded-full" style={{ background: STATUS[d.peak].hex }} />
              )}
            </button>
          )
        })}
      </div>

      <Label
        aside={
          <span className="flex items-center gap-1">
            <Lightning size={11} weight="fill" /> {t.book.dynamic}
          </span>
        }
      >
        {t.book.window}
      </Label>
      <div key={day} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {slots.map((s) => {
          const disabled = s.left === 0
          const active = s.start === pick?.start
          return (
            <button
              key={s.start}
              type="button"
              disabled={disabled}
              onClick={() => {
                haptic('tap')
                setPicked(s.start)
              }}
              className={clsx(
                'flex w-[84px] shrink-0 flex-col items-start rounded-[16px] p-2.5 text-left transition-colors',
                active ? 'bg-ink text-canvas' : 'bg-surface-2',
                disabled && 'opacity-40',
              )}
            >
              <span className="text-[14px] font-bold tabular">{clock(s.start)}</span>
              <span className={clsx('mt-0.5 text-[12px] font-bold tabular', active ? 'text-led-lega dark:text-brand-700' : 'text-brand-700 dark:text-brand-300')}>
                {formatRupiah(s.price, true)}
              </span>
              <span className={clsx('mt-1 text-[10.5px] font-semibold', active ? 'text-canvas/60' : 'text-ink-3')}>
                {disabled ? t.book.soldOut : t.book.seats(s.left)}
              </span>
            </button>
          )
        })}
      </div>
      {firstOpen < 0 && (
        <p className="mt-3 rounded-[14px] bg-ramai-soft p-3 text-[12.5px] font-medium text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
          {day === 0 ? t.book.notWorth : t.book.noneThatDay}
        </p>
      )}
      <p className="mt-2 px-1 text-[11.5px] leading-snug text-ink-3">{t.book.holdNote(ZONE_HOLD_MIN)}</p>
      <p className="mt-1 px-1 text-[11.5px] text-ink-3">
        {plan === 'premium' ? t.book.premiumOff(PREMIUM_BOOKING_AHEAD_D) : t.book.ahead(FREE_BOOKING_AHEAD_H, PREMIUM_BOOKING_AHEAD_D)}
      </p>

      <Label className="mt-5">{t.book.payWith}</Label>
      <PayMethods value={method} onChange={setMethod} />

      <details className="mt-4 rounded-[16px] bg-surface-2 p-3 text-[12.5px]">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
          <Question size={16} /> {t.book.fair}
        </summary>
        <p className="mt-2 leading-relaxed text-ink-2">{t.book.what}</p>
        <p className="mt-2 leading-relaxed text-ink-2">{t.book.fairBody}</p>
      </details>

      <div className="sticky bottom-0 mt-4 bg-surface pt-2">
        <Button variant="primary" size="lg" block disabled={!pick || paying} onClick={pay}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(paying)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {paying ? t.book.paying : `${t.book.pay} ${pick ? formatRupiah(pick.price) : ''}`}
            </motion.span>
          </AnimatePresence>
        </Button>
        <p className="mt-2 text-center text-[11px] text-ink-3">{t.book.demoPay}</p>
      </div>
    </div>
  )
}

/** QRIS, e-wallet or card. Shared with the runner booking. */
export function PayMethods({ value, onChange }: { value: Method; onChange: (m: Method) => void }) {
  const t = useT()
  return (
    <div className="grid grid-cols-3 gap-2">
      {(
        [
          ['qris', 'QRIS', <QrCode key="q" size={20} />],
          ['ewallet', 'E-wallet', <Wallet key="w" size={20} />],
          ['card', t.book.card, <CreditCard key="c" size={20} />],
        ] as const
      ).map(([key, label, icon]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={clsx(
            'flex h-16 flex-col items-center justify-center gap-1 rounded-[16px] border text-[12px] font-semibold transition-colors',
            value === key ? 'border-ink bg-surface text-ink' : 'border-transparent bg-surface-2 text-ink-2',
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

export type { Method as PayMethod }
