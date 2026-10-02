import { ChargingStation, Crown, Key, ListBullets, NavigationArrow } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import type { VenueId } from '../../data/types'
import { cardIndexAt } from '../../engine/home'
import type { PinFact } from '../../engine/modes'
import { formatRupiah } from '../../engine/pricing'
import type { Ranked } from '../../engine/recommend'
import { useT } from '../../i18n'
import { formatKm } from '../../lib/geo'
import { haptic } from '../../lib/haptics'
import { STATUS, formatMin } from '../../lib/status'
import { useUi } from '../../store/ui'
import { useNavigation } from '../nav/useNavigation'

const CARD_W = 236
const GAP = 10

/**
 * The map-first home: one row of compact cards that scrolls sideways, in the
 * same order as the list. Swiping to a card highlights its pin, tapping a
 * card opens the place. The full list is one tap away, so the map keeps most
 * of the screen.
 */
export function VenueCarousel({
  ranked,
  facts,
  focused,
  onFocus,
  onList,
}: {
  ranked: Ranked[]
  facts: ReadonlyMap<VenueId, PinFact>
  focused: VenueId | null
  onFocus: (id: VenueId) => void
  onList: () => void
}) {
  const t = useT()
  const select = useUi((s) => s.select)
  const nav = useNavigation()
  const scroller = useRef<HTMLDivElement>(null)
  const settle = useRef<number | null>(null)

  // Scroll-snap settles on a card; report it once the scroll has stopped.
  const onScroll = () => {
    if (settle.current) window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = scroller.current
      if (!el) return
      const r = ranked[cardIndexAt(el.scrollLeft, ranked.length, CARD_W, GAP)]
      if (r && r.venue.id !== focused) onFocus(r.venue.id)
    }, 90)
  }

  // A pin tapped on the map brings its card into view.
  useEffect(() => {
    const el = scroller.current
    if (!el || !focused) return
    const i = ranked.findIndex((r) => r.venue.id === focused)
    if (i < 0) return
    const target = i * (CARD_W + GAP)
    if (Math.abs(el.scrollLeft - target) > 4) el.scrollTo({ left: target, behavior: 'smooth' })
  }, [focused, ranked])

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-3">
      <div className="pointer-events-auto mb-2.5 flex justify-end px-3.5">
        <button
          type="button"
          onClick={() => {
            haptic('tap')
            onList()
          }}
          className="glass shadow-float flex h-10 items-center gap-2 rounded-full pr-4 pl-3.5 text-[13px] font-semibold text-ink"
        >
          <ListBullets size={16} weight="bold" />
          {t.explore.list(ranked.length)}
        </button>
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar pointer-events-auto flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3.5 pb-1"
        style={{ scrollPaddingLeft: 14 }}
      >
        {ranked.map((r) => {
          const on = r.venue.id === focused
          return (
            <article
              key={r.venue.id}
              className={clsx(
                'shadow-float shrink-0 snap-start rounded-[22px] bg-surface p-4 transition-opacity',
                on ? 'opacity-100' : 'opacity-85',
              )}
              style={{ width: CARD_W }}
            >
              <button
                type="button"
                onClick={() => {
                  haptic('tap')
                  select(r.venue.id)
                }}
                className="block w-full text-left"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold tracking-tight">{r.venue.name}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-3">
                      <span className={clsx('size-2 shrink-0 rounded-full', STATUS[r.status].dot)} />
                      <span className="tabular">{r.pct}%</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate tabular">
                        {r.queueMin >= 2 ? `${t.explore.queue} ${formatMin(r.queueMin)} ${t.unit.min}` : t.explore.noQueue}
                      </span>
                    </span>
                  </span>
                  <Value fact={facts.get(r.venue.id)} minutes={r.timeToPark} km={r.travel.km} here={t.explore.here} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => nav.start(r.venue.id)}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink text-[13px] font-semibold text-canvas"
              >
                <NavigationArrow size={14} weight="fill" />
                {t.card.routeTo(r.bestGate.name)}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/** Top right of a card: minutes to a bay when parking, otherwise what the mode is about. */
function Value({ fact, minutes, km, here }: { fact?: PinFact; minutes: number; km: number; here: string }) {
  const t = useT()
  const big = 'text-[17px] leading-none font-semibold tracking-tight tabular'
  const small = 'mt-1 block text-right text-[11.5px] text-ink-3 tabular'
  switch (fact?.kind) {
    case 'price':
      return (
        <span className="shrink-0 text-right">
          <span className={clsx(big, 'flex items-center justify-end gap-1')}>
            <Crown size={12} weight="fill" className="text-brand-600 dark:text-brand-300" />
            {fact.left > 0 ? formatRupiah(fact.price, true) : t.modes.soldOut}
          </span>
          <span className={small}>{km < 0.15 ? here : formatKm(km)}</span>
        </span>
      )
    case 'wait':
      return (
        <span className="shrink-0 text-right">
          <span className={clsx(big, 'flex items-center justify-end gap-1')}>
            <Key size={12} weight="fill" className="text-ink-3" />
            {fact.min} <span className="text-[11.5px] font-medium text-ink-3">{t.unit.min}</span>
          </span>
          <span className={small}>{km < 0.15 ? here : formatKm(km)}</span>
        </span>
      )
    case 'chargers':
      return (
        <span className="shrink-0 text-right">
          <span className={clsx(big, 'flex items-center justify-end gap-1')}>
            <ChargingStation size={12} weight="fill" className="text-ev" />
            {t.modes.free(fact.free, fact.total)}
          </span>
          <span className={small}>{km < 0.15 ? here : formatKm(km)}</span>
        </span>
      )
    default:
      return (
        <span className="shrink-0 text-right">
          <span className={big}>
            {Math.round(minutes)} <span className="text-[11.5px] font-medium text-ink-3">{t.unit.min}</span>
          </span>
          <span className={small}>{km < 0.15 ? here : formatKm(km)}</span>
        </span>
      )
  }
}
