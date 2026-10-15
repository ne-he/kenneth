import { CheckCircle, Receipt, Tag } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { PROMOS } from '../../data/promos'
import { VENUE_BY_ID } from '../../data/venues'
import { forKind } from '../../engine/occupancy'
import { formatRupiah } from '../../engine/pricing'
import { checkout } from '../../engine/session'
import { useLang, useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { stopwatch, wib } from '../../lib/time'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useMerchantPromos } from '../../store/merchant'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { SheetHeader } from '../ui/Sheet'

/**
 * Leaving the car park: the bill at the venue's tariff, hour by hour, and the
 * merchant parking perks running here today. Ticking one takes its free hours
 * off. KENNETH does not take the payment; the user pays at the barrier as
 * usual and the cost goes into the history.
 */
export function CheckoutSheet() {
  const t = useT()
  const lang = useLang()
  const now = useNow(30_000)
  const spot = useApp((s) => s.parked)
  const leave = useApp((s) => s.leave)
  const { close, notify } = useUi.getState()
  const shared = useMerchantPromos()
  const [perkId, setPerkId] = useState<string | null>(null)

  // Any perk that ran here today counts, even if it ended before the car left: the receipt is still valid.
  const perks = useMemo(() => {
    if (!spot) return []
    const { day, hourF } = wib(now)
    return [...shared, ...PROMOS].filter((p) => p.venueId === spot.venueId && p.freeHours && p.days.includes(day) && p.from <= hourF)
  }, [spot, now, shared])
  if (!spot) return null
  const venue = forKind(VENUE_BY_ID[spot.venueId], spot.kind ?? 'mobil')
  const elapsed = now - spot.at
  const perk = perks.find((p) => p.id === perkId)
  const bill = checkout(venue, elapsed, perk?.freeHours ?? 0)

  return (
    <div className="pb-5">
      <SheetHeader eyebrow={venue.name} title={t.park.receipt} onClose={close} closeLabel={t.common.close} />

      <div className="rounded-[20px] border border-line bg-surface">
        <Line label={t.park.duration} value={stopwatch(elapsed)} note={t.park.hoursBilled(bill.billed)} />
        <Line label={t.park.firstHour} value={formatRupiah(venue.tariff.firstHour, true)} />
        {bill.billed > 1 && <Line label={t.park.nextHours(bill.billed - 1)} value={formatRupiah(bill.gross - venue.tariff.firstHour, true)} />}
        {bill.saved > 0 && <Line label={`${t.park.perkSaved} · ${perk?.merchant}`} value={`−${formatRupiah(bill.saved, true)}`} good />}
        <div className="flex items-baseline justify-between border-t border-line px-4 py-3.5">
          <span className="text-[15px] font-semibold">{t.park.pay}</span>
          <span className="text-[24px] font-semibold tracking-tight tabular">{formatRupiah(bill.paid, true)}</span>
        </div>
      </div>

      {perks.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 px-1 text-[13px] font-semibold text-ink-3">{t.park.perkTitle}</div>
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {perks.map((p) => {
              const on = perkId === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    haptic('tap')
                    setPerkId(on ? null : p.id)
                  }}
                  className="flex w-full items-center gap-3 border-t border-line px-4 py-3 text-left first:border-t-0"
                >
                  <Tag size={17} weight="fill" className="shrink-0 text-ink-3" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium">{p.merchant}</span>
                    <span className="block text-[12px] text-ink-3">{p.parking?.[lang]}</span>
                  </span>
                  <span
                    className={clsx(
                      'shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold',
                      on ? 'bg-lega-soft text-lega-ink dark:bg-lega/15 dark:text-led-lega' : 'bg-surface-2 text-ink-2',
                    )}
                  >
                    {on ? <CheckCircle size={13} weight="fill" className="mr-1 inline align-[-2px]" /> : null}
                    {t.park.perkHours(p.freeHours ?? 0)}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 px-1 text-[12px] text-ink-3">{t.park.perkHint}</p>
        </div>
      )}

      <p className="mt-4 flex gap-2 px-1 text-[12px] leading-snug text-ink-3">
        <Receipt size={15} className="mt-px shrink-0" /> {t.park.payNote}
      </p>

      <Button
        variant="primary"
        block
        className="mt-4"
        onClick={() => {
          haptic('success')
          leave({ paid: bill.paid, saved: bill.saved, perk: perk?.merchant })
          close()
          notify(t.park.left)
        }}
      >
        {t.park.done}
      </Button>
    </div>
  )
}

function Line({ label, value, note, good }: { label: string; value: string; note?: string; good?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
      <span className="min-w-0">
        <span className="block text-[14px]">{label}</span>
        {note && <span className="block text-[12px] text-ink-3">{note}</span>}
      </span>
      <span className={clsx('shrink-0 text-[14.5px] font-semibold tabular', good && 'text-lega-ink dark:text-led-lega')}>{value}</span>
    </div>
  )
}
