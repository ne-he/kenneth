import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { valetPhase } from '../../engine/valet'
import { useT } from '../../i18n'
import { finishRedirect } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { systemNotify } from '../../lib/notify'
import { useApplyTheme } from '../../lib/theme'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Account } from '../account/Account'
import { Explore } from '../explore/Explore'
import { Onboarding } from '../onboarding/Onboarding'
import { Sheets } from '../sheets/Sheets'
import { Tickets } from '../tickets/Tickets'
import { Toast } from '../ui/Toast'
import { BottomNav } from './BottomNav'

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
      void systemNotify('KENNETH', text)
      removeReminder(r.id)
    })
  }, [now, reminders, enabled, t])
}

/** Tells the user once when a called valet car reaches the lobby. */
function useValetAlarm() {
  const t = useT()
  const now = useNow(5_000)
  const valets = useApp((s) => s.valets)
  const told = useRef(new Set<string>())
  useEffect(() => {
    valets.forEach((v) => {
      if (told.current.has(v.id) || valetPhase(v, now) !== 'ready') return
      // Already ready when the app opened: say nothing, the ticket shows it.
      told.current.add(v.id)
      if (v.readyAt && now - v.readyAt > 60_000) return
      const text = t.valet.readyNow(v.lobby)
      useUi.getState().notify(text)
      useUi.getState().markTickets()
      haptic('success')
      void systemNotify('KENNETH', text)
    })
  }, [now, valets, t])
}

/** Picks up a Google sign-in that had to leave the page (installed iPhone app, blocked popup). */
function useRedirectSignIn() {
  useEffect(() => {
    finishRedirect()
      .then((account) => account && useApp.getState().setAccount(account))
      .catch(() => undefined)
  }, [])
}

/** The app itself, sized by its parent: full screen on a phone, a device frame on desktop. */
export function PhoneApp() {
  useApplyTheme()
  useReminderAlarm()
  useValetAlarm()
  useRedirectSignIn()
  const tab = useUi((s) => s.tab)
  const driving = useUi((s) => !!s.route)
  const onboarded = useApp((s) => s.onboarded)

  return (
    <div className="app-root relative h-full w-full overflow-hidden bg-canvas text-ink">
      {/* The map stays mounted so it never reloads when switching tabs. */}
      <Explore />
      <AnimatePresence>
        {tab !== 'explore' && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="absolute inset-0 z-40 bg-canvas"
          >
            {tab === 'tickets' ? <Tickets /> : <Account />}
          </motion.div>
        )}
      </AnimatePresence>
      {!driving && <BottomNav />}
      <Sheets />
      <AnimatePresence>{!onboarded && <Onboarding key="onboarding" />}</AnimatePresence>
      <Toast />
    </div>
  )
}
