import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { VehicleKind, VenueId } from '../data/types'
import type { Plan } from '../engine/pricing'
import type { ValetTicket } from '../engine/valet'
import { nextSaturdayAt } from '../lib/time'

export type Lang = 'id' | 'en'
export type Theme = 'system' | 'light' | 'dark'
export type NavApp = 'kenneth' | 'gmaps' | 'waze'
export type MapStyle = 'calm' | 'detail'

export interface Vehicle {
  id: string
  kind: VehicleKind
  model: string
  plate: string
  isEV: boolean
}

export interface ParkedSpot {
  venueId: VenueId
  level: string
  /** Floor section letter, e.g. C in C-12. Saved as `zone` before storage version 3. */
  section: string
  pillar: number
  lobby: string
  photo?: string
  note?: string
  at: number
  /** Minutes saved on arrival (recommended gate versus default gate). */
  savedMin: number
  /** Parked with a motorbike or a car. Missing on spots saved before motorbikes existed. */
  kind?: VehicleKind
}

/** A Zona KENNETH booking. Stored under `passes`, the key used since v0.3, so old bookings keep loading. */
export interface ZonePass {
  id: string
  venueId: VenueId
  gateId: string
  /** Booked arrival time. The bay is held from here for ZONE_HOLD_MIN minutes. */
  windowStart: number
  /** The bay, e.g. K-07. Missing on passes saved by v0.3. */
  bay?: string
  price: number
  token: string
  createdAt: number
  status: 'active' | 'cancelled'
  cancelledAt?: number
}

export interface EvBooking {
  id: string
  venueId: VenueId
  start: number
  durationMin: number
  charger: string
  createdAt: number
  /** Cancelled bookings stay on record so Riwayat can show them. */
  cancelledAt?: number
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
  /** Handed to a KENNETH runner instead of parking yourself. */
  via?: 'valet'
  kind?: VehicleKind
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

export interface MapPrefs {
  style: MapStyle
  threeD: boolean
  navApp: NavApp
}

/** Who is signed in. Only the public Google profile, the rest of the data stays on this device. */
export interface Account {
  uid: string
  name: string
  email: string
  photo?: string
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
  /** The service menu has been opened once, so the tip pointing at it can stay away. */
  seenModeMenu: boolean
  name: string
  vehicles: Vehicle[]
  activeVehicle: string
  favorites: VenueId[]
  lang: Lang
  theme: Theme
  plan: Plan
  prefs: Prefs
  mapPrefs: MapPrefs
  account: Account | null
  parked: ParkedSpot | null
  passes: ZonePass[]
  evBookings: EvBooking[]
  valets: ValetTicket[]
  reminders: Reminder[]
  history: Visit[]
  reports: CommunityReport[]
  clock: ClockState

