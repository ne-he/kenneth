import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/*
  The splash is plain HTML in index.html so it shows before any JavaScript.
  Without the brand video it leaves as soon as React has painted. With the
  video it lets the reveal finish, but never holds people hostage: a video
  that has not started by 2.5 s is skipped and nothing stays past 6.5 s.
*/
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
  if (!video || !el.classList.contains('has-video') || video.ended) return leave()
  const since = (ms: number) => Math.max(0, ms - performance.now())
  const cap = window.setTimeout(leave, since(6500))
  const stuck = window.setTimeout(() => video.currentTime === 0 && leave(), since(2500))
  const done = () => {
    window.clearTimeout(cap)
    window.clearTimeout(stuck)
    leave()
  }
  video.addEventListener('ended', done, { once: true })
  video.addEventListener('error', done, { once: true })
}

requestAnimationFrame(() => requestAnimationFrame(dismissSplash))
