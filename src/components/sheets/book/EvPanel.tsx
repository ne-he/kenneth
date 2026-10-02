import { ChargingStation, Info } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { useT } from '../../../i18n'
import { haptic } from '../../../lib/haptics'
import { atWib, clock } from '../../../lib/time'
import { uid, useApp, useVehicle } from '../../../store/app'
import { useNow } from '../../../store/clock'
import { Button } from '../../ui/Button'
import { Segmented } from '../../ui/Controls'
import { Label } from '../../ui/Kit'
import type { Booked } from './BookHub'

const HALF_HOUR = 30 * 60_000

/** Book a charger. The charger itself is the sensor and the enforcer, which is why this one is safe to promise. */
export function EvPanel({ venueId, onDone }: { venueId: VenueId; onDone: (b: Booked) => void }) {
  const t = useT()
  const venue = VENUE_BY_ID[venueId]
  const now = useNow(30_000)
  const vehicle = useVehicle()
  const addEvBooking = useApp((s) => s.addEvBooking)

  // Half-hour starts while the building is open, the last one half an hour before closing.
  const slots = useMemo(() => {
    const first = Math.max(Math.ceil((now + 10 * 60_000) / HALF_HOUR) * HALF_HOUR, atWib(now, venue.hours[0], 0))
    const last = atWib(now, venue.hours[1], 0) - HALF_HOUR
    return Array.from({ length: 8 }, (_, i) => first + i * HALF_HOUR).filter((s) => s <= last)
  }, [now, venue.hours])
  const units = Array.from({ length: venue.ev.chargers }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`)

  // The list moves on as time passes, so a pick that scrolled off falls back to the first start.
  const [picked, setPicked] = useState<number | null>(null)
  const start = slots.find((s) => s === picked) ?? slots[0]
  const [duration, setDuration] = useState<'30' | '60' | '90'>('60')

  // A unit is taken if its index lines up with the slot, deterministic so the grid is stable.
  const taken = (u: string, s: number) => (u.charCodeAt(0) + Number(u[1]) + s / HALF_HOUR) % 3 === 0

  // Open on a unit that is free for the first start, so the pay button is never disabled with no hint why.
  const [unit, setUnit] = useState(() => units.find((u) => !taken(u, slots[0])) ?? units[0])

  if (slots.length === 0) {
    return <p className="rounded-[16px] bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-2">{t.ev.closedToday}</p>
  }

  return (
    <div>
      {!vehicle.isEV && (
        <p className="mb-5 flex gap-2 rounded-[16px] bg-surface-2 p-3 text-[12.5px] text-ink-2">
          <Info size={16} weight="fill" className="mt-[1px] shrink-0 text-ink-3" />
          {t.ev.notEv}
        </p>
      )}

      <Label>{t.ev.start}</Label>
      <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPicked(s)}
            className={clsx(
              'h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold tabular transition-colors',
              s === start ? 'bg-ink text-canvas' : 'bg-surface-2',
            )}
          >
            {clock(s)}
          </button>
        ))}
      </div>

      <Label className="mt-6">{t.ev.duration}</Label>
      <Segmented
        value={duration}
        onChange={setDuration}
        options={[
          { value: '30', label: `30 ${t.unit.min}` },
          { value: '60', label: `60 ${t.unit.min}` },
          { value: '90', label: `90 ${t.unit.min}` },
        ]}
      />

      <Label className="mt-6">
        {t.ev.charger} · {venue.ev.kw} kW
      </Label>
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
                'flex h-14 flex-col items-center justify-center rounded-[16px] text-[13px] font-semibold transition-colors',
                u === unit && !busy ? 'bg-ink text-canvas' : 'bg-surface-2',
                busy && 'opacity-35 line-through',
              )}
            >
              {u}
            </button>
          )
        })}
      </div>
      <p className="mt-3 px-1 text-[11.5px] text-ink-3">{t.ev.idle}</p>

      <div className="mt-5">
        <Button
          variant="primary"
          size="lg"
          block
          disabled={taken(unit, start)}
          onClick={() => {
            const id = uid()
            haptic('success')
            addEvBooking({ id, venueId, start, durationMin: Number(duration), charger: unit, createdAt: Date.now() })
            onDone({ service: 'ev', id, line: `${t.ev.charger} ${unit} · ${clock(start)}-${clock(start + Number(duration) * 60_000)}` })
          }}
        >
          <ChargingStation size={18} weight="fill" />
          {t.ev.confirm} · {clock(start)}
        </Button>
      </div>
    </div>
  )
}
