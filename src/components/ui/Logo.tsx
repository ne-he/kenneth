import clsx from 'clsx'
import mark from '../../assets/mascot-mark.webp'

/**
 * The logo is the bekantan: his face on its cornflower circle, the same face guests see as their avatar.
 * `size` is the circle's diameter. The master and the script that cuts it (docs/brand/make_assets.py)
 * live in docs/brand; the app icons are made from the same face.
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={mark}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={clsx('shrink-0 rounded-full select-none', className)}
    />
  )
}

/**
 * The name beside the face: "Kenneth" set as one ordinary word in the app's type, never in spaced capitals.
 * The face is sized in em so it sits on the letters at any `size`. Screen readers hear "Kenneth".
 */
export function Wordmark({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      role="img"
      aria-label="Kenneth"
      className={clsx('inline-flex items-center gap-[0.32em] leading-none font-semibold tracking-[-0.02em]', className)}
      style={{ fontSize: size }}
    >
      <img src={mark} alt="" draggable={false} decoding="async" className="size-[1.35em] shrink-0 rounded-full select-none" />
      <span aria-hidden="true">Kenneth</span>
    </span>
  )
}
