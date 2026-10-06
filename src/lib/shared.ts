import type { Firestore } from 'firebase/firestore'
import type { VenueId } from '../data/types'
import type { CommunityReport } from '../store/app'
import type { BoothResponse } from '../store/booth'
import { firebaseApp, firebaseReady } from './firebase'

/*
  Data every phone shares, in the Firestore of the build's Firebase project.
  Condition reports ("Kondisi di lokasi beda?") go to everyone, so a report
  from one phone shows on the next. Booth answers go to a booth session
  whose key only the booth's own phones hold. Shared data is on only when
  the build sets VITE_SHARED=on next to a Firebase config, which
  park-kenneth.web.app does; the team build and forks keep every report and
  answer on the phone, as before. Who may read and write what: firestore.rules.

  Firestore (about 160 KB gzipped) downloads the first time a place sheet or
  a booth session needs it, never on first load, and is not part of the
  offline install.
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

/** The part of a booth answer the session keeps. Contact details never leave the phone they were typed on. */
const forSession = (r: BoothResponse) => ({
  id: r.id,
  at: r.at,
  lastTime: r.lastTime,
  lostMin: r.lostMin,
  tolerance: r.tolerance,
  features: r.features.slice(0, 2),
  payPriority: r.payPriority,
  like: r.like.slice(0, 1000),
  wish: r.wish.slice(0, 1000),
  question: r.question.slice(0, 1000),
  idea: r.idea.slice(0, 1000),
})

/**
 * Sends one answer to a booth session. Resolves once the server has it; while
 * offline it waits and retries by itself. Sending the same answer twice is fine.
 */
export async function shareAnswer(session: string, r: BoothResponse): Promise<void> {
  const { fs, db } = await firestore()
  await fs.setDoc(fs.doc(db, 'booths', session, 'answers', r.id), forSession(r))
}

/** Every answer in a booth session, from every phone, kept live. Returns the function that stops listening. */
export function watchSession(session: string, onChange: (answers: BoothResponse[]) => void, onError: () => void): () => void {
  let stop: (() => void) | null = null
  let stopped = false
  firestore()
    .then(({ fs, db }) => {
      if (stopped) return
      stop = fs.onSnapshot(
        fs.collection(db, 'booths', session, 'answers'),
        (snap) => onChange(snap.docs.map((d) => ({ ...(d.data() as Omit<BoothResponse, 'contact'>), contact: '' }))),
        onError,
      )
    })
    .catch(onError)
  return () => {
    stopped = true
    stop?.()
  }
}
