import { CarProfile, Check, MagnifyingGlass, MapPin, Motorcycle, Plus } from '@phosphor-icons/react'
import clsx from 'clsx'
import { SERVICES, type ParkMode } from '../../engine/modes'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp, useVehicle } from '../../store/app'
import { useUi, type VenueFilter } from '../../store/ui'
import { Plate } from '../ui/Display'
import { LiveStrip } from './LiveStrip'
import { MODE_ICON } from './modeIcons'

const FILTERS: VenueFilter[] = ['all', 'fav', 'kampus', 'mall']

/**
 * The home sheet at rest, Uber style: the map is the stage and the hierarchy
 * lives down here. Plain parking is what the map shows when nothing is picked,
 * the three paid services are toggles, and the vehicle row decides which
 * numbers the pins use. Pulling the sheet up reveals the ranked list.
 */
export function HomeHeader() {
  const t = useT()
  const open = useUi((s) => s.open)
  return (
    <div className="pb-4">
      <LiveStrip />
      <div className="px-5">
        <h1 className="text-[21px] leading-tight font-semibold tracking-tight">{t.explore.search}</h1>
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'search' })
          }}
          className="mt-3 flex h-12 w-full items-center gap-2.5 rounded-full bg-surface-2 px-4 text-left text-[15px] text-ink-3 transition-colors hover:bg-surface-3"
        >
          <MagnifyingGlass size={18} className="shrink-0 text-ink-2" />
          <span className="truncate">{t.explore.searchField}</span>
        </button>
        <ServiceToggles />
        <VehicleRow />
      </div>
    </div>
  )
}

/** Three equal cards. The one that is on gets the cornflower tint; a motorbike sees them all greyed with the reason. */
function ServiceToggles() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const toggleService = useUi((s) => s.toggleService)
  const locked = useVehicle().kind === 'motor'
  return (
    <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={t.modes.services}>
      {SERVICES.map((m) => {
        const on = m === mode
        return (
          <button
            key={m}
            type="button"
            role="switch"
            aria-checked={on}
            disabled={locked}
            onClick={() => {
              haptic('tap')
              toggleService(m)
            }}
            className={clsx(
              'relative flex flex-col items-start rounded-[18px] p-3 text-left transition-colors disabled:opacity-45',
              on ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-100' : 'bg-surface-2 text-ink hover:bg-surface-3',
            )}
          >
            <span
              className={clsx(
                'grid size-7 place-items-center rounded-full',
                on ? 'bg-surface text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-surface text-ink dark:bg-surface-3',
              )}
            >
              {MODE_ICON[m]({ size: 15, weight: 'fill' })}
            </span>
            {on && <Check size={14} weight="bold" className="absolute top-3 right-3 text-brand-700 dark:text-brand-300" />}
            <span className="mt-2.5 block text-[13px] leading-tight font-semibold tracking-tight">{t.modes[m].label}</span>
            <span className={clsx('mt-0.5 line-clamp-2 text-[11.5px] leading-snug', on ? 'opacity-75' : 'text-ink-3')}>
              {locked ? t.modes.carOnly : t.modes[m].hint}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Which of your vehicles is driving. A motorbike only parks, so picking one drops any service. */
function VehicleRow() {
  const t = useT()
  const vehicles = useApp((s) => s.vehicles)
  const setActiveVehicle = useApp((s) => s.setActiveVehicle)
  const active = useVehicle()
  const mode = useUi((s) => s.mode)
  const setMode = useUi((s) => s.setMode)
  const notify = useUi((s) => s.notify)
  const open = useUi((s) => s.open)

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
    <div className="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" role="group" aria-label={t.modes.vehicle}>
      {vehicles.map((v) => {
        const on = v.id === active.id
        return (
          <button
            key={v.id}
            type="button"
            aria-pressed={on}
            onClick={() => drive(v.id)}
            className={clsx(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full pr-1.5 pl-2.5 transition-colors',
              on ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2 hover:text-ink',
            )}
          >
            {v.kind === 'motor' ? <Motorcycle size={15} weight="fill" /> : <CarProfile size={15} weight="fill" />}
            <Plate plate={v.plate} small />
          </button>
        )
      })}
      <button
        type="button"
        onClick={() => {
          haptic('tap')
          open({ kind: 'vehicle', id: 'new' })
        }}
        className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-line-strong px-3 text-[12.5px] font-semibold text-ink-2 hover:text-ink"
      >
        <Plus size={13} weight="bold" /> {t.modes.addVehicle}
      </button>
    </div>
  )
}

/**
 * The top of the list once the sheet is pulled up: what the number on each
 * row means in this mode, where distances count from, and the filters. It
 * sticks while the list scrolls under it.
 */
export function ListHeader({ mode, count }: { mode: ParkMode; count: number }) {
  const t = useT()
  const originLabel = useUi((s) => s.originLabel)
  const filter = useUi((s) => s.filter)
  const setFilter = useUi((s) => s.setFilter)
  return (
    <div className="sticky top-0 z-10 bg-surface pb-2">
      <div className="px-5 pb-2.5">
        <h2 className="truncate text-[15px] leading-tight font-semibold tracking-tight">{t.modes.listTitle[mode]}</h2>
        <div className="mt-0.5 flex items-center justify-between gap-3 text-[13px] text-ink-3">
          <p className="min-w-0 truncate">{t.modes.count[mode](count)}</p>
          <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <MapPin size={12} weight="fill" />
            {originLabel === 'gps' ? t.explore.fromGps : t.explore.fromBinus}
          </span>
        </div>
      </div>
      {/* The selected filter is the one ink pill in the row, the rest are plain words. */}
      <div className="no-scrollbar flex gap-0.5 overflow-x-auto px-5" role="radiogroup" aria-label={t.modes.listTitle[mode]}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={filter === f}
            onClick={() => {
              haptic('tap')
              setFilter(f)
            }}
            className={clsx(
              'h-8 shrink-0 rounded-full px-3.5 text-[13.5px] font-medium transition-colors',
              filter === f ? 'bg-ink text-canvas' : 'text-ink-3 hover:text-ink',
            )}
          >
            {t.explore.filters[f]}
          </button>
        ))}
      </div>
    </div>
  )
}
