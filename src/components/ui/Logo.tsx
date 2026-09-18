import clsx from 'clsx'
import mark from '../../assets/logo-mark.webp'

/**
 * The K is drawn as roads seen from above. The stem is the street you are on,
 * the two arms are the choice between places, and the car takes the one that
 * is clear. That fork is the whole product: decide before you get there.
 * Source file and a 1024px master live in docs/brand.
 */
export function LogoMark({
  className,
  size = 32,
  shape = 'squircle',
}: {
  className?: string
  size?: number
  shape?: 'squircle' | 'circle'
}) {
  return (
    <img
      src={mark}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      decoding="async"
      className={clsx(
        'shrink-0 bg-black select-none',
        shape === 'circle' ? 'rounded-full' : 'rounded-[26%]',
        className,
      )}
    />
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <LogoMark size={26} />
      <span className="text-[15px] font-extrabold tracking-[0.18em]">KENNETH</span>
    </span>
  )
}
