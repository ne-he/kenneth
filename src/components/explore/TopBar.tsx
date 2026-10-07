import { Crosshair, User } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { IconButton } from '../ui/Button'

// Jabodetabek, so Alam Sutera and Bekasi count as "here" too.
const AREA = { minLat: -6.45, maxLat: -6.05, minLng: 106.55, maxLng: 107.1 }

/**
 * One quiet row over the map: locate and the account, on the right. Search
 * and the services live in the sheet below. Nothing here says which moment
 * the app shows: the clock is the team's, in team mode.
 */
export function TopBar() {
  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="pt-safe pointer-events-none absolute inset-x-0 top-0 z-20 px-3.5"
    >
      <div className="flex items-center justify-end gap-2">
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
