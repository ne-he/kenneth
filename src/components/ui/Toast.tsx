import { CheckCircle } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useUi } from '../../store/ui'
import { MascotFace } from './Mascot'

/** Top of the screen below the notch (or the showcase frame's island), the same inset the top bar uses. */
const SAFE_TOP = 'max(12px, var(--safe-top, env(safe-area-inset-top)))'

/**
 * A short confirmation in the same glass as the top bar's chips, so it
 * follows the theme. It drops in just below the top bar, or below the turn
 * banner while navigating, never under the notch. Good news the app brings
 * by itself (a bay came free, the car is ready) and its thanks show the
 * bekantan's face.
 */
export function Toast() {
  const toast = useUi((s) => s.toast)
  // While driving the top bar gives way to the taller turn banner.
  const driving = useUi((s) => !!s.route && s.tab === 'park')

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => useUi.setState({ toast: null }), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-[70] flex justify-center px-4"
      style={{ top: `calc(${SAFE_TOP} + ${driving ? 92 : 52}px)` }}
      aria-live="polite"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -10, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className="glass shadow-float flex max-w-full items-center gap-2 rounded-full py-2 pr-4 pl-2.5 text-[13px] font-semibold text-ink"
          >
            {toast.icon === 'mascot' ? (
              <MascotFace size={22} className="-my-0.5" />
            ) : (
              <CheckCircle size={18} weight="fill" className="shrink-0 text-brand-600 dark:text-brand-400" />
            )}
            <span className="truncate">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
