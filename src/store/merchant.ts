import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Promo } from '../data/promos'

/*
  Promos a merchant made in the merchant dashboard (/mitra). They sit beside the
  ones the app ships with and show on the place page straight away. Kept on
  this device like the rest of the app's data.
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
