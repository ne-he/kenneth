import clsx from 'clsx'
import { motion, type HTMLMotionProps } from 'motion/react'
import { haptic } from '../../lib/haptics'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface Props extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
}

/** The Daily Log button recipe (see buttonStyles.ts). Neutral by default; one primary per screen. */
export function Button({ variant = 'ghost', size = 'md', block, className, onClick, ...rest }: Props) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={clsx(buttonClass(variant, size), block && 'w-full', className)}
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
