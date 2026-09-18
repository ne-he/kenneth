import clsx from 'clsx'
import { motion } from 'motion/react'
import type { Gate } from '../../data/types'
import type { Snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { STATUS, formatMin } from '../../lib/status'

export function VenuePin({
  snap,
  selected,
  dimmed,
  onClick,
}: {
  snap: Snapshot
  selected: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const t = useT()
  const s = STATUS[snap.status]
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`${snap.venue.name} ${snap.pct}%`}
      initial={{ scale: 0.4, opacity: 0, y: 8 }}
      animate={{ scale: selected ? 1.08 : 1, opacity: dimmed ? 0.55 : 1, y: 0 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={clsx(
        'relative flex h-[34px] origin-bottom items-center gap-1.5 rounded-full pr-3 pl-1 whitespace-nowrap',
        selected
          ? 'bg-ink text-canvas shadow-[0_10px_24px_-6px_rgb(0_0_0/0.45)]'
          : 'glass shadow-float text-ink',
      )}
    >
      <span className="relative grid size-[26px] place-items-center rounded-full" style={{ background: s.hex }}>
        {snap.status === 'penuh' && (
          <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: s.hex }} />
        )}
        <span className="text-[9px] font-extrabold tracking-tight text-white">P</span>
      </span>
      <span className="text-[11.5px] font-bold">{selected ? snap.venue.name : snap.venue.short}</span>
      <span
        className="text-[12.5px] font-extrabold tabular"
        style={{ color: selected ? s.led : s.hex }}
      >
        {snap.pct}%
      </span>
      {selected && snap.queueMin >= 3 && (
        <span className="text-[11px] font-semibold opacity-70">
          {t.explore.queue} {formatMin(snap.queueMin)} {t.unit.min}
        </span>
      )}
      <span
        className={clsx(
          'absolute -bottom-[5px] left-1/2 size-[10px] -translate-x-1/2 rotate-45 rounded-[2px]',
          selected ? 'bg-ink' : 'bg-glass border-r border-b border-glass-line',
        )}
      />
    </motion.button>
  )
}

export function GatePin({ gate, queueMin, best }: { gate: Gate; queueMin: number; best: boolean }) {
  const t = useT()
  const tone = queueMin < 5 ? STATUS.lega : queueMin < 10 ? STATUS.ramai : STATUS.penuh
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.5 }}
      className={clsx(
        'flex h-6 items-center gap-1 rounded-md px-1.5 text-[10.5px] font-bold whitespace-nowrap text-white shadow-[0_4px_10px_-2px_rgb(0_0_0/0.35)]',
        best && 'ring-2 ring-white',
      )}
      style={{ background: tone.hex }}
    >
      <span>{gate.name.replace('Gerbang ', 'G')}</span>
      <span className="opacity-85 tabular">
        {formatMin(queueMin)} {t.unit.min}
      </span>
    </motion.div>
  )
}

export function OriginPin() {
  return (
    <div className="relative grid size-6 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-signal/35" />
      <span className="size-4 rounded-full border-[3px] border-white bg-signal shadow-[0_2px_8px_rgb(31_95_214/0.55)]" />
    </div>
  )
}
