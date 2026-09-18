import { Broadcast, CalendarBlank, Check } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { atWib, nextSaturdayAt, wib } from '../../lib/time'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { SheetHeader } from '../ui/Sheet'

/** Upcoming occurrence of a WIB weekday at a given time. */
function nextDayAt(day: number, hour: number, minute: number) {
  const now = Date.now()
  const ahead = (day - wib(now).day + 7) % 7
  return atWib(now + ahead * 86_400_000, hour, minute)
}

export function ClockSheet() {
  const t = useT()
  const clock = useApp((s) => s.clock)
  const setClock = useApp((s) => s.setClock)
  const close = useUi((s) => s.close)
  const setPreview = useUi((s) => s.setPreview)

  const presets = [
    { key: 'sat-peak', label: t.clockSheet.satPeak, ts: nextSaturdayAt(Date.now(), 14, 7) },
    { key: 'sat-eve', label: t.clockSheet.satEvening, ts: nextSaturdayAt(Date.now(), 17, 0) },
    { key: 'fri', label: t.clockSheet.fridayNight, ts: nextDayAt(5, 19, 0) },
    { key: 'tue', label: t.clockSheet.tuesday, ts: nextDayAt(2, 10, 0) },
  ]

  const pick = (mode: 'live' | 'scenario', ts?: number) => {
    haptic('success')
    setPreview(null)
    setClock(mode, ts)
    close()
  }

  const isActive = (ts: number) =>
    clock.mode === 'scenario' && Math.abs(clock.anchorSim - ts) < 60_000

  return (
    <div className="pb-4">
      <SheetHeader eyebrow={t.profile.demo} title={t.clockSheet.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 text-[13px] leading-relaxed text-ink-2">{t.clockSheet.body}</p>
      <div className="space-y-2">
        <Option
          icon={<Broadcast size={18} weight="fill" />}
          label={t.clockSheet.live}
          active={clock.mode === 'live'}
          onClick={() => pick('live')}
        />
        {presets.map((p) => (
          <Option
            key={p.key}
            icon={<CalendarBlank size={18} weight="fill" />}
            label={p.label}
            active={isActive(p.ts)}
            onClick={() => pick('scenario', p.ts)}
          />
        ))}
      </div>
    </div>
  )
}

function Option({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-[18px] border p-3.5 text-left transition-colors',
        active ? 'border-brand-500/40 bg-brand-50 dark:bg-brand-400/10' : 'border-line bg-surface hover:bg-surface-2',
      )}
    >
      <span className={clsx('grid size-9 place-items-center rounded-full', active ? 'bg-brand-600 text-white' : 'bg-surface-2 text-ink-2')}>
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-semibold">{label}</span>
      {active && <Check size={18} weight="bold" className="text-brand-600" />}
    </button>
  )
}
