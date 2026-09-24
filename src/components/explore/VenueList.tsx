import { BellSimple, ChargingStation, Crown, Key, Star, Wheelchair } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import type { VenueId } from '../../data/types'
import type { ParkMode, PinFact } from '../../engine/modes'
import { nextRelief } from '../../engine/occupancy'
import { formatRupiah } from '../../engine/pricing'
import type { Ranked } from '../../engine/recommend'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { askNotificationPermission } from '../../lib/notify'
import { formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { uid, useApp } from '../../store/app'
import { useUi, type VenueFilter } from '../../store/ui'
import { StatusPill, VenueGlyph } from '../ui/Kit'
import { TimeScrubber } from './TimeScrubber'

/**
 * One row per place, read left to right like a price list: what it is, where,
 * how long until you are parked. The only colour is the status pill.
 */
export function VenueList({
  ranked,
  facts,
  mode,
  ts,
  now,
  previewing,
  filter,
}: {
  ranked: Ranked[]
  facts: ReadonlyMap<VenueId, PinFact>
  mode: ParkMode
  ts: number
  now: number
  previewing: boolean
  filter: VenueFilter
}) {
  const t = useT()
  const select = useUi((s) => s.select)
  const accessibleFirst = useApp((s) => s.prefs.accessibleFirst)
  const favorites = useApp((s) => s.favorites)

  // The one full venue the user most likely wanted: nudge them with its relief time. Only when just parking.
  const fullOne = mode === 'park' ? ranked.find((r) => r.status === 'penuh') : undefined
  const relief = fullOne && !previewing ? nextRelief(fullOne.venue, ts) : null

  if (ranked.length === 0) {
    return (
      <div className="px-8 pt-6 pb-10 text-center">
        <Star size={28} className="mx-auto text-ink-3" />
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">
          {filter === 'fav' ? t.explore.emptyFav : mode === 'park' ? t.explore.empty : t.modes.emptyList}
        </p>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <AnimatePresence initial={false}>
        {fullOne && relief && <ReliefRow key={fullOne.venue.id} id={fullOne.venue.id} name={fullOne.venue.name} at={relief} />}
      </AnimatePresence>
      <ol className="divide-y divide-line px-2">
        {ranked.map((r, i) => {
          const fav = favorites.includes(r.venue.id)
          const top = i === 0 && r.status !== 'penuh'
          return (
            <motion.li
              key={r.venue.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 36, delay: Math.min(i, 8) * 0.03 }}
            >
              <button
                type="button"
                onClick={() => {
                  haptic('tap')
                  select(r.venue.id)
                }}
                className="flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left transition-colors hover:bg-surface-2/70 active:bg-surface-2"
              >
                <VenueGlyph category={r.venue.category} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold tracking-tight">{r.venue.name}</span>
                    {fav && <Star size={12} weight="fill" className="shrink-0 text-ramai" />}
                    {top && (
                      <span className="shrink-0 text-[11px] font-bold text-brand-700 dark:text-brand-300">{t.explore.fastest}</span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink-3">
                    <span className="tabular">{r.travel.km < 0.15 ? t.explore.here : formatKm(r.travel.km)}</span>
                    <span>·</span>
                    <span className="truncate tabular">
                      {r.queueMin >= 2 ? `${t.explore.queue} ${formatMin(r.queueMin)} ${t.unit.min}` : t.explore.noQueue}
                    </span>
                    {accessibleFirst && (
                      <span className="flex shrink-0 items-center gap-0.5">
                        · <Wheelchair size={12} /> {r.venue.accessible.difabel}
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <ModeValue fact={facts.get(r.venue.id)} minutes={r.timeToPark} />
                  <StatusPill status={r.status} pct={r.pct} />
                </span>
              </button>
            </motion.li>
          )
        })}
      </ol>
      <div className="mt-4 border-t border-line px-5 pt-4">
        <TimeScrubber venues={ranked.map((r) => r.venue)} now={now} title={t.explore.forecastToday} />
      </div>
      {mode === 'park' && <p className="px-6 pt-4 text-center text-[11.5px] leading-relaxed text-ink-3">{t.explore.toParkHint}</p>}
    </div>
  )
}

/** The number on the right of a row: minutes to a bay when parking, otherwise what the mode is about. */
function ModeValue({ fact, minutes }: { fact?: PinFact; minutes: number }) {
  const t = useT()
  const num = 'flex items-center gap-1 text-[15px] leading-none font-bold tracking-tight tabular'
  const unit = 'text-[11px] font-semibold text-ink-3'
  switch (fact?.kind) {
    case 'price':
      return (
        <span className={num}>
          <Crown size={13} weight="fill" className="text-brand-600" />
          {fact.left > 0 ? formatRupiah(fact.price, true) : <span className="text-[13px] text-penuh-ink dark:text-led-penuh">{t.modes.soldOut}</span>}
        </span>
      )
    case 'wait':
      return (
        <span className={num}>
          <Key size={13} weight="fill" className="text-ink-2" />
          {fact.min}
          <span className={unit}>{t.unit.min}</span>
        </span>
      )
    case 'chargers':
      return (
        <span className={num}>
          <ChargingStation size={13} weight="fill" className="text-ev" />
          {t.modes.free(fact.free, fact.total)}
        </span>
      )
    default:
      return (
        <span className="text-[15px] leading-none font-bold tracking-tight tabular">
          {Math.round(minutes)}
          <span className={`ml-0.5 ${unit}`}>{t.unit.min}</span>
        </span>
      )
  }
}

function ReliefRow({ id, name, at }: { id: VenueId; name: string; at: number }) {
  const t = useT()
  const reminders = useApp((s) => s.reminders)
  const addReminder = useApp((s) => s.addReminder)
  const notify = useUi((s) => s.notify)
  const set = reminders.some((r) => r.venueId === id)
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden px-4"
    >
      <div className="mb-2 flex items-center gap-3 rounded-[16px] bg-surface-2 p-2.5 pl-3.5">
        <BellSimple size={17} weight="fill" className="shrink-0 text-ink-2" />
        <span className="flex-1 text-[12.5px] leading-snug text-ink-2">{t.explore.relief(name, clock(at))}</span>
        <button
          type="button"
          disabled={set}
          onClick={() => {
            haptic('success')
            addReminder({ id: uid(), venueId: id, at, createdAt: Date.now() })
            notify(t.explore.reminded)
            askNotificationPermission()
          }}
          className={clsx(
            'h-8 shrink-0 rounded-full px-3 text-[12px] font-bold',
            set ? 'text-ink-3' : 'bg-ink text-canvas',
          )}
        >
          {set ? t.explore.remindSet : t.explore.remind}
        </button>
      </div>
    </motion.div>
  )
}
