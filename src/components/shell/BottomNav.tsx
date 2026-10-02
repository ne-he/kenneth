import { House, Ticket, UserCircle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useUi, type Tab } from '../../store/ui'

/**
 * A floating dock: three icon tabs in one glass pill with Beranda (the map)
 * in the middle, so the map runs underneath it edge to edge. Labels are for
 * screen readers only; the active tab is marked by a filled icon and a small
 * cornflower dot. Tapping Beranda again while home brings the map back to the
 * overview. Nothing in the app switches tabs on its own: new bookings put a
 * dot on Aktivitas and the user decides when to look.
 */
export function BottomNav() {
  const t = useT()
  const tab = useUi((s) => s.tab)
  const setTab = useUi((s) => s.setTab)
  const goHome = useUi((s) => s.goHome)
  const badge = useUi((s) => s.activityBadge)

  const go = (key: Tab) => {
    haptic('tap')
    if (key === 'park' && tab === 'park') goHome()
    else setTab(key)
  }

  return (
    <nav aria-label="Menu" className="pb-nav pointer-events-none absolute inset-x-0 bottom-0 z-[45] px-5">
      <div className="glass shadow-float pointer-events-auto mx-auto grid h-[62px] w-full max-w-[420px] grid-cols-3 rounded-full px-3">
        <Item active={tab === 'activity'} onClick={() => go('activity')} label={t.tabs.activity} badge={badge}>
          <Ticket size={25} weight={tab === 'activity' ? 'fill' : 'regular'} />
        </Item>
        <Item active={tab === 'park'} onClick={() => go('park')} label={t.tabs.park}>
          <House size={25} weight={tab === 'park' ? 'fill' : 'regular'} />
        </Item>
        <Item active={tab === 'account'} onClick={() => go('account')} label={t.tabs.account}>
          <UserCircle size={25} weight={tab === 'account' ? 'fill' : 'regular'} />
        </Item>
      </div>
    </nav>
  )
}

function Item({
  active,
  onClick,
  label,
  badge,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  badge?: boolean
  children: ReactNode
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-1 rounded-full transition-colors',
        active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
      )}
    >
      <span className="relative">
        {children}
        {badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-surface bg-penuh"
          />
        )}
      </span>
      <span className={clsx('size-1 rounded-full transition-colors', active ? 'bg-brand-600 dark:bg-brand-400' : 'bg-transparent')} />
    </motion.button>
  )
}
