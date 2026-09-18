import { ChargingStation, Info } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { clock } from '../../lib/time'
import { uid, useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Segmented } from '../ui/Controls'
import { SheetHeader } from '../ui/Sheet'

const HALF_HOUR = 30 * 60_000

export function EvSheet({ venueId }: { venueId: VenueId }) {
  const t = useT()
  const venue = VENUE_BY_ID[venueId]
  const now = useNow(30_000)
  const vehicle = useApp((s) => s.vehicle)
  const addEvBooking = useApp((s) => s.addEvBooking)
  const { close, notify, setTab } = useUi.getState()

  const slots = useMemo(() => {
    const first = Math.ceil((now + 10 * 60_000) / HALF_HOUR) * HALF_HOUR
    return Array.from({ length: 8 }, (_, i) => first + i * HALF_HOUR)
  }, [now])
  const units = Array.from({ length: venue.ev.chargers }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`)

  const [start, setStart] = useState(slots[0])
  const [duration, setDuration] = useState<'30' | '60' | '90'>('60')
  const [unit, setUnit] = useState(units[0])

  // A unit is taken if its index lines up with the slot, deterministic so the grid is stable.
  const taken = (u: string, s: number) => (u.charCodeAt(0) + Number(u[1]) + s / HALF_HOUR) % 3 === 0

  return (
    <div className="pb-4">
      <SheetHeader eyebrow={venue.name} title={t.ev.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 flex gap-2 rounded-[16px] bg-ev/10 p-3 text-[12.5px] leading-relaxed text-ink-2">
        <ChargingStation size={18} weight="fill" className="mt-[1px] shrink-0 text-ev" />
        {t.ev.why}
      </p>
      {!vehicle.isEV && (
        <p className="mb-4 flex gap-2 rounded-[16px] bg-ramai-soft p-3 text-[12.5px] text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
          <Info size={16} className="mt-[1px] shrink-0" />
          {t.ev.notEv}
        </p>
      )}

      <h3 className="mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.ev.start}</h3>
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStart(s)}
            className={clsx(
              'h-11 shrink-0 rounded-[14px] border px-3.5 text-[14px] font-bold tabular',
              s === start ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface',
            )}
          >
            {clock(s)}
          </button>
        ))}
      </div>

      <h3 className="mt-5 mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.ev.duration}</h3>
      <Segmented
        value={duration}
        onChange={setDuration}
        options={[
          { value: '30', label: `30 ${t.unit.min}` },
          { value: '60', label: `60 ${t.unit.min}` },
          { value: '90', label: `90 ${t.unit.min}` },
        ]}
      />

      <h3 className="mt-5 mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">
        {t.ev.charger} · {venue.ev.kw} kW
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {units.map((u) => {
          const busy = taken(u, start)
          return (
            <button
              key={u}
              type="button"
              disabled={busy}
              onClick={() => setUnit(u)}
              className={clsx(
                'flex h-14 flex-col items-center justify-center rounded-[14px] border text-[13px] font-extrabold',
                u === unit && !busy ? 'border-ev bg-ev text-white' : 'border-line bg-surface',
                busy && 'opacity-35 line-through',
              )}
            >
              {u}
            </button>
          )
        })}
      </div>
      <p className="mt-3 px-1 text-[11.5px] text-ink-3">{t.ev.idle}</p>

      <div className="mt-4">
        <Button
          variant="primary"
          size="lg"
          block
          disabled={taken(unit, start)}
          onClick={() => {
            haptic('success')
            addEvBooking({
              id: uid(),
              venueId,
              start,
              durationMin: Number(duration),
              charger: unit,
              createdAt: Date.now(),
            })
            close()
            setTab('activity')
            notify(t.ev.booked)
          }}
        >
          <ChargingStation size={18} weight="fill" />
          {t.ev.confirm} · {clock(start)}
        </Button>
      </div>
    </div>
  )
}
