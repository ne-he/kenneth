import { create } from 'zustand'
import type { LngLat, VenueId } from '../data/types'
import type { ParkMode } from '../engine/modes'
import type { TravelLookup } from '../engine/recommend'
import type { Service } from '../engine/services'

/**
 * Three places, always in the same spot at the bottom. The middle one (the K)
 * is home: the map plus everything you can book. Left is what you have going
 * on, right is you.
 */
export type Tab = 'activity' | 'park' | 'account'

export type { ParkMode }

export type VenueFilter = 'all' | 'fav' | 'mall' | 'kampus'

export type SheetKey =
  | { kind: 'book'; id: VenueId; service?: Service }
  | { kind: 'save-spot'; id: VenueId }
  | { kind: 'find-car' }
  | { kind: 'pass'; id: string }
  | { kind: 'valet'; id: string }
  | { kind: 'clock' }
  | { kind: 'search' }
  | { kind: 'impact' }
  | { kind: 'premium' }
  | { kind: 'privacy' }
  | { kind: 'vehicle'; id?: string }
  | { kind: 'map-options' }

export interface Route {
  venueId: VenueId
  gateId: string
  coords: LngLat[]
  km: number
  minutes: number
  source: 'road' | 'estimate'
  startedAt: number
}

interface UiState {
  tab: Tab
  mode: ParkMode
  sheet: SheetKey | null
  selected: VenueId | null
  filter: VenueFilter
  /** Forecast scrubber. Null means "now". */
  previewTs: number | null
  route: Route | null
  origin: LngLat
  originLabel: 'binus' | 'gps'
  travel: TravelLookup
  toast: { id: number; text: string; icon?: string } | null
  /** Something new landed in Aktivitas since the user last looked. Drives the dot on the tab. */
  activityBadge: boolean
  /** Bumped when the K is tapped while already home: the map goes back to the overview. */
  homeTick: number

  setTab: (t: Tab) => void
  setMode: (m: ParkMode) => void
  goHome: () => void
  open: (s: SheetKey) => void
  close: () => void
  select: (id: VenueId | null) => void
  setFilter: (f: VenueFilter) => void
  setPreview: (ts: number | null) => void
  setRoute: (r: Route | null) => void
  setOrigin: (o: LngLat, label: 'binus' | 'gps') => void
  setTravel: (t: TravelLookup) => void
  notify: (text: string, icon?: string) => void
  markActivity: () => void
}

export const useUi = create<UiState>()((set) => ({
  tab: 'park',
  mode: 'park',
  sheet: null,
  selected: null,
  filter: 'all',
  previewTs: null,
  route: null,
  origin: [106.78117, -6.20194],
  originLabel: 'binus',
  travel: {},
  toast: null,
  activityBadge: false,
  homeTick: 0,

  setTab: (tab) => set((s) => ({ tab, sheet: null, activityBadge: tab === 'activity' ? false : s.activityBadge })),
  setMode: (mode) => set({ mode }),
  goHome: () => set((s) => ({ selected: null, sheet: null, homeTick: s.homeTick + 1 })),
  open: (sheet) => set({ sheet }),
  close: () => set({ sheet: null }),
  select: (selected) => set({ selected }),
  setFilter: (filter) => set({ filter }),
  setPreview: (previewTs) => set({ previewTs }),
  setRoute: (route) => set({ route }),
  setOrigin: (origin, originLabel) => set({ origin, originLabel, travel: {} }),
  setTravel: (travel) => set({ travel }),
  notify: (text, icon) => set({ toast: { id: Date.now(), text, icon } }),
  markActivity: () => set((s) => ({ activityBadge: s.tab !== 'activity' })),
}))
