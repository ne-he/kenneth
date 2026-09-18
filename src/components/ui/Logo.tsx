import clsx from 'clsx'

/**
 * The K is a parking barrier: the stem is the post, the upper stroke is the
 * striped boom arm (the barrier that already counts every car in and out,
 * which is where our data comes from), the lower stroke is the way in.
 */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={clsx('shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="#111512" />
      <rect x="15" y="13" width="8" height="38" rx="2.5" fill="#f4f3ef" />
      <line x1="24" y1="33" x2="48" y2="14" stroke="#f4f3ef" strokeWidth="7.5" strokeLinecap="round" />
      <line
        x1="24"
        y1="33"
        x2="48"
        y2="14"
        stroke="#e5484d"
        strokeWidth="7.5"
        strokeDasharray="5.2 5.2"
        strokeDashoffset="-3"
      />
      <line x1="28" y1="33" x2="47" y2="50" stroke="#10b981" strokeWidth="7.5" strokeLinecap="round" />
      <circle cx="21" cy="33" r="3.2" fill="#111512" />
    </svg>
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
