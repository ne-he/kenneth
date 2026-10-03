import clsx from 'clsx'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'

/** Number that rolls to its new value instead of jumping. */
export function CountUp({
  value,
  className,
  decimals = 0,
  grouped,
}: {
  value: number
  className?: string
  decimals?: number
  /** Thousands separators (14.663). */
  grouped?: boolean
}) {
  const mv = useMotionValue(value)
  // Indonesian number style in both languages, the same as prices and distances: 0,83 and 14.663.
  const text = useTransform(mv, (v) =>
    v.toLocaleString('id-ID', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: !!grouped,
    }),
  )
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => c.stop()
  }, [mv, value])
  return <motion.span className={clsx('tabular', className)}>{text}</motion.span>
}

/**
 * Indonesian number plate, the white design introduced in 2022 with the
 * expiry row underneath.
 */
export function Plate({ plate, className, small }: { plate: string; className?: string; small?: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex flex-col items-center rounded-[5px] border-[1.5px] border-[#111] bg-white font-mono leading-none text-[#111] shadow-[0_1px_0_#0002]',
        small ? 'px-1.5 pt-[2px] pb-[1.5px]' : 'px-2 pt-[3px] pb-[2px]',
        className,
      )}
    >
      <span className={clsx('font-bold tracking-[0.12em] whitespace-nowrap', small ? 'text-[11px]' : 'text-[13px]')}>{plate || 'B ---- ---'}</span>
      <span className={clsx('font-bold tracking-[0.3em] opacity-70', small ? 'mt-px text-[5.5px]' : 'mt-[2px] text-[6.5px]')}>08 . 29</span>
    </span>
  )
}
