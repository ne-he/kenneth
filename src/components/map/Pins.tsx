import clsx from 'clsx'
import { motion } from 'motion/react'
import type { Gate } from '../../data/types'
import type { PinFact } from '../../engine/modes'
import type { Snapshot } from '../../engine/occupancy'
import { formatRupiah } from '../../engine/pricing'
import { useT } from '../../i18n'
import { STATUS, formatMin } from '../../lib/status'
import type { Offset } from './declutter'
import { factHex } from './pinColor'

/**
 * "Titik + angka": a small pill with a status dot and the number in ink, sat
 * right on the place. The number follows the mode: percent full, zone bay
 * price, valet wait, free chargers. Only the selected pin adds the venue name.
 * A place that does not offer the mode is a faint grey dot.
 *
 * Central Park, Neo Soho and Taman Anggrek sit a couple hundred metres apart,
 * so at city zoom MapView moves crowded labels beside their point (`offset`).
 * A bare dot then stays on the exact spot.
 */
export function VenuePin({
  snap,
  fact = { kind: 'pct', pct: snap.pct },
  offset = [0, 0],
  selected,
  dimmed,
  onClick,
}: {
  snap: Snapshot
  fact?: PinFact
  offset?: Offset
  selected: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const t = useT()
  const hex = factHex(fact, snap)
  const off = fact.kind === 'none'
  // Valet has no status to show, so its dot follows the text: ink on a light pill, white on the selected one.
  const dot = fact.kind === 'wait' ? 'currentColor' : hex
  const [dx, dy] = offset
  const moved = dx !== 0 || dy !== 0
  const faded = dimmed || (off && !selected)
  let value = ''
  let spoken = `${snap.pct}%`
  switch (fact.kind) {
    case 'pct':
      value = `${fact.pct}%`
      break
    case 'price':
      value = fact.left > 0 ? formatRupiah(fact.price, true) : t.modes.soldOut
      spoken = fact.left > 0 ? `${t.modes.zone.label} ${formatRupiah(fact.price)}` : t.modes.soldOut
      break
    case 'wait':
      value = `${fact.min} ${t.unit.min}`
      spoken = `${t.modes.valet.label} ${fact.min} ${t.unit.min}`
      break
    case 'chargers':
      value = t.modes.free(fact.free, fact.total)
      spoken = `${t.modes.ev.label} ${fact.free}/${fact.total}`
      break
    case 'none':
      spoken = ''
      break
  }
  const label = `${snap.venue.name} ${spoken}`.trim()

  // Not offered here: a quiet grey dot that still opens the place.
  if (off && !selected) {
    return (
      <div className="relative size-0">
        <motion.button
          type="button"
          onClick={onClick}
          aria-label={label}
          initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%' }}
          animate={{ scale: 1, opacity: dimmed ? 0.35 : 0.7, x: '-50%', y: '-50%' }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-0 left-0 grid size-6 place-items-center"
        >
          <span className="size-2.5 rounded-full border-2 border-surface bg-ink-3 shadow-[0_1px_2px_rgb(0_0_0/0.2)]" />
        </motion.button>
      </div>
    )
  }

  return (
    <div className="relative size-0">
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ opacity: moved ? (faded ? 0.5 : 1) : 0, scale: moved ? 1 : 0.4, x: '-50%', y: '-50%' }}
        className="absolute top-0 left-0 size-2.5 rounded-full border-2 border-surface shadow-[0_1px_3px_rgb(0_0_0/0.3)]"
        style={{ background: fact.kind === 'wait' ? 'var(--ink)' : hex }}
      />
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        data-pin-label=""
        initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%', left: 0, top: 0 }}
        animate={{ scale: 1, opacity: faded ? 0.55 : 1, left: dx, top: dy, x: '-50%', y: '-50%' }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={clsx(
          'absolute flex items-center rounded-full font-semibold whitespace-nowrap tabular',
          selected
            ? 'h-8 gap-2 pr-3.5 pl-3 text-[13px] bg-ink text-canvas shadow-[0_8px_20px_-6px_rgb(0_0_0/0.45)]'
            : 'h-6 gap-1.5 pr-2.5 pl-2 text-[12px] bg-surface dark:bg-surface-3 text-ink shadow-[0_1px_2px_rgb(0_0_0/0.1),0_4px_12px_-4px_rgb(0_0_0/0.22)] ring-1 ring-line',
        )}
      >
        <span className="size-2 shrink-0 rounded-full" style={{ background: dot }} />
        {value && <span>{value}</span>}
        {selected && <span className={clsx(value && 'font-medium opacity-70')}>{snap.venue.name}</span>}
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

/** A white chip on each gate of the selected place: the status dot carries the queue colour, the text stays ink. */
export function GatePin({ gate, queueMin, best }: { gate: Gate; queueMin: number; best: boolean }) {
  const t = useT()
  const tone = queueMin < 5 ? STATUS.lega : queueMin < 10 ? STATUS.ramai : STATUS.penuh
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.5 }}
      data-pin-label=""
      className={clsx(
        'flex h-6 items-center gap-1.5 rounded-lg bg-surface dark:bg-surface-3 pr-2 pl-1.5 text-[11.5px] font-semibold whitespace-nowrap text-ink shadow-[0_1px_2px_rgb(0_0_0/0.1),0_4px_12px_-4px_rgb(0_0_0/0.22)]',
        // The gate the route goes to gets an ink outline, the rest a hairline.
        best ? 'ring-[1.5px] ring-ink' : 'ring-1 ring-line',
      )}
    >
      <span className="size-2 rounded-full" style={{ background: tone.hex }} />
      <span>{gateTag(gate.name)}</span>
      <span className="font-medium text-ink-2 tabular">
        {formatMin(queueMin)} {t.unit.min}
      </span>
    </motion.div>
  )
}

/** You are here: an ink puck with a soft halo. Ink, so it never reads as a status or the accent. */
export function OriginPin() {
  return (
    <div data-pin-label="" className="relative grid size-7 place-items-center">
      <span className="absolute inset-0 rounded-full bg-signal/12" />
      <span className="size-4 rounded-full border-[3px] border-surface bg-signal shadow-[0_1px_4px_rgb(0_0_0/0.3)]" />
    </div>
  )
}
