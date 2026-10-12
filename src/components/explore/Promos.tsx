import { CalendarStar, Car, Tag, UsersThree } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { PROMOS, promosAt } from '../../data/promos'
import type { VenueId } from '../../data/types'
import { useLang, useT } from '../../i18n'
import { useMerchant } from '../../store/merchant'
import { Label, List } from '../ui/Kit'

const hh = (h: number) => `${String(h).padStart(2, '0')}.00`

/**
 * What the shops at this place offer today. A parking perk gets its own line,
 * since that is the saving a driver can count on, and an event that draws a
 * crowd warns that the car park fills faster.
 */
export function Promos({ venueId, ts }: { venueId: VenueId; ts: number }) {
  const t = useT()
  const lang = useLang()
  // Promos a merchant made in the dashboard show beside the ones the app ships with.
  const mine = useMerchant((s) => s.promos)
  const items = useMemo(() => promosAt(venueId, ts, [...mine, ...PROMOS]), [venueId, ts, mine])
  if (items.length === 0) return null

  return (
    <section>
      <Label aside={t.promo.count(items.length)}>{t.promo.title}</Label>
      <List plain>
        {items.map(({ promo, state }) => (
          <div key={promo.id} className="flex items-start gap-3 px-1 py-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2">
              {promo.kind === 'event' ? <CalendarStar size={17} weight="fill" /> : <Tag size={17} weight="fill" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-medium text-ink-3">
                {promo.merchant} · {promo.floor}
              </span>
              <span className="mt-0.5 block text-[14.5px] leading-snug font-medium">{promo.title[lang]}</span>
              <span className="mt-1 block text-[12.5px] text-ink-3">
                {state === 'now' ? t.promo.until(hh(promo.to)) : t.promo.from(hh(promo.from))}
              </span>
              {promo.parking && (
                <span className="mt-2 flex items-start gap-1.5 rounded-[12px] bg-lega-soft px-2.5 py-1.5 text-[12.5px] leading-snug font-medium text-lega-ink dark:bg-lega/15 dark:text-led-lega">
                  <Car size={14} weight="fill" className="mt-px shrink-0" />
                  {promo.parking[lang]}
                </span>
              )}
              {promo.busy && (
                <span className="mt-2 flex items-start gap-1.5 rounded-[12px] bg-ramai-soft px-2.5 py-1.5 text-[12.5px] leading-snug font-medium text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
                  <UsersThree size={14} weight="fill" className="mt-px shrink-0" />
                  {t.promo.busy}
                </span>
              )}
            </span>
            {state === 'now' && (
              <span className="mt-0.5 shrink-0 rounded-full bg-brand-600/12 px-2 py-0.5 text-[11.5px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                {t.promo.now}
              </span>
            )}
          </div>
        ))}
      </List>
    </section>
  )
}
