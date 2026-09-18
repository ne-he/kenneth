import { ArrowRight, BellSimple, Lightning, Wheelchair } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import type { VenueId } from '../../data/types'
import { nextRelief } from '../../engine/occupancy'
import type { Ranked } from '../../engine/recommend'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { askNotificationPermission } from '../../lib/notify'
import { STATUS, formatMin } from '../../lib/status'
import { clock } from '../../lib/time'
import { uid, useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { OccupancyRing, StatusBadge } from '../ui/Display'

export function VenueList({ ranked, ts, previewing }: { ranked: Ranked[]; ts: number; previewing: boolean }) {
  const t = useT()
  const select = useUi((s) => s.select)
  const accessibleFirst = useApp((s) => s.prefs.accessibleFirst)

  // The one full venue the user most likely wanted: nudge them with its relief time.
  const fullOne = ranked.find((r) => r.status === 'penuh')
  const relief = fullOne && !previewing ? nextRelief(fullOne.venue, ts) : null

  return (
    <div className="px-3.5 pb-4">
      <AnimatePresence initial={false}>
        {fullOne && relief && <ReliefCard key={fullOne.venue.id} id={fullOne.venue.id} name={fullOne.venue.name} at={relief} />}
      </AnimatePresence>
      <ol className="space-y-2">
        {ranked.map((r, i) => (
          <motion.li
            key={r.venue.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36, delay: i * 0.035 }}
          >
            <button
              type="button"
              onClick={() => {
                haptic('tap')
                select(r.venue.id)
              }}
              className={clsx(
                'group flex w-full items-center gap-3 rounded-[22px] border p-3 text-left transition-colors',
                i === 0 && r.status !== 'penuh'
                  ? 'border-brand-500/35 bg-brand-50/70 dark:border-brand-400/25 dark:bg-brand-400/[0.06]'
                  : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <OccupancyRing occ={r.occ} status={r.status} size={58} stroke={5.5}>
                <span className={clsx('text-[17px] font-extrabold tracking-tight tabular', STATUS[r.status].text)}>
                  {r.pct}
                  <span className="text-[10px]">%</span>
                </span>
              </OccupancyRing>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-bold tracking-tight">{r.venue.name}</span>
                  {i === 0 && r.status !== 'penuh' && (
                    <span className="rounded-full bg-brand-600 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider text-white">
                      #1
                    </span>
                  )}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-2">
                  <StatusBadge status={r.status} />
                  <span className="tabular">
                    {r.queueMin >= 2 ? `${t.explore.queue} ${formatMin(r.queueMin)} ${t.unit.min}` : t.explore.noQueue}
                  </span>
                  <span className="text-ink-3">·</span>
                  <span className="tabular text-ink-3">{formatKm(r.travel.km)}</span>
                </span>
                {(accessibleFirst || r.status === 'penuh') && (
                  <span className="mt-1.5 flex items-center gap-2.5 text-[11px] text-ink-3">
                    {accessibleFirst && (
                      <span className="flex items-center gap-1">
                        <Wheelchair size={13} /> {r.venue.accessible.difabel}
                      </span>
                    )}
                    {r.status === 'penuh' && r.bestGateQueueMin < r.queueMin / 2 && (
                      <span className="flex items-center gap-1 font-semibold text-lega-ink dark:text-led-lega">
                        <Lightning size={12} weight="fill" />
                        {r.bestGate.name} {formatMin(r.bestGateQueueMin)} {t.unit.min}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-[20px] leading-none font-extrabold tracking-tight tabular">
                  {Math.round(r.timeToPark)}
                  <span className="ml-0.5 text-[11px] font-bold text-ink-3">{t.unit.min}</span>
                </span>
                <span className="mt-1 text-[10.5px] font-semibold text-ink-3">{t.explore.toPark}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}

function ReliefCard({ id, name, at }: { id: VenueId; name: string; at: number }) {
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
      className="overflow-hidden"
    >
      <div className="mb-2.5 flex items-center gap-3 rounded-[20px] bg-ink p-3 pl-3.5 text-canvas">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10">
          <BellSimple size={18} weight="fill" className="text-led-lega" />
        </span>
        <span className="flex-1 text-[12.5px] leading-snug font-medium">{t.explore.relief(name, clock(at))}</span>
        <button
          type="button"
          disabled={set}
          onClick={() => {
            haptic('success')
            addReminder({ id: uid(), venueId: id, at, createdAt: Date.now() })
            notify(t.explore.reminded)
            askNotificationPermission()
          }}
          className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-brand-500 px-3 text-[12px] font-bold text-white disabled:bg-white/15"
        >
          {set ? t.explore.remindSet : t.explore.remind}
          {!set && <ArrowRight size={12} weight="bold" />}
        </button>
      </div>
    </motion.div>
  )
}
