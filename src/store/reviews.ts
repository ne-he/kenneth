import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { VenueId } from '../data/types'
import { shareReview, sharedAvailable, watchReviews, type Review, type ReviewAspect } from '../lib/shared'

/*
  Drivers' yes/no ratings of a car park. Where the build shares data they go
  to Firestore and every phone sees the tally; elsewhere they stay here. This
  phone also remembers what it rated today, so one thumb cannot pile votes.
*/
interface ReviewState {
  /** Ratings made on this phone, for builds without shared data. */
  mine: Review[]
  /** venueId:aspect -> day (YYYY-MM-DD) it was last rated from this phone. */
  ratedOn: Record<string, string>
  rate: (r: Review, day: string) => void
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      mine: [],
      ratedOn: {},
      rate: (r, day) => {
        set((s) => ({ mine: [r, ...s.mine].slice(0, 500), ratedOn: { ...s.ratedOn, [`${r.venueId}:${r.aspect}`]: day } }))
        if (sharedAvailable) void shareReview(r).catch(() => undefined)
      },
    }),
    { name: 'kenneth-reviews', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)

let shared: Review[] | null = null
let started = false
const listeners = new Set<() => void>()
const publish = (next: Review[] | null) => {
  shared = next
  listeners.forEach((l) => l())
}
function start() {
  if (started || !sharedAvailable) return
  started = true
  watchReviews(publish, () => {
    publish(null)
    started = false
  })
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export interface AspectTally {
  aspect: ReviewAspect
  yes: number
  total: number
}

export const ASPECTS: ReviewAspect[] = ['light', 'wide', 'safe', 'signal']

/** Yes and total per aspect for a place: everyone's where data is shared, this phone's otherwise. */
export function useReviewTally(venueId: VenueId): AspectTally[] {
  const mine = useReviewStore((s) => s.mine)
  useEffect(() => {
    const id = window.setTimeout(start, 700)
    return () => window.clearTimeout(id)
  }, [])
  const remote = useSyncExternalStore(subscribe, () => shared)
  const all = sharedAvailable && remote ? remote : mine
  return ASPECTS.map((aspect) => {
    const rs = all.filter((r) => r.venueId === venueId && r.aspect === aspect)
    return { aspect, yes: rs.filter((r) => r.good).length, total: rs.length }
  })
}
