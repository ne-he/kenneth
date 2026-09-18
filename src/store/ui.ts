import { create } from 'zustand'
import type { LngLat, VenueId } from '../data/types'
import type { TravelLookup } from '../engine/recommend'

export type Tab = 'explore' | 'activity' | 'profile'

export type SheetKey =
  | { kind: 'venue'; id: VenueId }
  | { kind: 'book'; id: VenueId }
  | { kind: 'ev'; id: VenueId }
  | { kind: 'save-spot'; id: VenueId }
  | { kind: 'find-car' }
  | { kind: 'pass'; id: string }
  | { kind: 'clock' }
  | { kind: 'search' }
  | { kind: 'impact' }
  | { kind: 'premium' }
  | { kind: 'privacy' }
  | { kind: 'vehicle' }

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
  sheet: SheetKey | null
  selected: VenueId | null
  /** Forecast scrubber. Null means "now". */
  previewTs: number | null
  route: Route | null
  origin: LngLat
  originLabel: 'binus' | 'gps'
  travel: TravelLookup
  toast: { id: number; text: string; icon?: string } | null

  setTab: (t: Tab) => void
  open: (s: SheetKey) => void
  close: () => void
  select: (id: VenueId | null) => void
  setPreview: (ts: number | null) => void
  setRoute: (r: Route | null) => void
  setOrigin: (o: LngLat, label: 'binus' | 'gps') => void
  setTravel: (t: TravelLookup) => void
  notify: (text: string, icon?: string) => void
}

export const useUi = create<UiState>()((set) => ({
  tab: 'explore',
  sheet: null,
  selected: null,
  previewTs: null,
  route: null,
  origin: [106.78117, -6.20194],
  originLabel: 'binus',
  travel: {},
  toast: null,

  setTab: (tab) => set({ tab, sheet: null }),
  open: (sheet) => set({ sheet }),
  close: () => set({ sheet: null }),
  select: (selected) => set({ selected }),
  setPreview: (previewTs) => set({ previewTs }),
  setRoute: (route) => set({ route }),
  setOrigin: (origin, originLabel) => set({ origin, originLabel, travel: {} }),
  setTravel: (travel) => set({ travel }),
  notify: (text, icon) => set({ toast: { id: Date.now(), text, icon } }),
}))