  markModeMenuSeen: () => void
  finishOnboarding: (p: { name: string; vehicle: Omit<Vehicle, 'id'>; favorites: VenueId[]; withSample: boolean }) => void
  setName: (name: string) => void
  saveVehicle: (v: Vehicle) => void
  removeVehicle: (id: string) => void
  setActiveVehicle: (id: string) => void
  toggleFavorite: (id: VenueId) => void
  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
  setPlan: (p: Plan) => void
  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => void
  setMapPref: <K extends keyof MapPrefs>(k: K, v: MapPrefs[K]) => void
  setAccount: (a: Account | null) => void
  park: (spot: ParkedSpot) => void
  leave: () => void
  addPass: (p: ZonePass) => void
  cancelPass: (id: string, at: number) => void
  addEvBooking: (b: EvBooking) => void
  cancelEvBooking: (id: string, at: number) => void
  addValet: (v: ValetTicket) => void
  updateValet: (id: string, patch: Partial<ValetTicket>) => void
  finishValet: (id: string, at: number) => void
  addReminder: (r: Reminder) => void
  removeReminder: (id: string) => void
  addVisit: (v: Visit) => void
  addReport: (r: CommunityReport) => void
  setClock: (mode: 'scenario' | 'live', simTs?: number) => void
  resetAll: () => void
}

export const uid = () => Math.random().toString(36).slice(2, 10)

export const DEFAULT_SCENARIO = () => nextSaturdayAt(Date.now(), 14, 7)

/** Used when no vehicle is saved, so screens never have to handle "no vehicle". */
export const NO_VEHICLE: Vehicle = { id: 'none', kind: 'mobil', model: '', plate: '', isEV: false }

const DEFAULTS = {
  onboarded: false,
  seenModeMenu: false,
  name: '',
  vehicles: [] as Vehicle[],
  activeVehicle: '',
  favorites: [] as VenueId[],
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
  mapPrefs: { style: 'calm', threeD: true, navApp: 'kenneth' } as MapPrefs,
  account: null,
  parked: null,
  passes: [],
  evBookings: [],
  valets: [],
  reminders: [],
  history: [],
  reports: [],
}

/** A plausible month of use so the Tiket tab and the impact line have something to show in demos. */
function sampleHistory(now: number): Visit[] {
  const day = 86_400_000
  const rows: [VenueId, number, number, number, VenueId?][] = [
    ['neo-soho', 2, 2.5, 14, 'central-park'],
    ['binus-kijang', 4, 5, 6, 'binus-anggrek'],
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

      finishOnboarding: ({ name, vehicle, favorites, withSample }) => {
        const id = uid()
        set({
          onboarded: true,
          name,
          vehicles: [{ ...vehicle, id }],
          activeVehicle: id,
          favorites,
          history: withSample ? sampleHistory(Date.now()) : [],
        })
      },
      markModeMenuSeen: () => set({ seenModeMenu: true }),
      setName: (name) => set({ name }),
      saveVehicle: (v) =>
        set((s) => {
          const exists = s.vehicles.some((x) => x.id === v.id)
          const vehicles = exists ? s.vehicles.map((x) => (x.id === v.id ? v : x)) : [...s.vehicles, v]
          return { vehicles, activeVehicle: exists ? s.activeVehicle : v.id }
        }),
      removeVehicle: (id) =>
        set((s) => {
          const vehicles = s.vehicles.filter((v) => v.id !== id)
          const activeVehicle = s.activeVehicle === id ? (vehicles[0]?.id ?? '') : s.activeVehicle
          return { vehicles, activeVehicle }
        }),
      setActiveVehicle: (activeVehicle) => set({ activeVehicle }),
      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),
      setPlan: (plan) => set({ plan }),
      setPref: (k, v) => set((s) => ({ prefs: { ...s.prefs, [k]: v } })),
      setMapPref: (k, v) => set((s) => ({ mapPrefs: { ...s.mapPrefs, [k]: v } })),
      setAccount: (account) => set((s) => ({ account, name: s.name || account?.name.split(' ')[0] || '' })),
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
            kind: s.parked.kind,
          }
          return { parked: null, history: [visit, ...s.history] }
        }),
      addPass: (p) => set((s) => ({ passes: [p, ...s.passes] })),
      cancelPass: (id, at) =>
        set((s) => ({ passes: s.passes.map((p) => (p.id === id ? { ...p, status: 'cancelled', cancelledAt: at } : p)) })),
      addEvBooking: (b) => set((s) => ({ evBookings: [b, ...s.evBookings] })),
      cancelEvBooking: (id, at) =>
        set((s) => ({ evBookings: s.evBookings.map((b) => (b.id === id ? { ...b, cancelledAt: at } : b)) })),
      addValet: (v) => set((s) => ({ valets: [v, ...s.valets] })),
      updateValet: (id, patch) => set((s) => ({ valets: s.valets.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      finishValet: (id, at) =>
        set((s) => {
          const t = s.valets.find((v) => v.id === id)
          if (!t) return {}
          const since = t.droppedAt ?? t.arriveAt
          const visit: Visit = {
            id: uid(),
            venueId: t.venueId,
            at: since,
            durationH: Math.max(0.25, (at - since) / 3_600_000),
            // Called ahead instead of standing at the lobby for the whole fetch.
            minutesSaved: t.readyAt && t.requestedAt ? Math.round((t.readyAt - t.requestedAt) / 60_000) : 0,
            via: 'valet',
            kind: 'mobil',
          }
          return {
            valets: s.valets.map((v) => (v.id === id ? { ...v, status: 'done', closedAt: at } : v)),
            history: [visit, ...s.history],
          }
        }),
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
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => migrateApp(persisted as Record<string, unknown>, version),
    },
  ),
)

/**
 * Version 1 had a single car. Version 2 keeps a garage (cars and motorbikes),
 * favourites, valet tickets, map settings and the signed-in account. Version 3
 * saves the floor section of a parked car as `section`, so `zone` only ever
 * means Zona KENNETH.
 */
export function migrateApp(state: Record<string, unknown>, version: number) {
  if (version < 2) {
    const old = (state.vehicle as Omit<Vehicle, 'id' | 'kind'> | undefined) ?? { model: '', plate: '', isEV: false }
    const hasOne = !!(old.plate || old.model)
    state.vehicles = hasOne || state.onboarded ? [{ ...old, id: 'v1', kind: 'mobil' }] : []
    state.activeVehicle = (state.vehicles as Vehicle[]).length ? 'v1' : ''
    delete state.vehicle
    state.favorites = []
    state.valets = []
    state.mapPrefs = DEFAULTS.mapPrefs
    state.account = null
  }
  if (version < 3) {
    const parked = state.parked as (Record<string, unknown> & { zone?: string }) | null | undefined
    if (parked && parked.zone !== undefined && parked.section === undefined) {
      parked.section = parked.zone
      delete parked.zone
    }
  }
  return state as unknown as AppState
}

export const activeVehicleOf = (s: Pick<AppState, 'vehicles' | 'activeVehicle'>): Vehicle =>
  s.vehicles.find((v) => v.id === s.activeVehicle) ?? s.vehicles[0] ?? NO_VEHICLE

/** The vehicle every screen should think about right now. */
export const useVehicle = () => useApp(activeVehicleOf)

export function simNowOf(clock: ClockState, real = Date.now()): number {
  return clock.mode === 'live' ? real : clock.anchorSim + (real - clock.anchorReal)
}
