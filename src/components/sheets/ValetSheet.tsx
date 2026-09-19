import { CarProfile, FastForward, Key, Timer } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { occupancyAt } from '../../engine/occupancy'
import { formatRupiah } from '../../engine/pricing'
import { retrievalMin, valetPhase } from '../../engine/valet'
import { useDayLabel, useT } from '../../i18n'
import { clock, stopwatch } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Plate } from '../ui/Display'
import { SheetHeader } from '../ui/Sheet'
import { useValetActions } from './book/useValetActions'

/** The valet ticket. One big next step at a time: hand over, call the car, pick it up. */
export function ValetSheet({ id }: { id: string }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const now = useNow(1000)
  const ticket = useApp((s) => s.valets.find((v) => v.id === id))
  const demo = useApp((s) => s.clock.mode === 'scenario')
  const plate = useVehicle().plate
  const close = useUi((s) => s.close)
  const act = useValetActions()
  const [qr, setQr] = useState('')

  useEffect(() => {
    if (!ticket) return
    QRCode.toDataURL(`kenneth://valet/${ticket.token}`, { margin: 1, width: 360, color: { dark: '#0c0f0d', light: '#ffffff' } }).then(setQr)
  }, [ticket])

  if (!ticket) return null
  const venue = VENUE_BY_ID[ticket.venueId]
  const phase = valetPhase(ticket, now)
  const fetchLeft = Math.max(0, (ticket.readyAt ?? now) - now)
  const fetchTotal = Math.max(1, (ticket.readyAt ?? now) - (ticket.requestedAt ?? now))

  return (
    <div className="pb-5">
      <SheetHeader eyebrow={`${t.book.services.valet} · ${t.valet.phases[phase]}`} title={venue.name} onClose={close} closeLabel={t.common.close} />

      {(phase === 'booked' || phase === 'parked') && (
        <div className="mx-auto mb-4 w-full max-w-[220px] rounded-[22px] border border-line bg-white p-3">
          {qr ? <img src={qr} alt={ticket.token} className="aspect-square w-full" /> : <div className="aspect-square w-full" />}
          <div className="mt-1.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] text-[#0c0f0d]">{ticket.token}</div>
        </div>
      )}

      {phase === 'fetching' && (
        <div className="mb-4 flex flex-col items-center rounded-[22px] bg-surface-2 py-6">
          <Timer size={26} className="text-ink-2" />
          <div className="mt-2 font-mono text-[34px] leading-none font-bold tabular">{stopwatch(fetchLeft)}</div>
          <div className="mt-1.5 text-[12.5px] text-ink-3">{t.valet.readyAt(clock(ticket.readyAt ?? now))}</div>
          <div className="mt-4 h-1.5 w-2/3 overflow-hidden rounded-full bg-surface-3">
            <motion.div className="h-full rounded-full bg-brand-500" animate={{ width: `${Math.min(100, (1 - fetchLeft / fetchTotal) * 100)}%` }} />
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4 flex flex-col items-center rounded-[22px] bg-brand-600 py-6 text-white"
        >
          <CarProfile size={30} weight="fill" />
          <div className="mt-2 text-[19px] font-bold">{t.valet.readyNow(ticket.lobby)}</div>
        </motion.div>
      )}

      <div className="mb-4 grid grid-cols-3 divide-x divide-line rounded-[18px] border border-line py-3 text-center">
        <Cell label={t.valet.lobbyShort} value={ticket.lobby} />
        <Cell label={t.valet.arriveShort} value={`${dayLabel(ticket.arriveAt, now) === t.common.today ? '' : dayLabel(ticket.arriveAt, now) + ' '}${clock(ticket.arriveAt)}`} />
        <Cell label={t.valet.price} value={formatRupiah(ticket.price, true)} />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-[16px] bg-surface-2 px-4 py-3 text-[12.5px] text-ink-2">
        <span>{phase === 'booked' ? t.valet.showTicket : t.valet.payAtDesk}</span>
        <Plate plate={plate} />
      </div>

      {phase === 'booked' && (
        <div className="grid grid-cols-[1fr_1.6fr] gap-2">
          <Button variant="secondary" onClick={() => act.cancel(ticket)}>
            {t.valet.cancel}
          </Button>
          <Button variant="dark" onClick={() => act.handover(ticket)}>
            <Key size={17} weight="fill" /> {t.valet.handover}
          </Button>
        </div>
      )}
      {phase === 'parked' && (
        <>
          <Button variant="primary" size="lg" block onClick={() => act.call(ticket)}>
            <CarProfile size={18} weight="fill" /> {t.valet.callCar}
          </Button>
          <p className="mt-2 text-center text-[12px] text-ink-3">
            {t.valet.callHint(retrievalMin(occupancyAt(venue, now)))}
          </p>
        </>
      )}
      {phase === 'fetching' && demo && (
        <Button variant="secondary" block onClick={() => act.rush(ticket)}>
          <FastForward size={16} weight="fill" /> {t.valet.rush}
        </Button>
      )}
      {phase === 'ready' && (
        <Button variant="dark" size="lg" block onClick={() => {
            act.pickUp(ticket)
            close()
          }}>
          {t.valet.pickedUp}
        </Button>
      )}
      {phase === 'lapsed' && (
        <>
          <p className="mb-3 text-center text-[13px] text-ink-2">{t.valet.lapsedHint}</p>
          <Button variant="secondary" block onClick={() => {
              act.cancel(ticket)
              close()
            }}>
            {t.valet.remove}
          </Button>
        </>
      )}
    </div>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2">
      <div className="truncate text-[14px] font-bold tabular">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-3">{label}</div>
    </div>
  )
}
