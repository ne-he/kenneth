import { motion } from 'motion/react'
import { useId, useMemo, useRef } from 'react'
import type { Venue } from '../../data/types'
import { THRESHOLD, occupancyAt, pctOf, statusOf } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'
import { atWib, clock, hourLabel, wib } from '../../lib/time'
import { useUi } from '../../store/ui'

/**
 * The day's forecast as a line with a dot per hour, so the rise and fall
 * reads at a glance. Drag across it to preview any hour today: every pin,
 * halo and list row on screen follows the thumb. With one venue it shows that
 * venue, with several the busiest one per hour. The strip spans the earliest
 * opening to the latest closing, so campuses (from 06.00) and malls (to
 * 22.00) share it. The line stays a calm ink with a dashed mark where a place
 * counts as full; only the hour you are looking at takes its status color,
 * with its percent above it.
 */
export function TimeScrubber({ venues, now, title }: { venues: Venue[]; now: number; title?: string }) {
  const t = useT()
  const preview = useUi((s) => s.previewTs)
  const setPreview = useUi((s) => s.setPreview)
  const strip = useRef<HTMLDivElement>(null)
  const lastHour = useRef<number | null>(null)
  const fade = useId()

  const open = venues.length ? Math.min(...venues.map((v) => v.hours[0])) : 10
  const close = venues.length ? Math.max(...venues.map((v) => v.hours[1])) : 22

  const points = useMemo(() => {
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
  const span = close - open || 1
  const viewHourF = preview ? wib(preview).hourF : nowHourF
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(open + k * span))
  // Both axes run 0 to 100: x is the share of the day shown, y the share of bays taken.
  const x = (hourF: number) => (Math.min(Math.max(hourF - open, 0), span) / span) * 100
  const y = (occ: number) => Math.min(100, Math.max(0, occ * 100))
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.hour)} ${100 - y(p.occ)}`).join(' ')
  const area = `${line} L100 100 L0 100 Z`
  const activeHour = Math.min(close, Math.max(open, Math.round(viewHourF)))
  const active = points.find((p) => p.hour === activeHour) ?? points[0]

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
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold text-ink-3">
          {preview ? t.explore.previewing(clock(preview)) : (title ?? t.explore.scrubHint)}
        </span>
        {preview ? (
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="rounded-full bg-ink px-2.5 py-1 text-[11.5px] font-semibold text-canvas"
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
        aria-valuenow={activeHour}
        aria-valuetext={active && `${hourLabel(active.hour)}, ${pctOf(active.occ)}% ${t.status[active.status]}`}
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
        className="relative h-[100px] cursor-ew-resize touch-none rounded-xl outline-none"
      >
        {/* The plot leaves room above for the percent label and below for the hours. */}
        <div className="absolute inset-x-0 top-[22px] bottom-[18px]">
          <div className="absolute inset-x-0 border-t border-dashed border-penuh/45" style={{ bottom: `${THRESHOLD.penuh * 100}%` }}>
            <span className="absolute right-0 bottom-0.5 text-[9.5px] font-semibold text-penuh-ink/70 dark:text-led-penuh/70">
              {t.status.penuh}
            </span>
          </div>
          <svg className="absolute inset-0 h-full w-full overflow-visible text-ink" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.13" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${fade})`} />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* Now is a hairline at the exact minute. A preview gets a stem from the axis up to its dot, under the percent. */}
          <span className="absolute inset-y-0 w-px bg-ink-3/50" style={{ left: `${x(nowHourF)}%` }} aria-hidden="true" />
          {preview && active && (
            <motion.span
              className="absolute bottom-0 w-[2px] -translate-x-1/2 rounded-full bg-ink/70"
              initial={false}
              animate={{ left: `${x(active.hour)}%`, height: `${y(active.occ)}%` }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              aria-hidden="true"
            />
          )}
          {/* Dots are HTML, not SVG, so they stay round however wide the strip is. */}
          {points.map((p) => (
            <motion.span
              key={p.hour}
              aria-hidden="true"
              className="absolute size-[7px] -translate-x-1/2 translate-y-1/2 rounded-full bg-surface ring-[1.5px] ring-ink/45"
              initial={false}
              animate={{ bottom: `${y(p.occ)}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ left: `${x(p.hour)}%` }}
            />
          ))}
          {active && (
            <>
              <motion.span
                aria-hidden="true"
                className="absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full shadow-[0_0_0_2.5px_var(--surface),0_1px_4px_rgb(0_0_0/0.25)]"
                initial={false}
                animate={{ left: `${x(active.hour)}%`, bottom: `${y(active.occ)}%`, backgroundColor: STATUS[active.status].hex }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
              <motion.span
                aria-hidden="true"
                className="absolute -translate-x-1/2 text-[11.5px] leading-none font-semibold whitespace-nowrap text-ink tabular"
                initial={false}
                // Kept clear of the strip's ends so the first and last hours do not cut the label.
                animate={{ left: `clamp(16px, ${x(active.hour)}%, calc(100% - 16px))`, bottom: `calc(${y(active.occ)}% + 10px)` }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              >
                {pctOf(active.occ)}%
              </motion.span>
            </>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9.5px] font-semibold text-ink-3 tabular">
          {ticks.map((h) => (
            <span key={h}>{hourLabel(h)}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
