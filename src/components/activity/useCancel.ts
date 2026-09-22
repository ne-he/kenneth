import { useT } from '../../i18n'
import { simNowOf, useApp } from '../../store/app'
import { useUi } from '../../store/ui'

/** Cancelling a priority pass or a charger. Valet has its own in useValetActions. Both leave the booking in Riwayat. */
export function useCancel() {
  const t = useT()
  const now = () => simNowOf(useApp.getState().clock)
  const notify = (text: string) => useUi.getState().notify(text)
  return {
    pass(id: string) {
      useApp.getState().cancelPass(id, now())
      notify(t.activity.cancelledRefund)
    },
    ev(id: string) {
      useApp.getState().cancelEvBooking(id, now())
      notify(t.activity.evCancelled)
    },
  }
}
