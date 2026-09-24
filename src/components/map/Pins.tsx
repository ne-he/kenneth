import { ChargingStation, Crown, Key } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import type { Gate, LabelDir } from '../../data/types'
import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { formatRupiah } from '../../engine/pricing'
import { useT } from '../../i18n'
import { STATUS, formatMin } from '../../lib/status'
import { factHex } from './pinColor'

const DIR: Record<LabelDir, [number, number]> = {
  n: [0, -54],
  s: [0, 54],
  e: [72, 0],
  w: [-72, 0],
  ne: [58, -42],
  nw: [-58, -42],
  se: [58, 42],
  sw: [-58, 42],
}

/**
 * Callout pin: a dot on the exact spot, the label pushed out along a leader
 * line. Central Park, Neo Soho and Taman Anggrek sit a couple hundred metres
 * apart, so plain pins would pile on top of each other at city zoom. The
 * number in the badge follows the mode: percent full, zone bay price, valet
 * wait, free chargers. A place that does not offer the mode goes grey.
 */
export function VenuePin({
  snap,
  fact = { kind: 'pct', pct: snap.pct },
  selected,
  dimmed,
  onClick,
}: {
  snap: Snapshot
  fact?: PinFact
  selected: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const t = useT()
  const hex = factHex(fact, snap)
  const off = fact.kind === 'none'
  // The selected label lifts straight up so the gate chips around the building stay visible.
  const [dx, dy] = selected ? [0, -66] : DIR[snap.venue.labelDir]
  const faded = dimmed || (off && !selected)
  let badge: ReactNode = null
  let spoken = `${snap.pct}%`
  switch (fact.kind) {
    case 'pct':
      badge = `${fact.pct}%`
      break
    case 'price':
      badge =
        fact.left > 0 ? (
          <>
            <Crown size={10} weight="fill" /> {formatRupiah(fact.price, true).replace('Rp', '')}
          </>
        ) : (
          t.modes.soldOut
        )
      spoken = fact.left > 0 ? `${t.modes.priority.label} ${formatRupiah(fact.price)}` : t.modes.soldOut
      break
    case 'wait':
      badge = (
        <>
          <Key size={10} weight="fill" /> {fact.min} {t.unit.min}
        </>
      )
      spoken = `${t.modes.valet.label} ${fact.min} ${t.unit.min}`
      break
    case 'chargers':
      badge = (
        <>
          <ChargingStation size={10} weight="fill" /> {t.modes.free(fact.free, fact.total)}
        </>
      )
      spoken = `${t.modes.ev.label} ${fact.free}/${fact.total}`
      break
    case 'none':
      spoken = ''
      break
  }
  return (
    <div className="relative size-0">
      <svg className="pointer-events-none absolute overflow-visible" width="1" height="1" aria-hidden="true">
        <motion.line
          x1={0}
          y1={0}
          initial={{ x2: 0, y2: 0 }}
          animate={{ x2: dx, y2: dy, opacity: faded ? 0.35 : 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          stroke={selected ? 'var(--ink)' : hex}
          strokeWidth={selected ? 2 : 1.5}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_4px_rgb(0_0_0/0.35)]"
        style={{ background: hex }}
      >
        {fact.kind === 'pct' && snap.status === 'penuh' && (
          <span className="absolute -inset-1 animate-ping rounded-full opacity-50" style={{ background: hex }} />
        )}
      </span>
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={`${snap.venue.name} ${spoken}`.trim()}
        initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%', left: 0, top: 0 }}
        animate={{ scale: selected ? 1.06 : 1, opacity: faded ? 0.5 : 1, left: dx, top: dy, x: '-50%', y: '-50%' }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={clsx(
          'absolute flex h-[32px] items-center gap-1.5 rounded-full pr-2.5 whitespace-nowrap',
          off ? 'pl-2.5' : 'pl-1',
          selected ? 'bg-ink text-canvas shadow-[0_10px_24px_-6px_rgb(0_0_0/0.45)]' : 'glass shadow-float text-ink',
        )}
      >
        {!off && (
          <span
            className="flex h-6 min-w-6 items-center justify-center gap-0.5 rounded-full px-1.5 text-[11px] font-extrabold text-white tabular"
            style={{ background: fact.kind === 'wait' && selected ? '#2a302c' : hex }}
          >
            {badge}
          </span>
        )}
        <span className={clsx('text-[11.5px] font-bold', off && !selected && 'text-ink-3')}>
          {selected ? snap.venue.name : snap.venue.short}
        </span>
        {selected && fact.kind === 'pct' && snap.queueMin >= 3 && (
          <span className="text-[11px] font-semibold opacity-70">
            {t.explore.queue} {formatMin(snap.queueMin)} {t.unit.min}
          </span>
        )}
      </motion.button>
    </div>
  )
}

/** "Gerbang 3" becomes G3 on the map, a named gate keeps its name: "Gerbang utara" becomes Utara. */
function gateTag(name: string) {
  const n = name.match(/^Gerbang (\d+)$/)
  if (n) return `G${n[1]}`
  const rest = name.replace(/^Gerbang /, '')
  return rest.charAt(0).toUpperCase() + rest.slice(1)
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
      <span>{gateTag(gate.name)}</span>
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
