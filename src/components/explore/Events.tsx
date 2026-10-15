import { CalendarStar, CaretRight, Prohibit, UsersThree } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { eventsToday } from '../../data/cityEvents'
import { PROMOS } from '../../data/promos'
import { VENUE_BY_ID } from '../../data/venues'
import { useLang, useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useNow } from '../../store/clock'
import { useMerchantPromos } from '../../store/merchant'
import { useUi } from '../../store/ui'
import { SheetHeader } from '../ui/Sheet'

const hh = (h: number) => `${String(h).padStart(2, '0')}.00`

function useEvents() {
  const now = useNow(60_000)
  const shared = useMerchantPromos()
  return useMemo(() => eventsToday(now, [...shared, ...PROMOS]), [now, shared])
}

/** One line on the home sheet when something today changes how parking goes. Hidden on a quiet day. */
export function EventsLine() {
  const t = useT()
  const lang = useLang()
  const events = useEvents()
  if (events.length === 0) return null
  const first = events[0]
  return (
    <button
      type="button"
      onClick={() => {
        haptic('tap')
        useUi.getState().open({ kind: 'events' })
      }}
      className="mt-2.5 flex w-full items-center gap-2 rounded-full bg-ramai-soft px-3.5 py-2 text-left text-[12.5px] font-medium text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai"
    >
      <CalendarStar size={15} weight="fill" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {first.title[lang]}
        {events.length > 1 ? ` ${t.events.more(events.length - 1)}` : ''}
      </span>
      <CaretRight size={13} weight="bold" className="shrink-0" />
    </button>
  )
}

/** Today's events with the places they touch; tap a place to see it on the map. */
export function EventsSheet() {
  const t = useT()
  const lang = useLang()
  const events = useEvents()
  const { close, select } = useUi.getState()
  return (
    <div className="pb-5">
      <SheetHeader title={t.events.title} onClose={close} closeLabel={t.common.close} />
      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="rounded-[20px] border border-line bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ramai-soft text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
                {e.effect === 'closed' ? <Prohibit size={17} weight="bold" /> : <UsersThree size={17} weight="fill" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{e.title[lang]}</span>
                <span className="block text-[12.5px] text-ink-3 tabular">
                  {hh(e.from)}–{hh(e.to)} · {e.effect === 'closed' ? t.events.closed : t.events.busy}
                </span>
                <span className="mt-1.5 block text-[13px] leading-snug text-ink-2">{e.note[lang]}</span>
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.venues.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    haptic('tap')
                    close()
                    select(id)
                  }}
                  className="h-8 rounded-full border border-line px-3 text-[12.5px] font-medium text-ink-2 hover:text-ink"
                >
                  {VENUE_BY_ID[id].name}
                </button>
              ))}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="py-6 text-center text-[13px] text-ink-3">{t.events.none}</p>}
      </div>
    </div>
  )
}
