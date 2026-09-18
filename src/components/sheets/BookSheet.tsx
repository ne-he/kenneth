import { CheckCircle, CreditCard, Info, Lightning, LockSimple, QrCode, Scales, Wallet } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { CLOSE_HOUR, OPEN_HOUR, forecastDay, occupancyAt, statusOf } from '../../engine/occupancy'
import {
  FREE_BOOKING_AHEAD_H,
  PREMIUM_BOOKING_AHEAD_D,
  WINDOW_MINUTES,
  formatRupiah,
  laneSeatsLeft,
  priorityPrice,
  priorityWorthIt,
} from '../../engine/pricing'
import { useDayLabel, useLang, useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'
import { atWib, clock, dayName, wib } from '../../lib/time'
import { uid, useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { SheetHeader } from '../ui/Sheet'

type Method = 'qris' | 'ewallet' | 'card'
const Q = WINDOW_MINUTES * 60_000
const DAY = 86_400_000
// Above this the lane only moves as fast as cars leave. Say so before people pay.
const NEARLY_FULL = 0.96

export function BookSheet({ venueId }: { venueId: VenueId }) {
  const t = useT()
  const lang = useLang()
  const venue = VENUE_BY_ID[venueId]
  const now = useNow(30_000)
  const plan = useApp((s) => s.plan)
  const addPass = useApp((s) => s.addPass)
  const { close, open, setTab } = useUi.getState()
  const gate = venue.gates.find((g) => g.priorityLane) ?? venue.gates[0]
  const [method, setMethod] = useState<Method>('qris')
  const [stage, setStage] = useState<'pick' | 'paying' | 'done'>('pick')
  const [passId, setPassId] = useState('')
  const [bookedAt, setBookedAt] = useState(0)
  const [day, setDay] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const dayLabel = useDayLabel()

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

  const windows = useMemo(() => {
    const dayTs = now + day * DAY
    const first = Math.ceil((now + 5 * 60_000) / Q) * Q
    const from = day === 0 ? Math.max(first, atWib(dayTs, OPEN_HOUR, 0)) : atWib(dayTs, OPEN_HOUR, 0)
    let to = atWib(dayTs, CLOSE_HOUR, 0) - Q
    if (plan === 'free') to = Math.min(to, first + ((FREE_BOOKING_AHEAD_H * 60) / WINDOW_MINUTES - 1) * Q)
    const list = []
    for (let start = from; start <= to; start += Q) {
      const occ = occupancyAt(venue, start)
      list.push({
        start,
        occ,
        price: priorityPrice(occ, plan),
        seats: laneSeatsLeft(venue, start, occ),
        worth: priorityWorthIt(occ),
      })
    }
    if (plan === 'free') return list
    // A whole day is long. Start the row where a queue begins and stop where it ends.
    const a = list.findIndex((w) => w.worth)
    const b = list.findLastIndex((w) => w.worth)
    return a < 0 ? [] : list.slice(a, b + 1)
  }, [now, plan, venue, day])

  const firstUseful = windows.findIndex((w) => w.worth && w.seats > 0)
  const pick = windows.find((w) => w.start === picked && w.worth && w.seats > 0) ?? windows[firstUseful]

  const pay = () => {
    if (!pick) return
    setStage('paying')
    haptic('tap')
    window.setTimeout(() => {
      const id = uid()
      addPass({
        id,
        venueId,
        gateId: gate.id,
        windowStart: pick.start,
        price: pick.price,
        token: `KNT-${venue.short.toUpperCase()}-${id.slice(0, 4).toUpperCase()}`,
        createdAt: Date.now(),
        status: 'active',
      })
      setPassId(id)
      setBookedAt(pick.start)
      setStage('done')
      haptic('success')
    }, 1300)
  }

  if (stage === 'done') {
    return (
      <div className="flex flex-col items-center pt-6 pb-5 text-center">
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 16 }}
          className="grid size-20 place-items-center rounded-full bg-brand-500 text-white shadow-[0_14px_30px_-10px_rgb(16_185_129/0.7)]"
        >
          <CheckCircle size={44} weight="fill" />
        </motion.span>
        <h2 className="mt-5 text-[22px] font-extrabold tracking-tight">{t.book.booked}</h2>
        <p className="mt-1.5 text-[13.5px] text-ink-2">
          {venue.name} · {gate.name} · {dayLabel(bookedAt, now)}, {clock(bookedAt)}-{clock(bookedAt + Q)}
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-2">
          <Button variant="secondary" onClick={close}>
            {t.common.close}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTab('activity')
              open({ kind: 'pass', id: passId })
            }}
          >
            <QrCode size={17} weight="bold" />
            {t.activity.showQr}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-4">
      <SheetHeader eyebrow={`${venue.name} · ${gate.name}`} title={t.book.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 rounded-[16px] bg-surface-2 p-3 text-[12.5px] leading-relaxed text-ink-2">{t.book.what}</p>

      <h3 className="mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.book.day}</h3>
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
                'relative flex w-[62px] shrink-0 flex-col items-center rounded-[16px] border py-2 transition-colors',
                active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface',
                d.locked && 'text-ink-3',
              )}
            >
              <span className="text-[10.5px] font-bold tracking-wide uppercase opacity-70">
                {i === 0 ? t.common.today : i === 1 ? t.common.tomorrow : dayName(d.ts, lang)}
              </span>
              <span className="text-[17px] leading-tight font-extrabold tabular">{wib(d.ts).date}</span>
              {d.locked ? (
                <LockSimple size={11} weight="bold" className="mt-0.5" />
              ) : (
                <span className="mt-1 size-1.5 rounded-full" style={{ background: STATUS[d.peak].hex }} />
              )}
            </button>
          )
        })}
      </div>

      <div className="mb-2 flex items-baseline justify-between px-1">
        <h3 className="text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.book.window}</h3>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-3">
          <Lightning size={11} weight="fill" /> {t.book.dynamic}
        </span>
      </div>
      <div key={day} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {windows.map((w) => {
          const disabled = !w.worth || w.seats === 0
          const active = w.start === pick?.start
          return (
            <button
              key={w.start}
              type="button"
              disabled={disabled}
              onClick={() => {
                haptic('tap')
                setPicked(w.start)
              }}
              className={clsx(
                'flex w-[88px] shrink-0 flex-col items-start rounded-[16px] border p-2.5 text-left transition-colors',
                active ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface',
                disabled && 'opacity-40',
              )}
            >
              <span className="text-[14px] font-extrabold tabular">{clock(w.start)}</span>
              <span className={clsx('mt-0.5 text-[12px] font-bold tabular', active ? 'text-led-lega dark:text-brand-700' : 'text-brand-700 dark:text-brand-300')}>
                {w.worth ? formatRupiah(w.price, true) : '-'}
              </span>
              <span className={clsx('mt-1 text-[10.5px] font-semibold', active ? 'text-canvas/60' : 'text-ink-3')}>
                {w.seats === 0 ? t.book.soldOut : t.book.seats(w.seats)}
              </span>
            </button>
          )
        })}
      </div>
      {firstUseful < 0 && (
        <p className="mt-3 rounded-[14px] bg-lega-soft p-3 text-[12.5px] font-medium text-lega-ink dark:bg-lega/15 dark:text-led-lega">
          {day === 0 ? t.book.notWorth : t.book.noneThatDay}
        </p>
      )}
      {pick && pick.occ >= NEARLY_FULL && (
        <p className="mt-3 flex gap-2 rounded-[14px] bg-ramai-soft p-3 text-[12.5px] leading-snug font-medium text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
          <Info size={16} weight="fill" className="mt-px shrink-0" />
          {t.book.nearlyFull}
        </p>
      )}
      <p className="mt-2 px-1 text-[11px] text-ink-3">
        {plan === 'premium'
          ? t.book.premiumOff(PREMIUM_BOOKING_AHEAD_D)
          : t.book.ahead(FREE_BOOKING_AHEAD_H, PREMIUM_BOOKING_AHEAD_D)}
      </p>

      <h3 className="mt-5 mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.book.payWith}</h3>
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
            onClick={() => setMethod(key)}
            className={clsx(
              'flex h-16 flex-col items-center justify-center gap-1 rounded-[16px] border text-[12px] font-semibold transition-colors',
              method === key ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-400/10 dark:text-brand-300' : 'border-line bg-surface text-ink-2',
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <details className="mt-4 rounded-[16px] border border-line p-3 text-[12.5px]">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
          <Scales size={16} /> {t.book.fair}
        </summary>
        <p className="mt-2 leading-relaxed text-ink-2">{t.book.fairBody}</p>
      </details>

      <div className="sticky bottom-0 mt-4 bg-surface pt-2">
        <Button variant="primary" size="lg" block disabled={!pick || firstUseful < 0 || stage === 'paying'} onClick={pay}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={stage} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {stage === 'paying' ? t.book.paying : `${t.book.pay} ${pick ? formatRupiah(pick.price) : ''}`}
            </motion.span>
          </AnimatePresence>
        </Button>
        <p className="mt-2 text-center text-[11px] text-ink-3">{t.book.demoPay}</p>
      </div>
    </div>
  )
}
