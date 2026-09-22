import { CaretDown, Crosshair, MagnifyingGlass, Motorcycle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useT, useLang } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock, dayName } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useUi } from '../../store/ui'
import { IconButton } from '../ui/Button'
import { MODE_ICON } from './modeIcons'

// Jabodetabek, so Alam Sutera and Bekasi count as "here" too.
const AREA = { minLat: -6.45, maxLat: -6.05, minLng: 106.55, maxLng: 107.1 }

/**
 * Search, and next to it the one dropdown that decides what the map is for.
 * Under it only the demo clock. Everything else lives in the sheet.
 */
export function TopBar({ now, menuOpen, onMenu }: { now: number; menuOpen: boolean; onMenu: () => void }) {
  const t = useT()
  const lang = useLang()
  const clockMode = useApp((s) => s.clock.mode)
  const mode = useUi((s) => s.mode)
  const kind = useVehicle().kind
  const open = useUi((s) => s.open)
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className={clsx('pt-safe pointer-events-none absolute inset-x-0 top-0 px-3.5', menuOpen ? 'z-[49]' : 'z-20')}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'search' })
          }}
          className="glass shadow-float flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 text-left text-[15px] text-ink-3"
        >
          <MagnifyingGlass size={18} weight="bold" className="shrink-0 text-ink-2" />
          <span className="truncate">{t.explore.search}</span>
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label={`${t.modes.ask} ${t.modes[mode].label}`}
          onClick={() => {
            haptic('tap')
            onMenu()
          }}
          className="shadow-float flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-ink pr-3 pl-3.5 text-[14px] font-bold text-canvas"
        >
          {kind === 'motor' ? <Motorcycle size={18} weight="fill" /> : MODE_ICON[mode]({ size: 18, weight: 'fill' })}
          <span>{kind === 'motor' ? t.explore.motorMode : t.modes[mode].short}</span>
          <motion.span animate={{ rotate: menuOpen ? 180 : 0 }} className="grid place-items-center">
            <CaretDown size={13} weight="bold" />
          </motion.span>
        </button>
      </div>
      <div className="pointer-events-auto mt-2 flex">
        <Chip onClick={() => open({ kind: 'clock' })} label={t.profile.clock}>
          <span className={clockMode === 'live' ? 'size-1.5 animate-pulse rounded-full bg-brand-500' : 'size-1.5 rounded-full bg-ramai'} />
          <span className="tabular">
            {dayName(now, lang)} {clock(now)}
          </span>
          <span className="text-ink-3">{clockMode === 'live' ? t.common.live : t.common.simulated}</span>
        </Chip>
      </div>
    </motion.div>
  )
}

function Chip({ children, onClick, label }: { children: ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className="glass shadow-float flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold"
    >
      {children}
    </button>
  )
}

export function MapButtons() {
  const t = useT()
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
          coords.latitude > AREA.minLat &&
          coords.latitude < AREA.maxLat &&
          coords.longitude > AREA.minLng &&
          coords.longitude < AREA.maxLng
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
    <div className="absolute top-[calc(max(12px,var(--safe-top,env(safe-area-inset-top)))+60px)] right-3.5 z-20">
      <IconButton label={t.explore.locate} onClick={locate} disabled={busy} big>
        <Crosshair size={19} weight="bold" className={busy ? 'animate-spin' : ''} />
      </IconButton>
    </div>
  )
}
