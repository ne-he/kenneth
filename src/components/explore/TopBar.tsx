import { CarProfile, Crosshair, MagnifyingGlass, Motorcycle, StackSimple } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { VENUE_BY_ID, VENUES } from '../../data/venues'
import { useT, useLang } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock, dayName } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useUi } from '../../store/ui'
import { fitPoints } from '../map/mapApi'
import { IconButton } from '../ui/Button'
import { LogoMark } from '../ui/Logo'

// Jabodetabek, so Alam Sutera and Bekasi count as "here" too.
const AREA = { minLat: -6.45, maxLat: -6.05, minLng: 106.55, maxLng: 107.1 }

/** Search on top, then only the chips that matter right now: the demo clock, motorbike mode, your parked car. */
export function TopBar({ now }: { now: number }) {
  const t = useT()
  const lang = useLang()
  const mode = useApp((s) => s.clock.mode)
  const parked = useApp((s) => s.parked)
  const kind = useVehicle().kind
  const open = useUi((s) => s.open)
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="pt-safe pointer-events-none absolute inset-x-0 top-0 z-20 px-3.5"
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'search' })
          }}
          className="glass shadow-float flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full pr-4 pl-1.5 text-left text-[15px] text-ink-3"
        >
          <LogoMark size={36} shape="circle" />
          <MagnifyingGlass size={17} className="shrink-0 text-ink-2" />
          <span className="truncate">{t.explore.search}</span>
        </button>
        <IconButton label={t.mapOptions.title} onClick={() => open({ kind: 'map-options' })} big>
          <StackSimple size={20} weight="bold" />
        </IconButton>
      </div>
      <div className="pointer-events-auto mt-2 flex max-w-[calc(100%-52px)] flex-wrap gap-1.5">
        <Chip onClick={() => open({ kind: 'clock' })} label={t.profile.clock}>
          <span className={mode === 'live' ? 'size-1.5 animate-pulse rounded-full bg-brand-500' : 'size-1.5 rounded-full bg-ramai'} />
          <span className="tabular">
            {dayName(now, lang)} {clock(now)}
          </span>
          <span className="text-ink-3">{mode === 'live' ? t.common.live : t.common.simulated}</span>
        </Chip>
        {kind === 'motor' && (
          <Chip onClick={() => open({ kind: 'vehicle' })} label={t.explore.motorMode}>
            <Motorcycle size={14} weight="fill" /> {t.explore.motorMode}
          </Chip>
        )}
        {parked && (
          <Chip onClick={() => open({ kind: 'find-car' })} label={t.park.findCar}>
            <CarProfile size={14} weight="fill" className="text-brand-600 dark:text-brand-400" />
            {VENUE_BY_ID[parked.venueId].short} · {parked.level} {parked.zone}-{parked.pillar}
          </Chip>
        )}
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
    <div className="absolute top-[calc(max(12px,var(--safe-top,env(safe-area-inset-top)))+60px)] right-3.5 z-20 flex flex-col gap-2">
      <IconButton label={t.explore.locate} onClick={locate} disabled={busy} big>
        <Crosshair size={19} weight="bold" className={busy ? 'animate-spin' : ''} />
      </IconButton>
      <IconButton label={t.explore.fitAll} onClick={() => fitPoints([origin, ...VENUES.map((v) => v.coords)])} big>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" />
        </svg>
      </IconButton>
    </div>
  )
}
