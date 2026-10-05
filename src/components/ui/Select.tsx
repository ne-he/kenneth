import { CaretUpDown, Check } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { haptic } from '../../lib/haptics'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

const ROW = 44
/** Six and a half rows: a cut-off row says the list scrolls on. */
const MAX_ROWS = 6.5

/**
 * The app's own pop-up button, in place of the browser's select and its
 * system list: the pill shows the current choice, and a tap opens a small
 * card of options with a check on the one picked, like a pop-up button on
 * iOS. It opens downward, or upward when the screen runs out below. Arrow
 * keys move, Enter picks, Escape or a tap anywhere else closes it.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  icon,
  align = 'start',
  outline,
  className,
}: {
  value: T
  options: SelectOption<T>[]
  onChange: (v: T) => void
  label: string
  icon?: ReactNode
  /** Which edge the card lines up with when it is wider than the button. */
  align?: 'start' | 'end'
  /** A white pill with a hairline, for toolbars; the default is the filled field used in forms. */
  outline?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const [focus, setFocus] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open])

  // Keyboard focus follows the highlighted option while the card is open.
  useEffect(() => {
    if (open) list.current?.querySelectorAll<HTMLElement>('[role=option]')[focus]?.focus()
  }, [open, focus])

  const show = () => {
    const r = button.current?.getBoundingClientRect()
    // Measured against the phone screen, not the browser window, so the desktop frame behaves like a phone.
    const screen = button.current?.closest('.app-root')?.getBoundingClientRect()
    const floor = screen?.bottom ?? window.innerHeight
    const ceiling = screen?.top ?? 0
    const need = Math.min(options.length, MAX_ROWS) * ROW + 20
    setUp(!!r && floor - r.bottom < need && r.top - ceiling > need)
    setFocus(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const pick = (v: T) => {
    haptic('tap')
    onChange(v)
    setOpen(false)
    button.current?.focus()
  }

  return (
    <div ref={root} className={clsx('relative', className)}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${label}: ${current?.label ?? ''}`}
        onClick={() => {
          haptic('tap')
          if (open) setOpen(false)
          else show()
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            show()
          }
        }}
        className={clsx(
          'flex w-full items-center gap-2 rounded-full pr-3 text-left font-semibold transition-colors',
          outline
            ? 'h-10 border border-line bg-surface pl-3.5 text-[13.5px] hover:bg-surface-2/60'
            : 'h-11 bg-surface-2 pl-4 text-[14px] hover:bg-surface-3',
        )}
      >
        {icon && <span className="shrink-0 text-ink-3">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{current?.label}</span>
        <CaretUpDown size={14} weight="bold" className="shrink-0 text-ink-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={list}
            id={id}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.96, y: up ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') setFocus((f) => Math.min(options.length - 1, f + 1))
              else if (e.key === 'ArrowUp') setFocus((f) => Math.max(0, f - 1))
              else if (e.key === 'Home') setFocus(0)
              else if (e.key === 'End') setFocus(options.length - 1)
              else if (e.key === 'Escape') {
                // Only the card closes; the sheet around it would close on the same key.
                e.stopPropagation()
                setOpen(false)
                button.current?.focus()
              } else if (e.key === 'Tab') setOpen(false)
              else return
              if (e.key !== 'Tab') e.preventDefault()
            }}
            style={{ maxHeight: MAX_ROWS * ROW + 12, scrollbarWidth: 'thin', scrollbarColor: 'var(--line-strong) transparent' }}
            className={clsx(
              'shadow-float absolute z-30 w-max max-w-[min(300px,calc(100vw-32px))] min-w-full overflow-y-auto rounded-[18px] border border-line bg-surface p-1.5',
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
              up ? 'bottom-full mb-2' : 'top-full mt-2',
            )}
          >
            {options.map((o, i) => {
              const on = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  tabIndex={i === focus ? 0 : -1}
                  onClick={() => pick(o.value)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-[12px] px-3 text-left text-[14px] outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2',
                    on ? 'font-semibold text-ink' : 'font-medium text-ink-2',
                  )}
                  style={{ height: ROW }}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <Check size={16} weight="bold" className={clsx('shrink-0 text-brand-600 dark:text-brand-400', !on && 'invisible')} />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
