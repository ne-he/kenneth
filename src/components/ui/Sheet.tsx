import clsx from 'clsx'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  /** Extra classes for the scrolling body. */
  bodyClassName?: string
  /** Render without the dim backdrop, e.g. for the QR pass. */
  tone?: 'default' | 'dark'
}

/**
 * Modal bottom sheet. Lives inside the app frame (absolute, not fixed) so it
 * stays in the phone on the desktop showcase. Drag the grabber down to close.
 */
export function Sheet({ open, onClose, children, label, bodyClassName, tone = 'default' }: SheetProps) {
  const controls = useDragControls()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => panel.current?.focus(), 60)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-[rgb(8_10_9/0.42)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={clsx(
              'shadow-sheet relative flex max-h-[92%] flex-col rounded-t-[30px] outline-none',
              tone === 'dark' ? 'bg-[#0c0f0d] text-white' : 'bg-surface',
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 420, mass: 0.9 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 650) onClose()
            }}
          >
            <div
              className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-2 active:cursor-grabbing"
              onPointerDown={(e) => controls.start(e)}
            >
              <span className={clsx('h-[5px] w-10 rounded-full', tone === 'dark' ? 'bg-white/25' : 'bg-line-strong')} />
            </div>
            <div className={clsx('no-scrollbar overflow-y-auto overscroll-contain px-5 pb-safe', bodyClassName)}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function SheetHeader({
  eyebrow,
  title,
  onClose,
  closeLabel,
  right,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  onClose?: () => void
  closeLabel?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </div>
        )}
        <h2 className="text-[21px] font-extrabold leading-tight tracking-tight">{title}</h2>
      </div>
      {right}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel ?? 'Close'}
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
