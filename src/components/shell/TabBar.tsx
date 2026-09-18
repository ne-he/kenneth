import { ClockCountdown, Compass, UserCircle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { useUi, type Tab } from '../../store/ui'

const ICONS = { activity: ClockCountdown, explore: Compass, profile: UserCircle } as const
const ORDER: Tab[] = ['activity', 'explore', 'profile']

/**
 * The team mockup's idea, kept: on Explore the tabs sit sunken inside the
 * sheet, on the other tabs they float as a glass pill.
 */
export function TabBar({ variant }: { variant: 'sunken' | 'floating' }) {
  const t = useT()
  const tab = useUi((s) => s.tab)
  const setTab = useUi((s) => s.setTab)
  const hasActivity = useApp((s) => !!s.parked || s.passes.some((p) => p.status === 'active'))

  return (
    <nav
      aria-label="Menu"
      className={clsx(
        'grid h-12 grid-cols-3 gap-1 rounded-full p-1',
        variant === 'sunken' ? 'sunken' : 'glass shadow-float',
      )}
    >
      {ORDER.map((key) => {
        const Icon = ICONS[key]
        const active = tab === key
        return (
          <button
            key={key}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              haptic('tap')
              setTab(key)
            }}
            className={clsx(
              'relative flex items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold transition-colors',
              active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-pill-${variant}`}
                className={clsx(
                  'absolute inset-0 rounded-full',
                  variant === 'sunken'
                    ? 'bg-surface shadow-[0_2px_6px_rgb(0_0_0/0.08),0_0.5px_1.5px_rgb(0_0_0/0.05)]'
                    : 'bg-brand-600/12 dark:bg-brand-400/15',
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <Icon size={17} weight={active ? 'fill' : 'regular'} className="relative" />
            <span className="relative">{t.tabs[key]}</span>
            {key === 'activity' && hasActivity && !active && (
              <span className="absolute top-2 right-[18%] size-1.5 rounded-full bg-brand-500" />
            )}
          </button>
        )
      })}
    </nav>
  )
}
