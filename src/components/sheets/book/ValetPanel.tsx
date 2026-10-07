import { Clock, HandCoins, Key, Timer } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { occupancyAt } from '../../../engine/occupancy'
import { formatRupiah } from '../../../engine/pricing'
import { dropQueueMin, retrievalMin, valetSlots } from '../../../engine/valet'
import { useDayLabel, useT } from '../../../i18n'
import { haptic } from '../../../lib/haptics'
import { isPlate } from '../../../lib/plate'
import { clock } from '../../../lib/time'
import { uid, useApp, useVehicle } from '../../../store/app'
import { useNow } from '../../../store/clock'
import { Button } from '../../ui/Button'
import { Label, List } from '../../ui/Kit'
import { Mascot } from '../../ui/Mascot'
import type { Booked } from './BookHub'
import { PlateField } from './PlateField'
import { PayMethods, type PayMethod } from './ZonePanel'

/**
 * Book a KENNETH runner. Pick the lobby and when you will pull up, see how
 * soon a runner reaches you at that hour, pay in the app.
 */
export function ValetPanel({ venueId, onDone }: { venueId: VenueId; onDone: (b: Booked) => void }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const venue = VENUE_BY_ID[venueId]
  const valet = venue.valet!
  const now = useNow(30_000)
  const vehicle = useVehicle()
  const addValet = useApp((s) => s.addValet)
  const saveVehicle = useApp((s) => s.saveVehicle)
  const [plate, setPlate] = useState('')
  const plateOk = !!vehicle.plate || isPlate(plate)
  const [lobby, setLobby] = useState(valet.lobbies[0])
  const [method, setMethod] = useState<PayMethod>('qris')
  const [paying, setPaying] = useState(false)

  const slots = useMemo(() => valetSlots(venue.hours, now), [now, venue.hours])
  const [picked, setPicked] = useState<number | null>(null)
  const arriveAt = slots.find((s) => s === picked) ?? slots[0]

  if (!arriveAt) {
    return (
      <div className="flex items-center gap-3 rounded-[16px] bg-surface-2 py-3 pr-4 pl-3">
        <Mascot pose="sleepy" size={56} />
        <p className="text-[13.5px] leading-relaxed text-ink-2">{t.valet.closedToday}</p>
      </div>
    )
  }

  const occ = occupancyAt(venue, arriveAt)

  const book = () => {
    if (!plateOk) return
    if (!vehicle.plate) saveVehicle({ ...vehicle, id: vehicle.id === 'none' ? uid() : vehicle.id, plate: plate.trim() })
    setPaying(true)
    haptic('tap')
    window.setTimeout(() => {
      const id = uid()
      haptic('success')
      addValet({
        id,
        venueId,
        lobby,
        arriveAt,
        price: valet.price,
        token: `RNR-${id.slice(0, 5).toUpperCase()}`,
        createdAt: Date.now(),
        status: 'active',
      })
      onDone({ service: 'valet', id, line: `${lobby} · ${dayLabel(arriveAt, now)}, ${clock(arriveAt)}` })
    }, 1100)
  }

  return (
    <div>
      {valet.lobbies.length > 1 && (
        <>
          <Label>{t.valet.lobby}</Label>
          <div className="mb-5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.valet.lobby}>
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
                  l === lobby ? 'btn-primary text-white' : 'bg-surface-2 text-ink-2',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </>
      )}

      <Label>{t.valet.arrive}</Label>
      <div className="no-scrollbar -mx-5 mb-5 flex gap-1.5 overflow-x-auto px-5 pb-1">
        {slots.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              haptic('tap')
              setPicked(s)
            }}
            className={clsx(
              'h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold tabular transition-colors',
              s === arriveAt ? 'btn-primary text-white' : 'bg-surface-2',
            )}
          >
            {clock(s)}
          </button>
        ))}
      </div>

      {/* Price, timing and the plate the runner checks: one list instead of a card per fact. */}
      <List className="mb-6">
        <Fact icon={<HandCoins size={18} weight="fill" />} title={formatRupiah(valet.price)} hint={t.valet.payAtDesk} />
        <Fact icon={<Clock size={18} weight="fill" />} title={t.valet.dropQueue(dropQueueMin(occ))} hint={t.valet.dropQueueHint(clock(arriveAt))} />
        <Fact icon={<Timer size={18} weight="fill" />} title={t.valet.retrieval(retrievalMin(occ))} hint={t.valet.retrievalHint} />
        <PlateField saved={vehicle.plate} value={plate} onChange={setPlate} hint={vehicle.plate ? t.valet.plateNote : t.valet.plateMissing} />
      </List>

      <Label>{t.book.payWith}</Label>
      <PayMethods value={method} onChange={setMethod} />

      <div className="sticky bottom-0 z-10 -mx-5 mt-5 bg-surface px-5 pt-2 after:absolute after:inset-x-0 after:top-full after:h-6 after:bg-surface">
        <Button variant="primary" size="lg" block disabled={paying || !plateOk} onClick={book}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={String(paying)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2"
            >
              {paying ? (
                t.valet.paying
              ) : (
                <>
                  <Key size={18} weight="fill" /> {t.valet.confirm} · {formatRupiah(valet.price, true)}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )
}

function Fact({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid w-5 shrink-0 place-items-center text-ink-3">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium tabular">{title}</span>
        <span className="block text-[12px] leading-snug text-ink-3">{hint}</span>
      </span>
    </div>
  )
}
