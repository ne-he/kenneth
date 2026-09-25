import { CaretRight, CarProfile, ChargingStation, Crown, Key } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useMemo } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { headline, splitActivity } from '../../engine/activity'
import { valetPhase } from '../../engine/valet'
import { bayOf } from '../../engine/zone'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock, stopwatch } from '../../lib/time'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'

/**
 * One line at the top of the Parkir sheet for whatever is going on right now:
 * the valet bringing the car back, a pass window that is open, the car you
 * parked. Tap it and the ticket opens on top of the map, no tab switch.
 */
export function LiveStrip() {
  const t = useT()
  const now = useNow(1000)
  const parked = useApp((s) => s.parked)
  const passes = useApp((s) => s.passes)
  const valets = useApp((s) => s.valets)
  const evBookings = useApp((s) => s.evBookings)
  const { open, setTab } = useUi.getState()

  const item = useMemo(
    () => headline(splitActivity({ parked, passes, valets, evBookings, reminders: [], history: [] }, now), now),
    [parked, passes, valets, evBookings, now],
  )
  if (!item || item.kind === 'reminder') return null

  let icon = <CarProfile size={16} weight="fill" />
  let text = ''
  let hot = false
  let go = () => open({ kind: 'find-car' })

  if (item.kind === 'parked' && parked) {
    const v = VENUE_BY_ID[parked.venueId]
    text = t.activity.parkedLive(`${v.short} · ${parked.level} ${parked.section}-${parked.pillar}`)
  } else if (item.kind === 'valet') {
    const ticket = valets.find((v) => v.id === item.id)!
    const phase = valetPhase(ticket, now)
    icon = <Key size={16} weight="fill" />
    hot = phase === 'ready'
    text = `${VENUE_BY_ID[ticket.venueId].short} · ${
      phase === 'fetching'
        ? t.valet.readyIn(stopwatch(Math.max(0, (ticket.readyAt ?? now) - now)))
        : phase === 'ready'
          ? t.valet.readyNow(ticket.lobby)
          : t.valet.phases[phase]
    }`
    go = () => open({ kind: 'valet', id: ticket.id })
  } else if (item.kind === 'pass') {
    const pass = passes.find((p) => p.id === item.id)!
    const venue = VENUE_BY_ID[pass.venueId]
    icon = <Crown size={16} weight="fill" />
    hot = now >= pass.windowStart
    text = `${venue.short} · ${t.activity.passLive(bayOf(pass, venue), clock(pass.windowStart))}`
    go = () => open({ kind: 'pass', id: pass.id })
  } else if (item.kind === 'ev') {
    const b = evBookings.find((x) => x.id === item.id)!
    const pct = Math.min(100, Math.max(0, Math.round(((now - b.start) / (b.durationMin * 60_000)) * 100)))
    icon = <ChargingStation size={16} weight="fill" />
    text = `${VENUE_BY_ID[b.venueId].short} · ${now >= b.start ? t.activity.evLive(pct) : `${t.activity.kind.ev} ${clock(b.start)}`}`
    go = () => setTab('activity')
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => {
        haptic('tap')
        go()
      }}
      className={clsx(
        'mx-4 mb-3 flex w-[calc(100%-2rem)] items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-[13px] font-semibold',
        hot ? 'bg-brand-600 text-white' : 'bg-lega-soft text-lega-ink dark:bg-lega/15 dark:text-led-lega',
      )}
    >
      <span className={clsx('relative grid size-6 shrink-0 place-items-center rounded-full', hot ? 'bg-white/20' : 'bg-lega/15')}>
        {icon}
        <span className={clsx('absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full', hot ? 'bg-white' : 'bg-lega')} />
      </span>
      <span className="min-w-0 flex-1 truncate">{text}</span>
      <CaretRight size={14} weight="bold" className="shrink-0 opacity-70" />
    </motion.button>
  )
}
