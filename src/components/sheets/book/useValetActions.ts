import { VENUE_BY_ID } from '../../../data/venues'
import { occupancyAt } from '../../../engine/occupancy'
import { retrievalMin, type ValetTicket } from '../../../engine/valet'
import { useT } from '../../../i18n'
import { haptic } from '../../../lib/haptics'
import { askNotificationPermission } from '../../../lib/notify'
import { simNowOf, useApp } from '../../../store/app'
import { useUi } from '../../../store/ui'

/** The four things a valet ticket can do next. Shared by the ticket card and the ticket sheet. */
export function useValetActions() {
  const t = useT()
  const now = () => simNowOf(useApp.getState().clock)
  const { updateValet, finishValet } = useApp.getState()
  const notify = (text: string) => useUi.getState().notify(text)

  return {
    handover(ticket: ValetTicket) {
      haptic('success')
      updateValet(ticket.id, { droppedAt: now() })
      notify(t.valet.handedOver)
    },
    call(ticket: ValetTicket) {
      const at = now()
      const minutes = retrievalMin(occupancyAt(VENUE_BY_ID[ticket.venueId], at))
      haptic('success')
      updateValet(ticket.id, { requestedAt: at, readyAt: at + minutes * 60_000 })
      notify(t.valet.called(minutes))
      askNotificationPermission()
    },
    /** Demo only: skip the wait so a booth visitor sees the car arrive. */
    rush(ticket: ValetTicket) {
      updateValet(ticket.id, { readyAt: now() })
    },
    pickUp(ticket: ValetTicket) {
      haptic('success')
      finishValet(ticket.id, now())
      notify(t.valet.done)
    },
    cancel(ticket: ValetTicket) {
      updateValet(ticket.id, { status: 'cancelled', closedAt: now() })
      notify(t.valet.cancelled)
    },
  }
}
