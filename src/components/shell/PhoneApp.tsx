import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { VENUES } from '../../data/venues'
import { forKind, snapshot } from '../../engine/occupancy'
import { alternativesFor } from '../../engine/recommend'
import { formatRupiah } from '../../engine/pricing'
import { sessionNow } from '../../engine/session'
import { valetPhase } from '../../engine/valet'
import { useT } from '../../i18n'
import { finishRedirect } from '../../lib/auth'
import { haptic } from '../../lib/haptics'
import { systemNotify } from '../../lib/notify'
import { useApplyTheme } from '../../lib/theme'
import { formatKm } from '../../lib/geo'
import { clock } from '../../lib/time'
import { activeVehicleOf, useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Account } from '../account/Account'
import { Activity } from '../activity/Activity'
import { Explore } from '../explore/Explore'
import { Onboarding } from '../onboarding/Onboarding'
import { Sheets } from '../sheets/Sheets'
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
      useUi.getState().notify(text, 'mascot')
      haptic('success')
      void systemNotify('KENNETH', text)
      removeReminder(r.id)
    })
  }, [now, reminders, enabled, t])
}

/**
 * On the way to a place: if it fills before the user arrives, say so once,
 * with the nearest place that still has room. Ends when they park or after
 * two hours.
 */
function useEnRouteAlert() {
  const t = useT()
  const now = useNow(30_000)
  const trip = useUi((s) => s.trip)
  const parkedAt = useApp((s) => s.parked?.at)
  useEffect(() => {
    if (!trip) return
    const { setTrip, notify } = useUi.getState()
    if ((parkedAt && parkedAt >= trip.startedAt) || now - trip.startedAt > 2 * 3_600_000) {
      setTrip(null)
      return
    }
    if (trip.warnedAt) return
    const venue = forKind(VENUE_BY_ID[trip.venueId], activeVehicleOf(useApp.getState()).kind)
    const snap = snapshot(venue, now)
    if (snap.status !== 'penuh') return
    setTrip({ ...trip, warnedAt: now })
    const alt = alternativesFor(venue, VENUES, now, 1)[0]
    // "Jalan kaki 4 menit ..." reads mid-sentence here, so it starts lower case.
    const how = alt ? (alt.walk ? t.venue.walk(alt.walk.minutes, alt.walk.via) : t.venue.drive(formatKm(alt.km))) : ''
    const text = alt ? t.nav.nowFull(venue.name, alt.snap.venue.name, how.charAt(0).toLowerCase() + how.slice(1)) : t.nav.nowFullNoAlt(venue.name)
    if (alt) useUi.getState().select(alt.snap.venue.id)
    notify(text, 'mascot')
    haptic('warn')
    void systemNotify('KENNETH', text)
  }, [now, trip, parkedAt, t])
}

/** Five minutes before a parked car's bill steps up to the next hour, once per step. */
function useTariffAlarm() {
  const t = useT()
  const now = useNow(30_000)
  const spot = useApp((s) => s.parked)
  useEffect(() => {
    if (!spot) return
    const venue = forKind(VENUE_BY_ID[spot.venueId], spot.kind ?? 'mobil')
    const s = sessionNow(venue, now - spot.at)
    if (s.msToNext > 5 * 60_000 || spot.tariffAlerted === s.billed) return
    useApp.getState().park({ ...spot, tariffAlerted: s.billed })
    const text = t.park.tariffSoon(venue.name, formatRupiah(s.nextCost, true))
    useUi.getState().notify(text, 'mascot')
    void systemNotify('KENNETH', text)
  }, [now, spot, t])
}

/** Premium: tells the user once when a bay comes back in a sold-out slot they asked about. */
function useWatchAlarm() {
  const t = useT()
  const now = useNow(5_000)
  const watches = useApp((s) => s.watches)
  useEffect(() => {
    const due = watches.filter((w) => !w.firedAt && w.freesAt <= now && w.slot > now)
    if (due.length === 0) return
    const { fireWatch } = useApp.getState()
    due.forEach((w) => {
      const text = t.book.watchFired(VENUE_BY_ID[w.venueId].name, clock(w.slot))
      useUi.getState().notify(text, 'mascot')
      useUi.getState().markActivity()
      haptic('success')
      void systemNotify('KENNETH', text)
      fireWatch(w.id, now)
    })
  }, [now, watches, t])
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
      useUi.getState().notify(text, 'mascot')
      useUi.getState().markActivity()
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
  useWatchAlarm()
  useTariffAlarm()
  useEnRouteAlert()
  useRedirectSignIn()
  const tab = useUi((s) => s.tab)
  const driving = useUi((s) => !!s.route)
  const onboarded = useApp((s) => s.onboarded)

  return (
    <div className="app-root @container relative h-full w-full overflow-hidden bg-canvas text-ink">
      {/* The map stays mounted so it never reloads when switching tabs. */}
      <Explore />
      <AnimatePresence>
        {tab !== 'park' && (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="absolute inset-0 z-40 bg-canvas"
          >
            {tab === 'activity' ? <Activity /> : <Account />}
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
