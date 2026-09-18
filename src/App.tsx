import { lazy, Suspense, useSyncExternalStore } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { PhoneApp } from './components/shell/PhoneApp'
import { Showcase } from './components/shell/Showcase'
import { useApplyTheme } from './lib/theme'

const Mitra = lazy(() => import('./pages/Mitra'))
const Booth = lazy(() => import('./pages/Booth'))

const wide = '(min-width: 1024px) and (min-height: 640px)'
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(wide)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

function Home() {
  const isWide = useSyncExternalStore(subscribe, () => window.matchMedia(wide).matches)
  // A phone gets the app edge to edge. A laptop or projector gets the pitch next to a live phone.
  return isWide ? (
    <Showcase>
      <PhoneApp />
    </Showcase>
  ) : (
    <div className="h-[100dvh] w-full">
      <PhoneApp />
    </div>
  )
}

function Pages() {
  useApplyTheme()
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-canvas" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mitra" element={<Mitra />} />
        <Route path="/booth" element={<Booth />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Pages />
    </BrowserRouter>
  )
}
