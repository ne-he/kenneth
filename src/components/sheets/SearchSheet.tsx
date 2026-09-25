import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { VENUES } from '../../data/venues'
import { forKind, snapshot } from '../../engine/occupancy'
import { servicesFor } from '../../engine/services'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useVehicle } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { StatusPill, VenueGlyph } from '../ui/Kit'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '')

export function SearchSheet() {
  const t = useT()
  const now = useNow()
  const [q, setQ] = useState('')
  const close = useUi((s) => s.close)
  const select = useUi((s) => s.select)
  const setTab = useUi((s) => s.setTab)
  const kind = useVehicle().kind

  const rows = useMemo(() => {
    const needle = norm(q.trim())
    // Services and tenants count too, so "valet", "charger" or "bioskop" find the places that have them.
    const haystack = (v: (typeof VENUES)[number]) =>
      norm(
        [
          v.name,
          v.short,
          v.district,
          v.area,
          v.category,
          t.venue.category[v.category],
          ...servicesFor(v, kind).flatMap((s) => [t.book.services[s], t.modes[s].short]),
          ...v.tenants.map((x) => x.name),
        ].join(' '),
      )
    return VENUES.filter((v) => !needle || haystack(v).includes(needle)).map((v) => snapshot(forKind(v, kind), now))
  }, [q, now, kind, t])

  return (
    <div className="pt-1 pb-4">
      <label className="flex h-12 items-center gap-2.5 rounded-2xl border border-transparent bg-surface-2 px-3.5 focus-within:border-brand-500">
        <MagnifyingGlass size={18} className="text-ink-3" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.explore.search}
          className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
          aria-label={t.explore.search}
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label={t.common.cancel} className="text-ink-3">
            <X size={16} weight="bold" />
          </button>
        )}
      </label>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((s) => (
          <li key={s.venue.id}>
            <button
              type="button"
              onClick={() => {
                haptic('tap')
                close()
                setTab('park')
                select(s.venue.id)
              }}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <VenueGlyph category={s.venue.category} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{s.venue.name}</span>
                <span className="text-[12px] text-ink-3">
                  {t.venue.category[s.venue.category]} · {s.venue.district}, {s.venue.area}
                </span>
              </span>
              <StatusPill status={s.status} pct={s.pct} />
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-center text-[13px] text-ink-3">{t.activity.empty}</li>}
      </ul>
    </div>
  )
}
