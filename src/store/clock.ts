import { useSyncExternalStore } from 'react'
import { simNowOf, useApp } from './app'
import { useUi } from './ui'

/*
  One shared ticker per interval. Every component asking for the same rate
  reads the same timestamp on the same tick, and there is one timer per rate
  instead of one per component.
*/
interface Ticker {
  now: number
  subscribe: (onTick: () => void) => () => void
}

const tickers = new Map<number, Ticker>()

function tickerFor(everyMs: number): Ticker {
  const existing = tickers.get(everyMs)
  if (existing) return existing
  const listeners = new Set<() => void>()
  let timer = 0
  const ticker: Ticker = {
    now: Date.now(),
    subscribe(onTick) {
      if (listeners.size === 0) {
        // The ticker may have been idle for a while, so start from a fresh reading.
        ticker.now = Date.now()
        timer = window.setInterval(() => {
          ticker.now = Date.now()
          listeners.forEach((l) => l())
        }, everyMs)
      }
      listeners.add(onTick)
      onTick()
      return () => {
        listeners.delete(onTick)
        if (listeners.size === 0) window.clearInterval(timer)
      }
    },
  }
  tickers.set(everyMs, ticker)
  return ticker
}

/** Current simulated time, re-rendering every `everyMs`. */
export function useNow(everyMs = 15_000): number {
  const clock = useApp((s) => s.clock)
  const ticker = tickerFor(everyMs)
  const real = useSyncExternalStore(ticker.subscribe, () => ticker.now)
  // A scenario set a moment ago must not read earlier than the moment it was set.
  return simNowOf(clock, clock.mode === 'scenario' ? Math.max(real, clock.anchorReal) : real)
}

/** Time the map and list should render: the scrubber preview, or now. */
export function useViewTs(everyMs = 15_000): { ts: number; now: number; previewing: boolean } {
  const now = useNow(everyMs)
  const preview = useUi((s) => s.previewTs)
  return { ts: preview ?? now, now, previewing: preview !== null }
}
