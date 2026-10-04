import { CaretDown, MagnifyingGlass, MapPin, Plus } from '@phosphor-icons/react'
import clsx from 'clsx'
import { SERVICES, type ParkMode } from '../../engine/modes'
import { useT } from '../../i18n'
import { shortModel } from '../../lib/carBody'
import { haptic } from '../../lib/haptics'
import { useApp, useVehicle } from '../../store/app'
import { useUi, type VenueFilter } from '../../store/ui'
import { VehicleIcon } from '../ui/VehicleIcon'
import { LiveStrip } from './LiveStrip'

const FILTERS: VenueFilter[] = ['all', 'fav', 'kampus', 'mall']

/**
 * The home sheet at rest, Uber style: the map is the stage and the hierarchy
 * lives down here. Plain parking is what the map shows when nothing is picked,
 * the three paid services are toggles, and the vehicle beside the question
 * decides which numbers the pins use. Pulling the sheet up reveals the ranked list.
 */
export function HomeHeader() {
  const t = useT()
  const open = useUi((s) => s.open)
  return (
    <div className="pb-3">
      <LiveStrip />
      <div className="px-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 text-[19px] leading-tight font-semibold tracking-tight">{t.explore.search}</h1>
          <VehicleChip />
        </div>
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            open({ kind: 'search' })
          }}
          className="mt-2.5 flex h-11 w-full items-center gap-2.5 rounded-full bg-surface-2 px-4 text-left text-[15px] text-ink-3 transition-colors hover:bg-surface-3"
        >
          <MagnifyingGlass size={18} className="shrink-0 text-ink-2" />
          <span className="truncate">{t.explore.searchField}</span>
        </button>
        <ServiceToggles />
      </div>
    </div>
  )
}

/**
 * Three toggles on one line, names only: three full names and their icons do
 * not fit a phone width, and the name is what people read. They share the row
 * equally while there is room and scroll on a very narrow phone, never wrap.
 * The one that is on gets the accent tint. The hints stay for screen readers;
 * a motorbike sees the row greyed with one reason under it.
 */
function ServiceToggles() {
  const t = useT()
  const mode = useUi((s) => s.mode)
  const toggleService = useUi((s) => s.toggleService)
  const locked = useVehicle().kind === 'motor'
  return (
    <>
      <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5" role="group" aria-label={t.modes.services}>
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
                'h-11 min-w-max flex-1 basis-0 rounded-full px-2.5 text-[13px] font-semibold tracking-tight whitespace-nowrap transition-colors disabled:opacity-45',
                on ? 'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-100' : 'bg-surface-2 text-ink hover:bg-surface-3',
              )}
            >
              {t.modes[m].label}
              <span className="sr-only">, {t.modes[m].hint}</span>
            </button>
          )
        })}
      </div>
      {locked && <p className="mt-1.5 px-1 text-[12px] text-ink-3">{t.modes.carOnly}</p>}
    </>
  )
}

/**
 * The vehicle this search is for, beside the question the way Uber shows the
 * rider by the destination. People know their car by its model and shape, so
 * the chip shows those; the plates wait in the picker. Its own shape keeps it
 * apart from the service toggles below.
 */
function VehicleChip() {
  const t = useT()
  const none = useApp((s) => s.vehicles.length === 0)
  const active = useVehicle()
  const open = useUi((s) => s.open)
  const name = none ? t.modes.vehicle : shortModel(active.model) || active.plate || t.profile.kinds[active.kind]
  return (
    <button
      type="button"
      aria-label={t.modes.vehicleChip(name)}
      onClick={() => {
        haptic('tap')
        open(none ? { kind: 'vehicle', id: 'new' } : { kind: 'vehicles' })
      }}
      className="flex h-9 max-w-[10.5rem] shrink-0 items-center gap-1.5 rounded-full border border-line pr-2.5 pl-3 text-[13.5px] font-semibold text-ink transition-colors hover:bg-surface-2"
    >
      {none ? <Plus size={15} weight="bold" className="shrink-0" /> : <VehicleIcon vehicle={active} size={22} className="shrink-0" />}
      <span className="truncate">{name}</span>
      <CaretDown size={11} weight="bold" className="shrink-0 text-ink-3" />
    </button>
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
      {/* The selected filter is the one accent pill in the row, the rest are plain words. */}
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
              filter === f ? 'btn-primary text-white' : 'text-ink-3 hover:text-ink',
            )}
          >
            {t.explore.filters[f]}
          </button>
        ))}
      </div>
    </div>
  )
}
