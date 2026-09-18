import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { VenueId } from '../data/types'
import type { Plan } from '../engine/pricing'
import { nextSaturdayAt } from '../lib/time'

export type Lang = 'id' | 'en'
export type Theme = 'system' | 'light' | 'dark'

export interface Vehicle {
  model: string
  plate: string
  isEV: boolean
}

export interface ParkedSpot {
  venueId: VenueId
  level: string
  zone: string
  pillar: number
  lobby: string
  photo?: string
  note?: string
  at: number
  /** Minutes saved on arrival (recommended gate versus default gate). */
  savedMin: number
}

export interface PriorityPass {
  id: string
  venueId: VenueId
  gateId: string
  windowStart: number
  price: number
  token: string
  createdAt: number
  status: 'active' | 'cancelled'
}

export interface EvBooking {
  id: string
  venueId: VenueId
  start: number
  durationMin: number
  charger: string
  createdAt: number
}

export interface Reminder {
  id: string
  venueId: VenueId
  at: number
  createdAt: number
}

export interface Visit {
  id: string
  venueId: VenueId
  at: number
  durationH: number
  minutesSaved: number
  /** Set when the app steered the user away from a full venue. */
  divertedFrom?: VenueId
}

export interface CommunityReport {
  venueId: VenueId
  kind: 'penuh' | 'antri' | 'lega'
  at: number
}

export interface Prefs {
  gageWarning: boolean
  reliefNotif: boolean
  accessibleFirst: boolean
  shareAnonymous: boolean
  haptics: boolean
}

/**
 * Demo clock. In scenario mode time still moves forward in real time from
 * the anchor, so timers and countdowns behave normally during a demo.
 */
export interface ClockState {
  mode: 'scenario' | 'live'
  anchorSim: number
  anchorReal: number
}

interface AppState {
  onboarded: boolean
  name: string
  vehicle: Vehicle
  lang: Lang
  theme: Theme
  plan: Plan
  prefs: Prefs
  parked: ParkedSpot | null
  passes: PriorityPass[]
  evBookings: EvBooking[]
  reminders: Reminder[]
  history: Visit[]
  reports: CommunityReport[]
  clock: ClockState

  finishOnboarding: (p: { name: string; vehicle: Vehicle; withSample: boolean }) => void
  setName: (name: string) => void
  setVehicle: (v: Vehicle) => void
  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  setPlan: (p: Plan) => void
  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void
  park: (spot: ParkedSpot) => void
  leave: () => void
  addPass: (p: PriorityPass) => void
  cancelPass: (id: string) => void
  addEvBooking: (b: EvBooking) => void
  cancelEvBooking: (id: string) => void
  addReminder: (r: Reminder) => void
  removeReminder: (id: string) => void
  addVisit: (v: Visit) => void
  addReport: (r: CommunityReport) => void
  setClock: (mode: 'scenario' | 'live', simTs?: number) => void
  resetAll: () => void
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const DEFAULT_SCENARIO = () => nextSaturdayAt(Date.now(), 14, 7)

const DEFAULTS = {
  onboarded: false,
  name: '',
  vehicle: { model: '', plate: '', isEV: false },
  lang: 'id' as Lang,
  theme: 'system' as Theme,
  plan: 'free' as Plan,
  prefs: {
    gageWarning: true,
    reliefNotif: true,
    accessibleFirst: false,
    shareAnonymous: true,
    haptics: true,
  },
  parked: null,
  passes: [],
  evBookings: [],
  reminders: [],
  history: [],
  reports: [],
}

/** A plausible month of use so the Activity tab has something to show in demos. */
function sampleHistory(now: number): Visit[] {
  const day = 86_400_000
  const rows: [VenueId, number, number, number, VenueId?][] = [
    ['neo-soho', 2, 2.5, 14, 'central-park'],
    ['taman-anggrek', 6, 3, 6],
    ['central-park', 9, 2, 11],
    ['puri-indah', 13, 1.5, 4],
    ['ciputra', 16, 2, 9, 'lippo-puri'],
    ['central-park', 20, 4, 8],
    ['grand-indonesia', 23, 3, 12],
  ]
  return rows.map(([venueId, ago, durationH, minutesSaved, divertedFrom]) => ({
    id: uid(),
    venueId,
    at: now - ago * day,
    durationH,
    minutesSaved,
    divertedFrom,
  }))
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      clock: { mode: 'scenario', anchorSim: DEFAULT_SCENARIO(), anchorReal: Date.now() },

      finishOnboarding: ({ name, vehicle, withSample }) =>
        set({
          onboarded: true,
          name,
          vehicle,
          history: withSample ? sampleHistory(Date.now()) : [],
        }),
      setName: (name) => set({ name }),
      setVehicle: (vehicle) => set({ vehicle }),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setPlan: (plan) => set({ plan }),
      setPref: (k, v) => set((s) => ({ prefs: { ...s.prefs, [k]: v } })),
      park: (parked) => set({ parked }),
      leave: () =>
        set((s) => {
          if (!s.parked) return {}
          const durationH = Math.max(0.25, (simNowOf(s.clock) - s.parked.at) / 3_600_000)
          const visit: Visit = {
            id: uid(),
            venueId: s.parked.venueId,
            at: s.parked.at,
            durationH,
            minutesSaved: s.parked.savedMin,
          }
          return { parked: null, history: [visit, ...s.history] }
        }),
      addPass: (p) => set((s) => ({ passes: [p, ...s.passes] })),
      cancelPass: (id) =>
        set((s) => ({ passes: s.passes.map((p) => (p.id === id ? { ...p, status: 'cancelled' } : p)) })),
      addEvBooking: (b) => set((s) => ({ evBookings: [b, ...s.evBookings] })),
      cancelEvBooking: (id) => set((s) => ({ evBookings: s.evBookings.filter((b) => b.id !== id) })),
      addReminder: (r) =>
        set((s) => ({ reminders: [r, ...s.reminders.filter((x) => x.venueId !== r.venueId)] })),
      removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
      addVisit: (v) => set((s) => ({ history: [v, ...s.history] })),
      addReport: (r) => set((s) => ({ reports: [r, ...s.reports].slice(0, 50) })),
      setClock: (mode, simTs) =>
        set({
          clock: {
            mode,
            anchorSim: mode === 'live' ? Date.now() : (simTs ?? DEFAULT_SCENARIO()),
            anchorReal: Date.now(),
          },
        }),
      resetAll: () =>
        set({
          ...DEFAULTS,
          clock: { mode: 'scenario', anchorSim: DEFAULT_SCENARIO(), anchorReal: Date.now() },
        }),
    }),
    {
      name: 'kenneth-app',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

export function simNowOf(clock: ClockState, real = Date.now()): number {
  return clock.mode === 'live' ? real : clock.anchorSim + (real - clock.anchorReal)
}
