import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { MAP_READY, mapReady } from './lib/splash'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
  The splash is plain HTML in index.html so it shows before any JavaScript.
  It stays until the first screen is ready (the map has drawn, when the
  screen has one) so the app appears finished rather than filling in, then
  fades. Nobody is held hostage: it leaves 3.2 s after navigation at the latest.
*/
const LEAVE_BY = 3200

function dismissSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  let gone = false
  const leave = () => {
    if (gone) return
    gone = true
    window.removeEventListener(MAP_READY, leave)
    el.classList.add('out')
    window.setTimeout(() => el.remove(), 350)
  }
  if (!mapReady() && document.querySelector('[data-map-slot]')) {
    window.addEventListener(MAP_READY, leave)
    window.setTimeout(leave, Math.max(0, LEAVE_BY - performance.now()))
  } else leave()
}

requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
