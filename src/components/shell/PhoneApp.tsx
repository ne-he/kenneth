import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApplyTheme } from '../../lib/theme'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Activity } from '../activity/Activity'
import { Explore } from '../explore/Explore'
import { Onboarding } from '../onboarding/Onboarding'
import { Profile } from '../profile/Profile'
import { Sheets } from '../sheets/Sheets'
import { Toast } from '../ui/Toast'
import { TabBar } from './TabBar'

/** Fires "relief" reminders when the simulated clock reaches them. */
function useReminderAlarm() {
  const t = useT()
  const now = useNow(10_000)
  const reminders = useApp((s) => s.reminders)
  const enabled = useApp((s) => s.prefs.reliefNotif)
  useEffect(() => {
    if (!enabled) return
    const due = reminders.filter((r) => r.at <= now)
    if (due.length === 0) return
    const { removeReminder } = useApp.getState()
    due.forEach((r) => {
      const name = VENUE_BY_ID[r.venueId].name
      const text = t.explore.reliefNow(name)
      useUi.getState().notify(text)
      haptic('success')
      try {
        if ('Notification' in window && Notification.permission === 'granted') new Notification('KENNETH', { body: text })
      } catch {
        // Some mobile browsers only allow notifications from a service worker.
      }
      removeReminder(r.id)
    })
  }, [now, reminders, enabled, t])
}

/** The app itself, sized by its parent: full screen on a phone, a device frame on desktop. */
export function PhoneApp() {
  useApplyTheme()
  useReminderAlarm()
  const tab = useUi((s) => s.tab)
  const onboarded = useApp((s) => s.onboarded)

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
            {tab === 'activity' ? <Activity /> : <Profile />}
          </motion.div>
        )}
      </AnimatePresence>
      {tab !== 'explore' && (
        <div className="pb-safe absolute inset-x-6 bottom-0 z-[45]">
          <TabBar variant="floating" />
        </div>
      )}
      <Sheets />
      <AnimatePresence>{!onboarded && <Onboarding key="onboarding" />}</AnimatePresence>
      <Toast />
    </div>
  )
}
