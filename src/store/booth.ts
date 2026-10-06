import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/*
  Booth mode for BINUS Festival. Responses stay on the booth device and are
  exported as CSV or JSON for the Assignment II validation report. Where the
  build shares data (src/lib/shared.ts), several phones can join one booth
  session: each sends its answers there and sees everyone's in the tally and
  the export. Contact details never leave the phone they were typed on.
*/

export interface BoothResponse {
  id: string
  at: number
  lastTime: 'minggu' | 'bulan' | 'lama' | 'tidak'
  lostMin: '<5' | '5-15' | '15-30' | '>30' | ''
  tolerance: 'ya' | 'mungkin' | 'tidak'
  features: string[]
  payPriority: 'ya' | 'tergantung' | 'tidak'
  like: string
  wish: string
  question: string
  idea: string
  contact: string
}

interface BoothState {
  /** Answers typed on this phone. */
  responses: BoothResponse[]
  /** The booth session this phone has joined, or null when answers stay here. */
  session: string | null
  /** The session's answers from every phone as last seen, without contacts. Kept for offline export. */
  pool: BoothResponse[]
  /** Ids of this phone's answers the session does not have yet. */
  pending: string[]
  add: (r: BoothResponse) => void
  remove: (id: string) => void
  clear: () => void
  /** Joins a session and queues every answer on this phone for it. */
  join: (session: string) => void
  leave: () => void
  setPool: (pool: BoothResponse[]) => void
  sent: (id: string) => void
}

export const useBooth = create<BoothState>()(
  persist(
    (set) => ({
      responses: [],
      session: null,
      pool: [],
      pending: [],
      add: (r) => set((s) => ({ responses: [r, ...s.responses], pending: s.session ? [...s.pending, r.id] : s.pending })),
      remove: (id) => set((s) => ({ responses: s.responses.filter((r) => r.id !== id) })),
      clear: () => set({ responses: [] }),
      join: (session) => set((s) => ({ session, pool: [], pending: s.responses.map((r) => r.id) })),
      leave: () => set({ session: null, pool: [], pending: [] }),
      setPool: (pool) => set({ pool }),
      sent: (id) => set((s) => ({ pending: s.pending.filter((x) => x !== id) })),
    }),
    // Still version 1: the new fields are optional and fill in from the defaults above.
    { name: 'kenneth-booth', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)

/** Answers from several phones meet in one session, so their ids must not collide. */
export const answerId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`

/** A new booth session key: 128 random bits. Knowing it is the only way into the session (firestore.rules). */
export function newSession(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export const isSession = (key: string): boolean => /^[A-Za-z0-9_-]{22}$/.test(key)

/**
 * Every answer this phone can see, newest first: its own, with their
 * contacts, and the rest of the session's. The session's copies of this
 * phone's own answers are not counted twice.
 */
export function combine(own: BoothResponse[], pool: BoothResponse[]): BoothResponse[] {
  const mine = new Set(own.map((r) => r.id))
  return [...own, ...pool.filter((r) => !mine.has(r.id))].sort((a, b) => b.at - a.at)
}

const COLUMNS: (keyof BoothResponse)[] = [
  'id',
  'at',
  'lastTime',
  'lostMin',
  'tolerance',
  'features',
  'payPriority',
  'like',
  'wish',
  'question',
  'idea',
  'contact',
]

const cell = (v: unknown) => {
  let s = Array.isArray(v) ? v.join('; ') : typeof v === 'number' ? new Date(v).toISOString() : String(v ?? '')
  // Free text starting with = + - @ opens as a formula in Excel ("- cepat" shows #NAME?). A leading ' keeps it text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: BoothResponse[]): string {
  return [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(','))].join('\n')
}

export function download(name: string, text: string, type: string) {
  // Excel needs the BOM to read a CSV as UTF-8. JSON must not have one, JSON.parse and Python reject it.
  const blob = new Blob([type === 'text/csv' ? '﻿' + text : text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  // Revoking right after the click can cancel the download on iPad Safari, the likely booth device.
  window.setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
