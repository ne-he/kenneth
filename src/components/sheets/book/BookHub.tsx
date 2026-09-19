import { CheckCircle, QrCode, Ticket } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { VENUE_BY_ID } from '../../../data/venues'
import type { VenueId } from '../../../data/types'
import { servicesFor, type Service } from '../../../engine/services'
import { useT } from '../../../i18n'
import { useVehicle } from '../../../store/app'
import { useUi } from '../../../store/ui'
import { Button } from '../../ui/Button'
import { Segmented } from '../../ui/Controls'
import { SheetHeader } from '../../ui/Sheet'
import { EvPanel } from './EvPanel'
import { PriorityPanel } from './PriorityPanel'
import { ValetPanel } from './ValetPanel'

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
    useUi.getState().markTickets()
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
          <p className="mb-4 px-1 text-[13px] leading-relaxed text-ink-2">{t.book.serviceHint[tab]}</p>
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'priority' && <PriorityPanel venueId={venueId} onDone={done} />}
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
  return (
    <div className="flex flex-col items-center pt-6 pb-5 text-center">
      <motion.span
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 16 }}
        className="grid size-20 place-items-center rounded-full bg-brand-500 text-white shadow-[0_14px_30px_-10px_rgb(16_185_129/0.7)]"
      >
        <CheckCircle size={44} weight="fill" />
      </motion.span>
      <h2 className="mt-5 text-[21px] font-bold tracking-tight">{t.book.booked[booked.service]}</h2>
      <p className="mt-1.5 text-[13.5px] text-ink-2">
        {venueName} · {booked.line}
      </p>
      <p className="mt-3 flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[12px] font-semibold text-ink-2">
        <Ticket size={14} weight="fill" /> {t.book.savedToTickets}
      </p>
      <div className="mt-6 grid w-full grid-cols-2 gap-2">
        <Button variant="secondary" onClick={close}>
          {t.common.done}
        </Button>
        {booked.service === 'ev' ? (
          <Button variant="dark" onClick={() => setTab('tickets')}>
            <Ticket size={17} weight="bold" /> {t.book.seeTickets}
          </Button>
        ) : booked.service === 'valet' ? (
          <Button variant="primary" onClick={() => open({ kind: 'valet', id: booked.id })}>
            <Ticket size={17} weight="bold" /> {t.valet.openTicket}
          </Button>
        ) : (
          <Button variant="primary" onClick={() => open({ kind: 'pass', id: booked.id })}>
            <QrCode size={17} weight="bold" /> {t.activity.showQr}
          </Button>
        )}
      </div>
    </div>
  )
}
