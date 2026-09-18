import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { VENUES } from '../../data/venues'
import { snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { STATUS } from '../../lib/status'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { StatusBadge } from '../ui/Display'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '')

export function SearchSheet() {
  const t = useT()
  const now = useNow()
  const [q, setQ] = useState('')
  const close = useUi((s) => s.close)
  const select = useUi((s) => s.select)
  const setTab = useUi((s) => s.setTab)

  const rows = useMemo(() => {
    const needle = norm(q.trim())
    return VENUES.filter((v) => !needle || norm(`${v.name} ${v.short} ${v.district} ${v.area}`).includes(needle)).map(
      (v) => snapshot(v, now),
    )
  }, [q, now])

  return (
    <div className="pt-1 pb-4">
      <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-surface-2 px-3.5">
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
                setTab('explore')
                select(s.venue.id)
              }}
              className="flex w-full items-center gap-3 py-3 text-left"
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-[13px] text-[12.5px] font-extrabold text-white tabular"
                style={{ background: STATUS[s.status].hex }}
              >
                {s.pct}%
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{s.venue.name}</span>
                <span className="text-[12px] text-ink-3">
                  {s.venue.district}, {s.venue.area}
                </span>
              </span>
              <StatusBadge status={s.status} />
            </button>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-center text-[13px] text-ink-3">{t.activity.empty}</li>}
      </ul>
    </div>
  )
}
