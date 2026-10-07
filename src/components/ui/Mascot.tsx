import clsx from 'clsx'
import { motion } from 'motion/react'
import { MASCOT_ART, type MascotArt } from '../../data/mascot'

/*
  The KENNETH bekantan. He is decoration: the words next to him always carry
  the meaning, so screen readers skip him. The art comes from
  docs/brand/make_mascot.py; every file is precached, so he shows offline too.
*/

const src = (art: MascotArt) => `/mascot/${art}.webp`

/** The bekantan in one pose, `size` px tall. The box is reserved before the file loads. */
export function Mascot({ pose, size, className }: { pose: Exclude<MascotArt, 'peek' | 'avatar'>; size: number; className?: string }) {
  const { w, h } = MASCOT_ART[pose]
  return (
    <img
      src={src(pose)}
      alt=""
      aria-hidden="true"
      width={Math.round((size * w) / h)}
      height={size}
      decoding="async"
      draggable={false}
      className={clsx('pointer-events-none shrink-0 select-none', className)}
    />
  )
}

/**
 * The bekantan peeking over the top edge of the box that holds this. That box
 * needs `relative`; his flat bottom sits on its top edge, so he looks to be
 * behind it. He rises into place once, a beat after the box appears.
 */
export function MascotPeek({ width, className }: { width: number; className?: string }) {
  const { w, h } = MASCOT_ART.peek
  return (
    <motion.img
      src={src('peek')}
      alt=""
      aria-hidden="true"
      width={width}
      height={Math.round((width * h) / w)}
      decoding="async"
      draggable={false}
      initial={{ y: 14, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      // One pixel of overlap hides any seam between his flat edge and the box's border.
      className={clsx('pointer-events-none absolute bottom-[calc(100%-1px)] select-none', className)}
    />
  )
}

/** His face in a circle, for small places like a toast. */
export function MascotFace({ size, className }: { size: number; className?: string }) {
  return (
    <img
      src={src('avatar')}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      decoding="async"
      draggable={false}
      className={clsx('pointer-events-none shrink-0 select-none rounded-full', className)}
    />
  )
}
