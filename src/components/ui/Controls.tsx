import clsx from 'clsx'
import { motion } from 'motion/react'
import { useId, type ReactNode } from 'react'
import { haptic } from '../../lib/haptics'

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic('tap')
        onChange(!checked)
      }}
      className={clsx(
        'relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-brand-500' : 'bg-surface-3',
      )}
    >
      <motion.span
        className="absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.18)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 700, damping: 34 }}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode }[]
  className?: string
}) {
  const id = useId()
  return (
    <div className={clsx('sunken flex rounded-full p-1', className)} role="radiogroup">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              haptic('tap')
              onChange(o.value)
            }}
            className={clsx(
              'relative flex h-8 flex-1 items-center justify-center rounded-full px-3 text-[12.5px] font-semibold transition-colors',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface shadow-[0_2px_6px_rgb(0_0_0/0.08),0_0.5px_1.5px_rgb(0_0_0/0.05)]"
                transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  format,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  format: (v: number) => ReactNode
  label: string
}) {
  const btn =
    'grid size-9 place-items-center rounded-full bg-surface text-ink shadow-[0_1px_3px_rgb(0_0_0/0.08)] disabled:opacity-35'
  return (
    <div className="sunken flex items-center gap-2 rounded-full p-1" aria-label={label}>
      <button
        type="button"
        className={btn}
        disabled={value <= min}
        aria-label="-"
        onClick={() => {
          haptic('tap')
          onChange(Math.max(min, value - 1))
        }}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <span className="min-w-14 text-center text-[14px] font-bold tabular">{format(value)}</span>
      <button
        type="button"
        className={btn}
        disabled={value >= max}
        aria-label="+"
        onClick={() => {
          haptic('tap')
          onChange(Math.min(max, value + 1))
        }}
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export function Row({
  icon,
  title,
  hint,
  right,
  onClick,
}: {
  icon?: ReactNode
  title: ReactNode
  hint?: ReactNode
  right?: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 px-4 py-3.5 text-left',
        onClick && 'transition-colors hover:bg-surface-2 active:bg-surface-2',
      )}
    >
      {icon && <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-snug">{title}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{hint}</span>}
      </span>
      {right}
    </Tag>
  )
}

export function Group({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-5">
      {title && (
        <h3 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{title}</h3>
      )}
      <div className="divide-y divide-line overflow-hidden rounded-[22px] border border-line bg-surface">
        {children}
      </div>
    </section>
  )
}
