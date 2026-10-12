import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Promo } from '../data/promos'
import { sharedAvailable, watchPromos, type SharedPromo } from '../lib/shared'

/*
  Promos a merchant made in the merchant dashboard (/mitra). They sit beside the
  ones the app ships with and show on the place page straight away. Where the
  build shares data (park-kenneth.web.app) they live in Firestore and reach
  every phone; elsewhere they stay on this device.
*/
interface MerchantState {
  promos: Promo[]
  addPromo: (p: Promo) => void
  removePromo: (id: string) => void
}

export const useMerchant = create<MerchantState>()(
  persist(
    (set) => ({
      promos: [],
      addPromo: (p) => set((s) => ({ promos: [p, ...s.promos] })),
      removePromo: (id) => set((s) => ({ promos: s.promos.filter((p) => p.id !== id) })),
    }),
    { name: 'kenneth-merchant', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)

// Everyone's offers, live. One listener for the session, like the condition reports in store/shared.ts.
let shared: SharedPromo[] | null = null
let started = false
const listeners = new Set<() => void>()

function publish(next: SharedPromo[] | null) {
  shared = next
  listeners.forEach((l) => l())
}

function start() {
  if (started || !sharedAvailable) return
  started = true
  watchPromos(publish, () => {
    publish(null)
    started = false
  })
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

const EMPTY: Promo[] = []

/** Merchant-made offers: everyone's where data is shared, else this device's. */
export function useMerchantPromos(): (Promo & { owner?: string })[] {
  const local = useMerchant((s) => s.promos)
  useEffect(() => {
    const id = window.setTimeout(start, 700)
    return () => window.clearTimeout(id)
  }, [])
  const remote = useSyncExternalStore(subscribe, () => shared)
  if (!sharedAvailable) return local
  return remote ?? EMPTY
}
