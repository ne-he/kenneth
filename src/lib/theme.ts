import { useEffect, useSyncExternalStore } from 'react'
import { useApp } from '../store/app'

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

/** Mirrors the resolved theme onto <html data-theme> and the browser chrome color. */
export function useApplyTheme() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#090b0a' : '#f3f2ee')
  }, [theme])
  return theme
}
