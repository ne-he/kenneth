import clsx from 'clsx'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'
import type { OccupancyStatus } from '../../data/types'
import { useT } from '../../i18n'
import { STATUS } from '../../lib/status'

/** Number that rolls to its new value instead of jumping. */
export function CountUp({ value, className, decimals = 0 }: { value: number; className?: string; decimals?: number }) {
  const mv = useMotionValue(value)
  const text = useTransform(mv, (v) => v.toFixed(decimals))
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => c.stop()
  }, [mv, value])
  return <motion.span className={clsx('tabular', className)}>{text}</motion.span>
}

/**
 * Dot matrix digits, the look of the "SISA SLOT" LED boards at Jakarta mall
 * car park entrances. Used only for the one number that matters on a screen.
 */
export function Led({
  value,
  status,
  className,
  suffix,
}: {
  value: number
  status: OccupancyStatus
  className?: string
  suffix?: string
}) {
  const color = STATUS[status].led
  return (
    <span
      className={clsx('font-led font-black leading-none tabular', className)}
      style={{ color, textShadow: `0 0 6px ${color}99, 0 0 22px ${color}55` }}
    >
      <CountUp value={value} />
      {suffix && <span className="ml-0.5 text-[0.55em]">{suffix}</span>}
    </span>
  )
}

export function StatusBadge({ status, className }: { status: OccupancyStatus; className?: string }) {
  const t = useT()
  return (
    <span
      className={clsx(
        'inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-bold',
        STATUS[status].soft,
        className,
      )}
    >
      <span className={clsx('size-1.5 rounded-full', STATUS[status].dot, status === 'penuh' && 'animate-pulse')} />
      {t.status[status]}
    </span>
  )
}

/** Ring gauge for occupancy. The gap at the bottom reads like a car park entrance. */
export function OccupancyRing({
  occ,
  status,
  size = 56,
  stroke = 6,
  children,
}: {
  occ: number
  status: OccupancyStatus
  size?: number
  stroke?: number
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const arc = c * 0.8
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[126deg]" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-surface-3"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${c}`}
          strokeLinecap="round"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STATUS[status].hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${arc * Math.min(1, occ)} ${c}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/**
 * Indonesian number plate, the white design introduced in 2022 with the
 * expiry row underneath.
 */
export function Plate({ plate, className }: { plate: string; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex flex-col items-center rounded-[5px] border-[1.5px] border-[#111] bg-white px-2 pt-[3px] pb-[2px] font-mono leading-none text-[#111] shadow-[0_1px_0_#0002]',
        className,
      )}
    >
      <span className="text-[13px] font-bold tracking-[0.12em]">{plate || 'B ---- ---'}</span>
      <span className="mt-[2px] text-[6.5px] font-bold tracking-[0.3em] opacity-70">08 . 29</span>
    </span>
  )
}
