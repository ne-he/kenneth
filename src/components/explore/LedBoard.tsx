import clsx from 'clsx'
import { motion } from 'motion/react'
import type { Snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { STATUS } from '../../lib/status'
import { Led } from '../ui/Display'

const DOTS = 24

/**
 * The signature panel: a digital twin of the LED "SISA SLOT" board that
 * hangs over Jakarta car park entrances, except you read it from home.
 */
export function LedBoard({ snap }: { snap: Snapshot }) {
  const t = useT()
  const s = STATUS[snap.status]
  const lit = Math.round(snap.occ * DOTS)
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-led-bg p-4 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_18px_40px_-18px_rgb(0_0_0/0.6)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 0.7px, transparent 0.8px)',
          backgroundSize: '6px 6px',
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full blur-3xl"
        style={{ background: s.led, opacity: 0.16 }}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="font-led text-[13px] font-bold tracking-[0.2em] text-white/55">{t.venue.sisaSlot}</div>
          <Led value={snap.free} status={snap.status} className="mt-1 block text-[64px]" />
          <div className="mt-1 text-[11.5px] font-medium text-white/50 tabular">
            {t.venue.of} {snap.venue.capacity.toLocaleString('id-ID')} {t.unit.slots}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 pt-0.5">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase"
            style={{ background: `${s.led}22`, color: s.led }}
          >
            {t.status[snap.status]}
          </span>
          <span className="font-led text-[26px] font-black tabular" style={{ color: s.led }}>
            {snap.pct}%
          </span>
        </div>
      </div>
      <div className="relative mt-3.5 flex gap-[5px]" aria-hidden="true">
        {Array.from({ length: DOTS }, (_, i) => (
          <motion.span
            key={i}
            className={clsx('h-[7px] flex-1 rounded-full')}
            initial={{ opacity: 0.15 }}
            animate={{ opacity: i < lit ? 1 : 0.13 }}
            transition={{ delay: 0.25 + i * 0.022, duration: 0.25 }}
            style={{
              background: i < lit ? s.led : '#ffffff',
              boxShadow: i < lit ? `0 0 8px ${s.led}aa` : 'none',
            }}
          />
        ))}
      </div>
    </div>
  )
}
