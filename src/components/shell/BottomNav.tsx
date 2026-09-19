import { MapTrifold, Ticket, UserCircle } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useUi, type Tab } from '../../store/ui'

const ITEMS: { key: Tab; Icon: typeof MapTrifold }[] = [
  { key: 'explore', Icon: MapTrifold },
  { key: 'tickets', Icon: Ticket },
  { key: 'account', Icon: UserCircle },
]

/**
 * Three tabs, same place on every screen, always labelled. Nothing in the app
 * switches tabs on its own: after a booking the ticket gets a dot here and the
 * user decides when to look.
 */
export function BottomNav() {
  const t = useT()
  const tab = useUi((s) => s.tab)
  const setTab = useUi((s) => s.setTab)
  const badge = useUi((s) => s.ticketsBadge)

  return (
    <nav
      aria-label="Menu"
      className="pb-nav absolute inset-x-0 bottom-0 z-[45] border-t border-line bg-surface/95 backdrop-blur-xl"
    >
      <div className="grid h-14 grid-cols-3">
        {ITEMS.map(({ key, Icon }) => {
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
                'relative flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
              )}
            >
              <span className="relative">
                <Icon size={24} weight={active ? 'fill' : 'regular'} />
                {key === 'tickets' && badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-1 size-2.5 rounded-full border-2 border-surface bg-brand-500"
                  />
                )}
              </span>
              <span className="text-[11px] font-semibold">{t.tabs[key]}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
