import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/*
  Booth mode for BINUS Festival. Responses stay on the booth device (no
  server in this prototype) and are exported as CSV or JSON for the
  Assignment II validation report.
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
  responses: BoothResponse[]
  add: (r: BoothResponse) => void
  remove: (id: string) => void
  clear: () => void
}

export const useBooth = create<BoothState>()(
  persist(
    (set) => ({
      responses: [],
      add: (r) => set((s) => ({ responses: [r, ...s.responses] })),
      remove: (id) => set((s) => ({ responses: s.responses.filter((r) => r.id !== id) })),
      clear: () => set({ responses: [] }),
    }),
    { name: 'kenneth-booth', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
)

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
  const s = Array.isArray(v) ? v.join('; ') : typeof v === 'number' ? new Date(v).toISOString() : String(v ?? '')
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
