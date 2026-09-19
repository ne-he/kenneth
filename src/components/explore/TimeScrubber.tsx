import { motion } from 'motion/react'
import { useMemo, useRef } from 'react'
import type { Venue } from '../../data/types'
import { occupancyAt, statusOf } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'
import { atWib, clock, hourLabel, wib } from '../../lib/time'
import { useUi } from '../../store/ui'

/**
 * Hourly strip, read like a weather forecast. Drag across it to preview any
 * hour today: every pin, halo and list row on screen follows the thumb.
 * With one venue it shows that venue, with several the busiest one per hour.
 * The strip spans the earliest opening to the latest closing, so campuses
 * (from 06.00) and malls (to 22.00) share it.
 */
export function TimeScrubber({ venues, now, title }: { venues: Venue[]; now: number; title?: string }) {
  const t = useT()
  const preview = useUi((s) => s.previewTs)
  const setPreview = useUi((s) => s.setPreview)
  const strip = useRef<HTMLDivElement>(null)
  const lastHour = useRef<number | null>(null)

  const open = venues.length ? Math.min(...venues.map((v) => v.hours[0])) : 10
  const close = venues.length ? Math.max(...venues.map((v) => v.hours[1])) : 22

  const bars = useMemo(() => {
    const out = []
    for (let hour = open; hour <= close; hour++) {
      const at = atWib(now, hour, 0)
      const occs = venues.filter((v) => hour >= v.hours[0] && hour <= v.hours[1]).map((v) => occupancyAt(v, at))
      const occ = occs.length ? Math.max(...occs) : 0.03
      out.push({ hour, occ, status: statusOf(occ) })
    }
    return out
  }, [venues, now, open, close])

  const nowHourF = wib(now).hourF
  const span = close - open
  const viewHourF = preview ? wib(preview).hourF : nowHourF
  const pos = (hf: number) => `${(Math.min(Math.max(hf - open, 0), span) / span) * 100}%`
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(open + k * span))

  const pick = (clientX: number) => {
    const el = strip.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    const hour = Math.round(open + k * span)
    if (hour === lastHour.current) return
    lastHour.current = hour
    haptic('tap')
    const nowHour = Math.floor(nowHourF)
    setPreview(hour === nowHour ? null : atWib(now, hour, 0))
  }

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-3">
          {preview ? t.explore.previewing(clock(preview)) : (title ?? t.explore.scrubHint)}
        </span>
        {preview ? (
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-bold text-canvas"
          >
            {t.explore.backToNow}
          </button>
        ) : (
          title && <span className="text-[11.5px] text-ink-3">{t.explore.scrubHint}</span>
        )}
      </div>
      <div
        ref={strip}
        role="slider"
        aria-label={t.explore.scrubHint}
        aria-valuemin={open}
        aria-valuemax={close}
        aria-valuenow={Math.round(viewHourF)}
        tabIndex={0}
        onKeyDown={(e) => {
          const cur = Math.round(viewHourF)
          if (e.key === 'ArrowRight' && cur < close) setPreview(atWib(now, cur + 1, 0))
          if (e.key === 'ArrowLeft' && cur > open) setPreview(atWib(now, cur - 1, 0))
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
                animate={{ height: `${Math.max(10, b.occ * 100)}%`, opacity: active ? 1 : 0.5 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ background: STATUS[b.status].hex }}
              />
            )
          })}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9.5px] font-semibold text-ink-3 tabular">
          {ticks.map((h) => (
            <span key={h}>{hourLabel(h)}</span>
          ))}
        </div>
        <span className="absolute top-0 bottom-[12px] w-px bg-ink-3/60" style={{ left: pos(nowHourF) }} aria-hidden="true" />
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
