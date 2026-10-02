import { CaretDown, GraduationCap, Storefront } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import type { Category, OccupancyStatus } from '../../data/types'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'

/*
  The quiet parts of the interface. Most of the screen is these: plain rows,
  small grey labels, one round button per action. Colour is saved for the
  occupancy status, so the eye goes straight to it.
*/

/** Round action with a label under it. One per thing you can do, never more than four in a row. */
export function ActionButton({
  icon,
  label,
  onClick,
  tone = 'plain',
  disabled,
  active,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  tone?: 'plain' | 'brand'
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 disabled:opacity-40"
    >
      <motion.span
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
        className={clsx(
          'grid size-[52px] place-items-center rounded-full transition-colors',
          tone === 'brand'
            ? 'bg-brand-600 text-white shadow-[0_8px_18px_-8px_rgb(5_150_105/0.7)]'
            : active
              ? 'bg-ink text-canvas'
              : 'bg-surface-2 text-ink group-hover:bg-surface-3',
        )}
      >
        {icon}
      </motion.span>
      <span className="max-w-full truncate text-[11.5px] font-semibold text-ink-2">{label}</span>
    </button>
  )
}

/** Small grey sentence-case label above a block, the way Linear labels its groups. */
export function Label({ children, aside, className }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-2 flex items-baseline justify-between px-1', className)}>
      <h3 className="text-[13px] font-semibold text-ink-3">{children}</h3>
      {aside && <span className="text-[12px] text-ink-3">{aside}</span>}
    </div>
  )
}

/**
 * A row that says the short version under its title and opens up for the long
 * one. A small grey icon, no tile: the words carry the row.
 */
export function Disclosure({
  icon,
  title,
  summary,
  children,
  tone,
}: {
  icon: ReactNode
  title: string
  summary?: ReactNode
  children: ReactNode
  tone?: OccupancyStatus
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          haptic('tap')
          setOpen(!open)
        }}
        className="flex w-full items-center gap-3 px-1 py-4 text-left transition-opacity hover:opacity-80"
      >
        <span className="grid size-5 shrink-0 place-items-center text-ink-3">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-medium">{title}</span>
          {summary && (
            <span className={clsx('mt-0.5 block truncate text-[13px]', tone ? STATUS[tone].text : 'text-ink-3')}>{summary}</span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-ink-3">
          <CaretDown size={13} weight="bold" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="pr-1 pb-4 pl-9">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Grouped rows separated by hairlines. On a card by default; `plain` drops the card and keeps only the lines. */
export function List({ children, className, plain }: { children: ReactNode; className?: string; plain?: boolean }) {
  return (
    <div
      className={clsx(
        'divide-y divide-line',
        plain ? 'border-y border-line' : 'overflow-hidden rounded-[20px] border border-line bg-surface',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Occupancy as a small soft pill: dot, percent, word. The only coloured thing in a row. */
export function StatusPill({ status, pct, label }: { status: OccupancyStatus; pct?: number; label?: string }) {
  return (
    // Color lives in the dot only; the number stays ink so a long list reads calm.
    <span className={clsx('inline-flex items-center gap-1.5 text-[12.5px] font-semibold tabular', status === 'penuh' ? STATUS.penuh.text : 'text-ink-2')}>
      <span className={clsx('size-2 rounded-full', STATUS[status].dot)} />
      {pct !== undefined && `${pct}%`}
      {label && <span className="font-semibold">{label}</span>}
    </span>
  )
}

/** Neutral tile that says what kind of place this is before you read the name. */
export function VenueGlyph({ category, size = 40 }: { category: Category; size?: number }) {
  const Icon = category === 'kampus' ? GraduationCap : Storefront
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[14px] bg-surface-2 text-ink-2"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={Math.round(size * 0.48)} weight="duotone" />
    </span>
  )
}
