import { useEffect, useSyncExternalStore } from 'react'
import { useApp } from '../store/app'
import { applyAccent } from './accent'

const query = '(prefers-color-scheme: dark)'

function subscribe(cb: () => void) {
  const mq = window.matchMedia(query)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

const systemDark = () => window.matchMedia(query).matches

export function useResolvedTheme(): 'light' | 'dark' {
  const pref = useApp((s) => s.theme)
  const sys = useSyncExternalStore(subscribe, systemDark, () => false)
  return pref === 'system' ? (sys ? 'dark' : 'light') : pref
}

/** Mirrors the resolved theme onto <html data-theme> and the browser chrome color, and the accent onto the brand variables. */
export function useApplyTheme() {
  const theme = useResolvedTheme()
  const accent = useApp((s) => s.accent)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // index.html has one colour per system scheme for the splash. From here the app's own theme decides, so both
    // tags get its colour and stop listening to the system.
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute('content', theme === 'dark' ? '#0b0b0e' : '#f6f6f3')
      meta.removeAttribute('media')
    })
  }, [theme])
  useEffect(() => {
    applyAccent(accent)
  }, [accent])
  return theme
}
