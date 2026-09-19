import { Clock, HandCoins, Key, Timer } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { occupancyAt } from '../../../engine/occupancy'
import { formatRupiah } from '../../../engine/pricing'
import { dropQueueMin, retrievalMin } from '../../../engine/valet'
import { useDayLabel, useT } from '../../../i18n'
import { haptic } from '../../../lib/haptics'
import { atWib, clock } from '../../../lib/time'
import { uid, useApp, useVehicle } from '../../../store/app'
import { useNow } from '../../../store/clock'
import { useUi } from '../../../store/ui'
import { Button } from '../../ui/Button'
import { Plate } from '../../ui/Display'
import { Label, List } from '../../ui/Kit'
import type { Booked } from './BookHub'

const Q = 15 * 60_000

/**
 * Book the building's own valet. Pick the lobby and when you will pull up,
 * see what the wait looks like at that hour, pay at the desk as usual.
 */
export function ValetPanel({ venueId, onDone }: { venueId: VenueId; onDone: (b: Booked) => void }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const venue = VENUE_BY_ID[venueId]
  const valet = venue.valet!
  const now = useNow(30_000)
  const vehicle = useVehicle()
  const addValet = useApp((s) => s.addValet)
  const open = useUi((s) => s.open)
  const [lobby, setLobby] = useState(valet.lobbies[0])

  const slots = useMemo(() => {
    const first = Math.ceil((now + 10 * 60_000) / Q) * Q
    const last = atWib(now, venue.hours[1], 0) - 60 * 60_000
    const list = []
    for (let s = first; s <= last && list.length < 10; s += Q) list.push(s)
    return list
  }, [now, venue.hours])
  const [picked, setPicked] = useState<number | null>(null)
  const arriveAt = slots.find((s) => s === picked) ?? slots[0]

  if (!arriveAt) {
    return <p className="rounded-[16px] bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-2">{t.valet.closedToday}</p>
  }

  const occ = occupancyAt(venue, arriveAt)

  const book = () => {
    const id = uid()
    haptic('success')
    addValet({
      id,
      venueId,
      lobby,
      arriveAt,
      price: valet.price,
      token: `VLT-${id.slice(0, 5).toUpperCase()}`,
      createdAt: Date.now(),
      status: 'active',
    })
    onDone({ service: 'valet', id, line: `${lobby} · ${dayLabel(arriveAt, now)}, ${clock(arriveAt)}` })
  }

  return (
    <div>
      {valet.lobbies.length > 1 && (
        <>
          <Label>{t.valet.lobby}</Label>
          <div className="mb-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.valet.lobby}>
            {valet.lobbies.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={l === lobby}
                onClick={() => {
                  haptic('tap')
                  setLobby(l)
                }}
                className={clsx(
                  'h-10 rounded-full px-4 text-[13.5px] font-semibold transition-colors',
                  l === lobby ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </>
      )}

      <Label>{t.valet.arrive}</Label>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              haptic('tap')
              setPicked(s)
            }}
            className={clsx(
              'h-11 shrink-0 rounded-[14px] px-3.5 text-[14px] font-bold tabular transition-colors',
              s === arriveAt ? 'bg-ink text-canvas' : 'bg-surface-2',
            )}
          >
            {clock(s)}
          </button>
        ))}
      </div>

      <List className="mb-4">
        <Fact icon={<HandCoins size={17} weight="fill" />} title={formatRupiah(valet.price)} hint={t.valet.payAtDesk} />
        <Fact icon={<Clock size={17} weight="fill" />} title={t.valet.dropQueue(dropQueueMin(occ))} hint={t.valet.dropQueueHint(clock(arriveAt))} />
        <Fact icon={<Timer size={17} weight="fill" />} title={t.valet.retrieval(retrievalMin(occ))} hint={t.valet.retrievalHint} />
      </List>

      <div className="mb-4 flex items-center gap-3 rounded-[16px] bg-surface-2 px-4 py-3">
        <Plate plate={vehicle.plate} />
        <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-2">{vehicle.plate ? t.valet.plateNote : t.valet.plateMissing}</span>
        {!vehicle.plate && (
          <button type="button" onClick={() => open({ kind: 'vehicle' })} className="text-[12.5px] font-bold text-ink underline underline-offset-2">
            {t.common.fill}
          </button>
        )}
      </div>

      <Button variant="primary" size="lg" block onClick={book}>
        <Key size={18} weight="fill" /> {t.valet.confirm} · {clock(arriveAt)}
      </Button>
      <p className="mt-2 text-center text-[11px] leading-snug text-ink-3">{t.valet.demoNote}</p>
    </div>
  )
}

function Fact({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold tabular">{title}</span>
        <span className="block text-[12px] leading-snug text-ink-3">{hint}</span>
      </span>
    </div>
  )
}
