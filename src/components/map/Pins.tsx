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

/** How far the dot sits in from the end of a place label, so the pill hangs off the dot. MapView places labels by it. */
export const LABEL_INSET = 11

/**
 * Every place is a status dot with a white ring, right on the spot. Its
 * label, a small white pill with the number in ink ("titik + angka"), hangs
 * off the dot only when MapView found room for it (`offset`); otherwise the
 * place stays a bare dot until you zoom in. The number follows the mode:
 * percent full, zone bay price, valet wait, free chargers. `named` adds the
 * short name when zoomed in. The selected place gets one ink pill above its
 * dot, "Central Park · 94%". A place that does not offer the mode is a faint
 * grey dot with no label.
 */
export function VenuePin({
  snap,
  fact = { kind: 'pct', pct: snap.pct },
  offset,
  named,
  selected,
  dimmed,
  onClick,
}: {
  snap: Snapshot
  fact?: PinFact
  /** Where the label sits. Missing or null: no room, show the dot only. */
  offset?: Offset | null
  named: boolean
  selected: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const t = useT()
  const off = fact.kind === 'none'
  // Valet has no status to show, so its dot is plain ink.
  const color = off ? 'var(--ink-3)' : fact.kind === 'wait' ? 'var(--ink)' : factHex(fact, snap)
  const shown = !!offset && (selected || !off)
  const [dx, dy] = offset ?? [1, 0]
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
  const fade = dimmed ? 0.5 : 1

  return (
    <div className="relative size-0">
      {(selected || !off) && (
        <motion.div
          aria-hidden="true"
          data-pin-label=""
          onClick={onClick}
          initial={false}
          animate={{ opacity: shown ? fade : 0, scale: shown ? 1 : 0.85, x: '-50%', y: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ left: dx, top: dy }}
          className={clsx(
            'absolute flex cursor-pointer items-center rounded-full whitespace-nowrap tabular',
            !shown && 'pointer-events-none',
            selected
              ? 'h-8 gap-1.5 px-3.5 text-[13px] font-semibold bg-ink text-canvas shadow-[0_8px_20px_-6px_rgb(0_0_0/0.45)]'
              : clsx(
                  'h-[22px] gap-1 text-[11.5px] font-semibold bg-surface text-ink ring-1 ring-line shadow-[0_1px_2px_rgb(0_0_0/0.08),0_3px_10px_-4px_rgb(0_0_0/0.2)] dark:bg-surface-3',
                  // The dot sits in the padded end, so the pill hangs off it on either side.
                  dx >= 0 ? 'pr-2 pl-[21px]' : 'flex-row-reverse pr-[21px] pl-2',
                ),
          )}
        >
          {selected ? (
            <>
              <span>{snap.venue.name}</span>
              {value && (
                <>
                  <span className="opacity-50">·</span>
                  <span>{value}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span>{value}</span>
              {named && <span className="font-medium text-ink-2">{snap.venue.short}</span>}
            </>
          )}
        </motion.div>
      )}
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        initial={{ scale: 0.3, opacity: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1, opacity: off && !selected ? fade * 0.7 : fade, x: '-50%', y: '-50%' }}
        whileTap={{ scale: 0.85 }}
        className="absolute top-0 left-0 grid size-7 place-items-center"
      >
        <span
          className={clsx(
            'rounded-full border-2 border-white shadow-[0_1px_3px_rgb(0_0_0/0.3)]',
            selected ? 'size-3.5' : off ? 'size-2.5' : 'size-3',
          )}
          style={{ background: color }}
        />
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
