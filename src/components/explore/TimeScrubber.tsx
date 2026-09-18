import clsx from 'clsx'
import { motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import type { Venue } from '../../data/types'
import { CLOSE_HOUR, OPEN_HOUR, forecastDay, statusOf } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'
import { atWib, clock, hourLabel, wib } from '../../lib/time'
import { useUi } from '../../store/ui'

/**
 * Hourly strip, read like a weather forecast. Drag across it to preview any
 * hour today: every pin, halo and list row on screen follows the thumb.
 * With a venue it shows that venue, without one the busiest venue per hour.
 */
export function TimeScrubber({ venues, now, compact }: { venues: Venue[]; now: number; compact?: boolean }) {
  const t = useT()
  const preview = useUi((s) => s.previewTs)
  const setPreview = useUi((s) => s.setPreview)
  const strip = useRef<HTMLDivElement>(null)
  const lastHour = useRef<number | null>(null)

  const bars = useMemo(() => {
    const series = venues.map((v) => forecastDay(v, now))
    return series[0].map((p, i) => {
      const occ = venues.length === 1 ? p.occ : Math.max(...series.map((s) => s[i].occ))
      return { hour: p.hour, occ, status: statusOf(occ) }
    })
  }, [venues, now])

  const nowHourF = wib(now).hourF
  const span = CLOSE_HOUR - OPEN_HOUR
  const viewHourF = preview ? wib(preview).hourF : nowHourF
  const pos = (hf: number) => `${(Math.min(Math.max(hf - OPEN_HOUR, 0), span) / span) * 100}%`

  const pick = (clientX: number) => {
    const el = strip.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const hour = Math.round(OPEN_HOUR + k * span)
    if (hour === lastHour.current) return
    lastHour.current = hour
    haptic('tap')
    const nowHour = Math.floor(nowHourF)
    setPreview(hour === nowHour ? null : atWib(now, hour, 0))
  }

  return (
    <div className={clsx('select-none', compact ? 'px-0' : 'px-5')}>
      <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-ink-3">
        <span>{preview ? t.explore.previewing(clock(preview)) : t.explore.scrubHint}</span>
        {preview && (
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-canvas"
          >
            {t.explore.backToNow}
          </button>
        )}
      </div>
      <div
        ref={strip}
        role="slider"
        aria-label={t.explore.scrubHint}
        aria-valuemin={OPEN_HOUR}
        aria-valuemax={CLOSE_HOUR}
        aria-valuenow={Math.round(viewHourF)}
        tabIndex={0}
        onKeyDown={(e) => {
          const cur = Math.round(viewHourF)
          if (e.key === 'ArrowRight' && cur < CLOSE_HOUR) setPreview(atWib(now, cur + 1, 0))
          if (e.key === 'ArrowLeft' && cur > OPEN_HOUR) setPreview(atWib(now, cur - 1, 0))
          if (e.key === 'Escape') setPreview(null)
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          lastHour.current = null
          pick(e.clientX)
        }}
        onPointerMove={(e) => e.buttons === 1 && pick(e.clientX)}
        onPointerUp={() => (lastHour.current = null)}
        className="relative h-[46px] cursor-ew-resize touch-none rounded-xl outline-none"
      >
        <div className="absolute inset-x-0 bottom-[14px] flex h-[30px] items-end gap-[3px]">
          {bars.map((b) => {
            const active = Math.round(viewHourF) === b.hour
            return (
              <motion.span
                key={b.hour}
                className="flex-1 rounded-[3px]"
                initial={false}
                animate={{ height: `${Math.max(10, b.occ * 100)}%`, opacity: active ? 1 : 0.55 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ background: STATUS[b.status].hex }}
              />
            )
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9.5px] font-semibold text-ink-3 tabular">
          {[10, 13, 16, 19, 22].map((h) => (
            <span key={h}>{hourLabel(h)}</span>
          ))}
        </div>
        <span
          className="absolute top-0 bottom-[12px] w-px bg-ink-3/60"
          style={{ left: pos(nowHourF) }}
          aria-hidden="true"
        />
        <motion.span
          className="absolute top-[-3px] bottom-[10px] w-[3px] -translate-x-1/2 rounded-full bg-ink shadow-[0_0_0_3px_var(--surface)]"
          animate={{ left: pos(viewHourF) }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
