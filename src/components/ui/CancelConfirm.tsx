import { X } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { buttonClass, buttonShape } from './buttonStyles'

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
              'w-full',
              dark ? clsx(buttonShape('md'), 'bg-white/8 text-white/80 hover:bg-white/12') : buttonClass('danger', 'md'),
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
            className={clsx('rounded-[20px] p-3.5', dark ? 'bg-white/8' : 'bg-penuh-soft dark:bg-penuh/12')}
          >
            <p className={clsx('text-[13.5px] font-semibold', dark ? 'text-white' : 'text-ink')}>{t.activity.cancelAsk}</p>
            <p className={clsx('mt-0.5 text-[12px] leading-snug', dark ? 'text-white/60' : 'text-ink-2')}>{policy}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAsk(false)}
                className={dark ? clsx(buttonShape('md'), 'bg-white/10 text-white') : buttonClass('ghost', 'md')}
              >
                {t.activity.cancelNo}
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic('success')
                  onConfirm()
                }}
                className={buttonClass('destructive', 'md')}
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
