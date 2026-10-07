import clsx from 'clsx'
import mark from '../../assets/logo-mark.webp'

/** The K's own proportions, as docs/brand/make_mark.py writes it (168 x 192): a little narrower than tall. */
const K_RATIO = 168 / 192

/**
 * The K is drawn as roads seen from above. The stem is the street you are on,
 * the two arms are the choice between places, and the car takes the one that
 * is clear. That fork is the whole product: decide before you get there.
 * It sits straight on the background, with no box around it. `size` is its
 * height. Source file, a 1024px master and the cut-out K live in docs/brand.
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src={mark}
      width={Math.round(size * K_RATIO)}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={clsx('shrink-0 select-none', className)}
    />
  )
}

/**
 * The name as one word, with the road K as its first letter: set in the app's own type like any other
 * word, never in spaced capitals and never in a box. The K is sized in em, so it keeps to the letters'
 * cap height at any `size`. Screen readers hear "Kenneth".
 */
export function Wordmark({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <span
      role="img"
      aria-label="Kenneth"
      className={clsx('inline-flex items-baseline leading-none font-semibold tracking-[-0.02em]', className)}
      style={{ fontSize: size }}
    >
      <img
        src={mark}
        alt=""
        draggable={false}
        decoding="async"
        className="mr-[0.03em] h-[0.86em] w-auto shrink-0 translate-y-[0.08em] select-none"
        style={{ aspectRatio: `${K_RATIO}` }}
      />
      <span aria-hidden="true">enneth</span>
    </span>
  )
}
