import { CheckCircle } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { useUi } from '../../store/ui'

export function Toast() {
  const toast = useUi((s) => s.toast)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => useUi.setState({ toast: null }), 2600)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-3 z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className="flex max-w-full items-center gap-2 rounded-full bg-[#111512]/92 py-2 pr-4 pl-2.5 text-[12.5px] font-semibold text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.45)] backdrop-blur-xl"
          >
            <CheckCircle size={18} weight="fill" className="shrink-0 text-brand-400" />
            <span className="truncate">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
