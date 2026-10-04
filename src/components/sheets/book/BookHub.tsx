import { Check, Crown, Ticket } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { servicesFor, type Service } from '../../../engine/services'
import { useT } from '../../../i18n'
import { useApp, useVehicle } from '../../../store/app'
import { useUi } from '../../../store/ui'
import { useCancel } from '../../activity/useCancel'
import { Button } from '../../ui/Button'
import { CancelConfirm } from '../../ui/CancelConfirm'
import { Segmented } from '../../ui/Controls'
import { SheetHeader } from '../../ui/Sheet'
import { EvPanel } from './EvPanel'
import { useValetActions } from './useValetActions'
import { ValetPanel } from './ValetPanel'
import { ZonePanel } from './ZonePanel'

export interface Booked {
  service: Service
  id: string
  line: string
}

/**
 * One sheet for everything you can book at a venue. Same three steps for
 * each service (pick, check, confirm), and the result stays on screen: the
 * app never jumps to another tab by itself.
 */
export function BookHub({ venueId, service }: { venueId: VenueId; service?: Service }) {
  const t = useT()
  const venue = VENUE_BY_ID[venueId]
  const vehicle = useVehicle()
  const close = useUi((s) => s.close)
  const services = servicesFor(venue, vehicle.kind)
  const [tab, setTab] = useState<Service | undefined>(service && services.includes(service) ? service : services[0])
  const [booked, setBooked] = useState<Booked | null>(null)

  const done = (b: Booked) => {
    useUi.getState().markActivity()
    setBooked(b)
  }

  if (booked) return <BookedView booked={booked} venueName={venue.name} />

  return (
    <div className="pb-4">
      <SheetHeader eyebrow={venue.name} title={t.book.title} onClose={close} closeLabel={t.common.close} />
      {!tab ? (
        <p className="rounded-[16px] bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-2">
          {vehicle.kind === 'motor' ? t.venue.motorNoBook : t.venue.noBook}
        </p>
      ) : (
        <>
          {services.length > 1 && (
            <Segmented
              value={tab}
              onChange={setTab}
              options={services.map((s) => ({ value: s, label: t.book.services[s] }))}
              className="mb-3"
            />
          )}
          <p className="mb-5 px-1 text-[13px] leading-snug text-ink-3">{t.book.serviceHint[tab]}</p>
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'zone' && <ZonePanel venueId={venueId} onDone={done} />}
            {tab === 'valet' && <ValetPanel venueId={venueId} onDone={done} />}
            {tab === 'ev' && <EvPanel venueId={venueId} onDone={done} />}
          </motion.div>
        </>
      )}
    </div>
  )
}

function BookedView({ booked, venueName }: { booked: Booked; venueName: string }) {
  const t = useT()
  const { close, open, setTab } = useUi.getState()
  const cancel = useCancel()
  const valet = useValetActions()
  const undo = () => {
    if (booked.service === 'zone') cancel.pass(booked.id)
    else if (booked.service === 'ev') cancel.ev(booked.id)
    else {
      const ticket = useApp.getState().valets.find((v) => v.id === booked.id)
      if (ticket) valet.cancel(ticket)
    }
    close()
  }
  const policy =
    booked.service === 'zone' ? t.activity.cancelPolicy : booked.service === 'valet' ? t.activity.valetCancelPolicy : t.activity.evCancelPolicy
  return (
    <div className="flex flex-col items-center pt-8 pb-5 text-center">
      {/* A booking is the brand moment: a soft cornflower tint, no glow. */}
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        className="grid size-16 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
      >
        <Check size={30} weight="bold" />
      </motion.span>
      <h2 className="mt-5 text-[21px] font-semibold tracking-tight">{t.book.booked[booked.service]}</h2>
      <p className="mt-1.5 text-[13.5px] text-ink-2">
        {venueName} · {booked.line}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3">
        <Ticket size={14} weight="fill" /> {t.book.savedToTickets}
      </p>
      <div className="mt-7 grid w-full grid-cols-[1fr_1.45fr] gap-2">
        <Button variant="ghost" onClick={close}>
          {t.common.done}
        </Button>
        {booked.service === 'ev' ? (
          <Button variant="primary" onClick={() => setTab('activity')}>
            <Ticket size={17} weight="bold" /> {t.book.seeTickets}
          </Button>
        ) : booked.service === 'valet' ? (
          <Button variant="primary" onClick={() => open({ kind: 'valet', id: booked.id })}>
            <Ticket size={17} weight="bold" /> {t.valet.openTicket}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => open({ kind: 'pass', id: booked.id })}>
            <Crown size={17} weight="fill" /> {t.activity.showQr}
          </Button>
        )}
      </div>
      <CancelConfirm className="mt-3 w-full" label={t.activity.wrongBooking} policy={policy} onConfirm={undo} />
    </div>
  )
}
