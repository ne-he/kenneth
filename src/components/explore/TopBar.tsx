import { Crosshair, User } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useT, useLang } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock, dayName } from '../../lib/time'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { IconButton } from '../ui/Button'

// Jabodetabek, so Alam Sutera and Bekasi count as "here" too.
const AREA = { minLat: -6.45, maxLat: -6.05, minLng: 106.55, maxLng: 107.1 }

/**
 * One quiet row over the map: a small Demo label with the simulated time on
 * the left (nothing at all in live mode), locate and the account on the
 * right. The clock is a tool for the team and is changed in Akun, Untuk tim
 * dan demo (UX audit #7). Search and the services live in the sheet below.
 */
export function TopBar({ now }: { now: number }) {
  const t = useT()
  const lang = useLang()
  const clockMode = useApp((s) => s.clock.mode)
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="pt-safe pointer-events-none absolute inset-x-0 top-0 z-20 px-3.5"
    >
      <div className="flex items-center justify-between gap-2">
        {clockMode === 'live' ? (
          <span />
        ) : (
          // Yellow means ramai on this map, so the label gets a neutral dot.
          <span
            role="note"
            aria-label={`${t.common.demo}, ${dayName(now, lang, false)} ${clock(now)}`}
            className="glass flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium text-ink-2 shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.16)]"
          >
            <span className="size-1.5 rounded-full bg-ink-3" />
            <span className="font-semibold text-ink">{t.common.demo}</span>
            <span className="text-ink-3 tabular">
              {dayName(now, lang)} {clock(now)}
            </span>
          </span>
        )}
        <div className="pointer-events-auto flex items-center gap-2">
          <LocateButton />
          <AvatarButton />
        </div>
      </div>
    </motion.div>
  )
}

/** You, top right of the map: the first letter of your name, or your photo once signed in. Opens Akun. */
function AvatarButton() {
  const t = useT()
  const name = useApp((s) => s.name)
  const photo = useApp((s) => s.account?.photo)
  const setTab = useUi((s) => s.setTab)
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <motion.button
      type="button"
      aria-label={t.tabs.account}
      title={t.tabs.account}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        haptic('tap')
        setTab('account')
      }}
      className="glass shadow-float grid size-10 place-items-center overflow-hidden rounded-full text-[15px] font-semibold text-ink"
    >
      {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initial || <User size={18} weight="bold" className="text-ink-2" />}
    </motion.button>
  )
}

function LocateButton() {
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
    <IconButton label={t.explore.locate} onClick={locate} disabled={busy}>
      <Crosshair size={18} className={busy ? 'animate-spin' : ''} />
    </IconButton>
  )
}
