import { AnimatePresence, motion } from 'motion/react'
import { useApplyTheme } from '../../lib/theme'
import { useUi } from '../../store/ui'
import { Explore } from '../explore/Explore'
import { Toast } from '../ui/Toast'
import { TabBar } from './TabBar'

/** The app itself, sized by its parent: full screen on a phone, a device frame on desktop. */
export function PhoneApp() {
  useApplyTheme()
  const tab = useUi((s) => s.tab)

  return (
    <div className="relative h-full w-full overflow-hidden bg-canvas text-ink">
      {/* Explore stays mounted so the map never reloads when switching tabs. */}
      <Explore />
      <AnimatePresence>
        {tab !== 'explore' && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="absolute inset-0 z-40 bg-canvas"
          >
            <div className="grid h-full place-items-center text-ink-3">{tab}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {tab !== 'explore' && (
        <div className="pb-safe absolute inset-x-6 bottom-0 z-[45]">
          <TabBar variant="floating" />
        </div>
      )}
      <Toast />
    </div>
  )
}
