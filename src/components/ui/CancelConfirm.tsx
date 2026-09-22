import { X } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'

/**
 * Cancel, always visible and always the same: one quiet red button, then a
 * second tap to confirm with the rule spelled out. Used on every booking card,
 * right after booking, and inside each ticket.
 */
export function CancelConfirm({
  policy,
  onConfirm,
  label,
  dark,
  className,
}: {
  policy: string
  onConfirm: () => void
  label?: string
  dark?: boolean
  className?: string
}) {
  const t = useT()
  const [ask, setAsk] = useState(false)
  return (
    <div className={className}>
      <AnimatePresence initial={false} mode="wait">
        {!ask ? (
          <motion.button
            key="ask"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => {
              haptic('tap')
              setAsk(true)
            }}
            className={clsx(
              'flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] text-[13px] font-semibold transition-colors',
              dark ? 'bg-white/8 text-white/80 hover:bg-white/12' : 'text-penuh-ink hover:bg-penuh-soft dark:text-led-penuh dark:hover:bg-penuh/15',
            )}
          >
            <X size={14} weight="bold" /> {label ?? t.activity.cancel}
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            role="alertdialog"
            aria-label={t.activity.cancelAsk}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className={clsx('rounded-[16px] p-3', dark ? 'bg-white/8' : 'bg-penuh-soft dark:bg-penuh/12')}
          >
            <p className={clsx('text-[13.5px] font-bold', dark ? 'text-white' : 'text-ink')}>{t.activity.cancelAsk}</p>
            <p className={clsx('mt-0.5 text-[12px] leading-snug', dark ? 'text-white/60' : 'text-ink-2')}>{policy}</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAsk(false)}
                className={clsx(
                  'h-10 rounded-[12px] text-[13px] font-semibold',
                  dark ? 'bg-white/10 text-white' : 'bg-surface text-ink',
                )}
              >
                {t.activity.cancelNo}
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('success')
                  onConfirm()
                }}
                className="h-10 rounded-[12px] bg-penuh text-[13px] font-bold text-white"
              >
                {t.activity.cancelYes}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
