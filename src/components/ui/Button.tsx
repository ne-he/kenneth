import clsx from 'clsx'
import { motion, type HTMLMotionProps } from 'motion/react'
import { haptic } from '../../lib/haptics'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'dark' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  // The one main action on a screen is ink, never a hue: color stays for status and the accent.
  primary: 'bg-ink text-canvas hover:opacity-90',
  // Brand moments (Zona KENNETH, Premium): a soft cornflower tint, not a loud fill.
  accent: 'bg-brand-100 text-brand-800 hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3',
  ghost: 'bg-transparent text-ink-2 hover:text-ink hover:bg-surface-2',
  dark: 'bg-ink text-canvas hover:opacity-90',
  danger: 'bg-penuh-soft text-penuh-ink hover:bg-penuh/20 dark:bg-penuh/15 dark:text-led-penuh',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-full',
  md: 'h-11 px-5 text-[13.5px] gap-2 rounded-full',
  lg: 'h-13 px-6 text-[15px] gap-2 rounded-full',
}

interface Props extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
  block?: boolean
}

export function Button({ variant = 'secondary', size = 'md', block, className, onClick, ...rest }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={clsx(
        'inline-flex select-none items-center justify-center font-semibold tracking-tight transition-colors disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      onClick={(e) => {
        haptic('tap')
        onClick?.(e)
      }}
      {...rest}
    />
  )
}

export function IconButton({
  label,
  className,
  onClick,
  big,
  ...rest
}: HTMLMotionProps<'button'> & { label: string; big?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.9 }}
      className={clsx(
        'glass shadow-float grid place-items-center rounded-full text-ink-2 transition-colors hover:text-ink',
        big ? 'size-12' : 'size-10',
        className,
      )}
      onClick={(e) => {
        haptic('tap')
        onClick?.(e)
      }}
      {...rest}
    />
  )
}
