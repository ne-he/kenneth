import { Crosshair, MagnifyingGlass } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { VENUES } from '../../data/venues'
import { useT, useLang } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock, dayName } from '../../lib/time'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { fitPoints } from '../map/mapApi'
import { IconButton } from '../ui/Button'
import { LogoMark } from '../ui/Logo'

const JAKARTA = { minLat: -6.45, maxLat: -6.05, minLng: 106.6, maxLng: 107.05 }

export function TopBar({ now }: { now: number }) {
  const t = useT()
  const lang = useLang()
  const mode = useApp((s) => s.clock.mode)
  const open = useUi((s) => s.open)
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="pt-safe absolute inset-x-0 top-0 z-20 px-3.5"
    >
      <div className="glass shadow-float flex h-12 items-center gap-2.5 rounded-full pr-1.5 pl-1.5">
        <LogoMark size={36} className="rounded-full" />
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'search' })
          }}
          className="flex h-full min-w-0 flex-1 items-center gap-2 text-left text-[14px] text-ink-3"
        >
          <MagnifyingGlass size={16} className="shrink-0" />
          <span className="truncate">{t.explore.search}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'clock' })
          }}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[12px] font-bold"
          aria-label={t.profile.clock}
        >
          <span className={mode === 'live' ? 'size-1.5 animate-pulse rounded-full bg-brand-500' : 'size-1.5 rounded-full bg-ramai'} />
          <span className="tabular">
            {dayName(now, lang)} {clock(now)}
          </span>
        </button>
      </div>
    </motion.div>
  )
}

export function MapButtons() {
  const t = useT()
  const origin = useUi((s) => s.origin)
  const setOrigin = useUi((s) => s.setOrigin)
  const notify = useUi((s) => s.notify)
  const [busy, setBusy] = useState(false)

  const locate = () => {
    if (!('geolocation' in navigator)) return notify(t.explore.locateFail)
    setBusy(true)
    notify(t.explore.locating)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false)
        const inside =
          coords.latitude > JAKARTA.minLat &&
          coords.latitude < JAKARTA.maxLat &&
          coords.longitude > JAKARTA.minLng &&
          coords.longitude < JAKARTA.maxLng
        if (!inside) return notify(t.explore.locateFail)
        setOrigin([coords.longitude, coords.latitude], 'gps')
        notify(t.explore.fromGps)
      },
      () => {
        setBusy(false)
        notify(t.explore.locateFail)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="absolute top-[calc(max(12px,env(safe-area-inset-top))+60px)] right-3.5 z-20 flex flex-col gap-2">
      <IconButton label={t.explore.locate} onClick={locate} disabled={busy}>
        <Crosshair size={18} weight="bold" className={busy ? 'animate-spin' : ''} />
      </IconButton>
      <IconButton label="Semua lokasi" onClick={() => fitPoints([origin, ...VENUES.map((v) => v.coords)])}>
        <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" />
        </svg>
      </IconButton>
    </div>
  )
}
