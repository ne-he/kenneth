import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { OccupancyStatus, VehicleKind } from '../../data/types'
import type { Snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { STATUS } from '../../lib/status'
import { CountUp } from '../ui/Display'

/**
 * How many bays are left, said plainly: one big number, a small ring for how
 * full the place is, and the status word inside it. The data source sits right
 * under the number so the estimate never reads as a fact.
 */
export function SlotsLeft({ snap, kind = 'mobil', source }: { snap: Snapshot; kind?: VehicleKind; source: ReactNode }) {
  const t = useT()
  return (
    <section className="flex items-center gap-5 px-1">
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] text-ink-3">{kind === 'motor' ? t.venue.sisaSlotMotor : t.venue.sisaSlot}</h3>
        <CountUp value={snap.free} grouped className="mt-1.5 block text-[44px] leading-none font-semibold tracking-tight" />
        <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-ink-3">
          <span className="tabular">
            {t.venue.of} {snap.venue.capacity.toLocaleString('id-ID')} {kind === 'motor' ? t.unit.motorSlots : t.unit.slots}
          </span>
          <span aria-hidden="true">·</span>
          {source}
        </div>
      </div>
      <Ring occ={snap.occ} status={snap.status}>
        <span className="text-[15px] leading-none font-semibold tracking-tight tabular">{snap.pct}%</span>
        <span className="mt-1 text-[10.5px] leading-none font-medium text-ink-3">{t.status[snap.status]}</span>
      </Ring>
    </section>
  )
}

/** Occupancy ring: a faint ink track, the filled part in the status color. */
function Ring({ occ, status, children }: { occ: number; status: OccupancyStatus; children: ReactNode }) {
  const size = 76
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} className="text-ink" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STATUS[status].hex}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${c * Math.min(1, Math.max(0, occ))} ${c}` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
