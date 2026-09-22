import { Ticket, UserCircle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import kRoad from '../../assets/k-road.webp'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useUi, type Tab } from '../../store/ui'

/**
 * Three tabs, same place on every screen, always labelled. The K in the middle
 * is home (map plus booking) and stands out the way the QRIS button does in a
 * banking app. Tapping it again while home brings the map back to the
 * overview. Nothing in the app switches tabs on its own: new bookings put a
 * dot on Aktivitas and the user decides when to look.
 */
export function BottomNav() {
  const t = useT()
  const tab = useUi((s) => s.tab)
  const setTab = useUi((s) => s.setTab)
  const goHome = useUi((s) => s.goHome)
  const badge = useUi((s) => s.activityBadge)
  const home = tab === 'park'

  const go = (key: Tab) => {
    haptic('tap')
    if (key === 'park' && home) goHome()
    else setTab(key)
  }

  return (
    <nav aria-label="Menu" className="pb-nav absolute inset-x-0 bottom-0 z-[45] border-t border-line bg-surface/95 backdrop-blur-xl">
      <div className="grid h-14 grid-cols-[1fr_96px_1fr]">
        <Side active={tab === 'activity'} onClick={() => go('activity')} label={t.tabs.activity} dot={badge}>
          <Ticket size={24} weight={tab === 'activity' ? 'fill' : 'regular'} />
        </Side>

        <button
          type="button"
          aria-current={home ? 'page' : undefined}
          aria-label={t.tabs.park}
          onClick={() => go('park')}
          className="relative flex flex-col items-center justify-end pb-1.5"
        >
          <motion.span
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 600, damping: 28 }}
            className={clsx(
              'absolute -top-[26px] grid size-[56px] place-items-center rounded-full border border-line bg-surface shadow-[0_10px_24px_-8px_hsl(var(--shadow-color)/0.45)] transition-[box-shadow]',
              home && 'ring-[3px] ring-brand-500',
            )}
          >
            <img src={kRoad} alt="" width={38} height={38} draggable={false} className="size-[38px] select-none" />
          </motion.span>
          <span className={clsx('text-[11px] font-bold', home ? 'text-ink' : 'text-ink-3')}>{t.tabs.park}</span>
        </button>

        <Side active={tab === 'account'} onClick={() => go('account')} label={t.tabs.account}>
          <UserCircle size={24} weight={tab === 'account' ? 'fill' : 'regular'} />
        </Side>
      </div>
    </nav>
  )
}

function Side({
  active,
  onClick,
  label,
  dot,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  dot?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-0.5 transition-colors',
        active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-3 hover:text-ink-2',
      )}
    >
      <span className="relative">
        {children}
        {dot && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-surface bg-penuh"
          />
        )}
      </span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  )
}
