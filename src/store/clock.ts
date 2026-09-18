import { useEffect, useState } from 'react'
import { simNowOf, useApp } from './app'
import { useUi } from './ui'

/** Current simulated time, re-rendering every `everyMs`. */
export function useNow(everyMs = 15_000): number {
  const clock = useApp((s) => s.clock)
  const [real, setReal] = useState(() => Date.now())
  useEffect(() => {
    setReal(Date.now())
    const id = window.setInterval(() => setReal(Date.now()), everyMs)
    return () => window.clearInterval(id)
  }, [everyMs, clock])
  return simNowOf(clock, real)
}

/** Time the map and list should render: the scrubber preview, or now. */
export function useViewTs(everyMs = 15_000): { ts: number; now: number; previewing: boolean } {
  const now = useNow(everyMs)
  const preview = useUi((s) => s.previewTs)
  return { ts: preview ?? now, now, previewing: preview !== null }
}
