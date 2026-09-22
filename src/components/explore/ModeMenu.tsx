import { CarProfile, Check, Motorcycle, Plus } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { MODES, type ParkMode } from '../../engine/modes'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp, useVehicle } from '../../store/app'
import { useUi } from '../../store/ui'
import { Plate } from '../ui/Display'
import { MODE_ICON } from './modeIcons'

/**
 * The dropdown next to search: what the map is for right now, and which of
 * your vehicles is driving. A motorbike only parks, so the rest is greyed out
 * with the reason instead of disappearing.
 */
export function ModeMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const setMode = useUi((s) => s.setMode)
  const notify = useUi((s) => s.notify)
  const openSheet = useUi((s) => s.open)
  const vehicles = useApp((s) => s.vehicles)
  const setActiveVehicle = useApp((s) => s.setActiveVehicle)
  const active = useVehicle()

  const pick = (m: ParkMode) => {
    haptic('tap')
    setMode(m)
    onClose()
  }

  const drive = (id: string) => {
    haptic('tap')
    const v = vehicles.find((x) => x.id === id)
    setActiveVehicle(id)
    if (v?.kind === 'motor' && mode !== 'park') {
      setMode('park')
      notify(t.modes.motorSwitched)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="scrim"
            type="button"
            aria-label={t.common.close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-[48] cursor-default bg-black/25"
          />
          <motion.div
            key="menu"
            role="dialog"
            aria-label={t.modes.ask}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            className="shadow-float absolute inset-x-3.5 top-[calc(max(12px,var(--safe-top,env(safe-area-inset-top)))+58px)] z-[49] origin-top rounded-[24px] border border-line bg-surface p-2"
          >
            <p className="px-2.5 pt-1.5 pb-1 text-[12px] font-semibold text-ink-3">{t.modes.ask}</p>
            <div role="radiogroup" aria-label={t.modes.ask}>
              {MODES.map((m) => {
                const on = m === mode
                const locked = m !== 'park' && active.kind === 'motor'
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={locked}
                    onClick={() => pick(m)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-[16px] p-2.5 text-left transition-colors disabled:opacity-45',
                      on ? 'bg-lega-soft dark:bg-lega/15' : 'hover:bg-surface-2',
                    )}
                  >
                    <span
                      className={clsx(
                        'grid size-10 shrink-0 place-items-center rounded-[13px]',
                        on ? 'bg-brand-600 text-white' : 'bg-surface-2 text-ink',
                      )}
                    >
                      {MODE_ICON[m]({ size: 20, weight: 'fill' })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold">{t.modes[m].label}</span>
                      <span className="block truncate text-[12.5px] text-ink-2">{locked ? t.modes.carOnly : t.modes[m].hint}</span>
                    </span>
                    {on && <Check size={20} weight="bold" className="shrink-0 text-brand-600 dark:text-brand-400" />}
                  </button>
                )
              })}
            </div>

            <div className="mt-1.5 border-t border-line px-1.5 pt-2.5 pb-1">
              <p className="mb-2 px-1 text-[12px] font-semibold text-ink-3">{t.modes.vehicle}</p>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
                {vehicles.map((v) => {
                  const on = v.id === active.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => drive(v.id)}
                      className={clsx(
                        'flex h-10 shrink-0 items-center gap-2 rounded-full pr-2 pl-3 transition-colors',
                        on ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2 hover:text-ink',
                      )}
                    >
                      {v.kind === 'motor' ? <Motorcycle size={17} weight="fill" /> : <CarProfile size={17} weight="fill" />}
                      <Plate plate={v.plate} small />
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    openSheet({ kind: 'vehicle', id: 'new' })
                  }}
                  className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line-strong px-3.5 text-[13px] font-semibold text-ink-2 hover:text-ink"
                >
                  <Plus size={15} weight="bold" /> {t.modes.addVehicle}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
