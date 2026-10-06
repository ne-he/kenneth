import { useEffect, useSyncExternalStore } from 'react'
import { sharedAvailable, watchReports } from '../lib/shared'
import type { CommunityReport } from './app'

/*
  Reports from every phone, live. One listener for the whole app, started the
  first time a place sheet asks and kept for the session, so switching places
  costs no new reads. Null while shared data is off, still loading, or out of
  reach; the caller then counts this phone's own reports instead.
*/

let reports: CommunityReport[] | null = null
let started = false
const listeners = new Set<() => void>()

function publish(next: CommunityReport[] | null) {
  reports = next
  listeners.forEach((l) => l())
}

function start() {
  if (started || !sharedAvailable) return
  started = true
  watchReports(publish, () => {
    publish(null)
    // The listener ends on an error. The next sheet that opens tries again.
    started = false
  })
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

/** Everyone's reports of the last hour, or null to fall back to this phone's. */
export function useSharedReports(): CommunityReport[] | null {
  useEffect(() => {
    // Firestore is a big script. Start after the sheet has slid up, so parsing it cannot stutter the slide.
    const id = window.setTimeout(start, 700)
    return () => window.clearTimeout(id)
  }, [])
  return useSyncExternalStore(subscribe, () => reports)
}
