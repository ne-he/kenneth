import type { Firestore } from 'firebase/firestore'
import type { VenueId } from '../data/types'
import type { CommunityReport } from '../store/app'
import { firebaseApp, firebaseReady } from './firebase'

/*
  Data every phone shares, in the Firestore of the build's Firebase project.
  Condition reports ("Kondisi di lokasi beda?") go to everyone, so a report
  from one phone shows on the next. Shared data is on only when the build sets
  VITE_SHARED=on next to a Firebase config, which park-kenneth.web.app does;
  the team build and forks keep every report on the phone, as before.
  Who may read and write what: firestore.rules.

  Firestore (about 160 KB gzipped) downloads the first time a place sheet
  opens, never on first load, and is not part of the offline install.
*/

export const sharedAvailable = firebaseReady && import.meta.env.VITE_SHARED === 'on'

const HOUR = 3_600_000

let ready: Promise<{ fs: typeof import('firebase/firestore'); db: Firestore }> | null = null

function firestore() {
  ready ??= Promise.all([firebaseApp(), import('firebase/firestore')]).then(([app, fs]) => ({ fs, db: fs.getFirestore(app) }))
  return ready
}

/**
 * Adds a report for everyone. The server stamps the time, so neither a phone's
 * clock nor the demo clock can skew it. It shows in the counts once the server
 * has it, about a second later.
 */
export async function shareReport(venueId: VenueId, kind: CommunityReport['kind']): Promise<void> {
  const { fs, db } = await firestore()
  await fs.addDoc(fs.collection(db, 'reports'), { venueId, kind, at: fs.serverTimestamp() })
}

/**
 * Every report of the last hour from every phone, kept live: `onChange` runs
 * again whenever someone reports. Returns the function that stops listening.
 */
export function watchReports(onChange: (reports: CommunityReport[]) => void, onError: () => void): () => void {
  let stop: (() => void) | null = null
  let stopped = false
  firestore()
    .then(({ fs, db }) => {
      if (stopped) return
      const recent = fs.query(
        fs.collection(db, 'reports'),
        fs.where('at', '>=', fs.Timestamp.fromMillis(Date.now() - HOUR)),
        fs.orderBy('at', 'desc'),
        fs.limit(300),
      )
      stop = fs.onSnapshot(
        recent,
        (snap) =>
          onChange(
            snap.docs.map((d) => {
              // A write still waiting for the server has no server time yet. Read it as the local clock, never as null.
              const r = d.data({ serverTimestamps: 'estimate' })
              return { venueId: r.venueId as VenueId, kind: r.kind as CommunityReport['kind'], at: r.at.toMillis() as number }
            }),
          ),
        onError,
      )
    })
    .catch(onError)
  return () => {
    stopped = true
    stop?.()
  }
}
