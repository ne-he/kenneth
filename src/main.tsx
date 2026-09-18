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
  Without the brand video it leaves as soon as React has painted. With the
  video, the parked car of the logo waits on the poster frame until the first
  screen is ready (the map has drawn, when the screen has one), then drives
  off, and the splash fades while it leaves. Nobody is held hostage: the car
  goes 3.2 s after navigation at the latest, and a clip that cannot play just
  lets the splash fade.
*/
const DRIVE_BY = 3200
const FADE_LEAD = 0.35

function dismissSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  let gone = false
  const leave = () => {
    if (gone) return
    gone = true
    el.classList.add('out')
    window.setTimeout(() => el.remove(), 500)
  }
  const video = el.querySelector('video')
  if (!video || !el.classList.contains('has-video')) return leave()
  // When every <source> fails, play() waits forever. The failure only shows on the last source.
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return leave()
  video.querySelector('source:last-of-type')?.addEventListener('error', leave)

  let driving = false
  const drive = () => {
    if (driving) return
    driving = true
    window.removeEventListener(MAP_READY, drive)
    el.classList.add('driving')
    const length = Number.isFinite(video.duration) ? video.duration : 2
    const fadeOut = () => window.setTimeout(leave, Math.max(0, length - video.currentTime - FADE_LEAD) * 1000)
    video.addEventListener('playing', fadeOut, { once: true })
    video.addEventListener('ended', leave, { once: true })
    window.setTimeout(leave, length * 1000 + 1500)
    video.play().catch(leave)
  }
  if (!mapReady() && document.querySelector('[data-map-slot]')) {
    window.addEventListener(MAP_READY, drive)
    window.setTimeout(drive, Math.max(0, DRIVE_BY - performance.now()))
  } else drive()
}

requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
