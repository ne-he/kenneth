import clsx from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

/*
  The button recipe of the Daily Log design system. Only its buttons were
  adopted: KENNETH keeps its own colors, type and surfaces, and the recipe is
  mapped onto them. One primary with a gradient fill in the accent
  (.btn-primary in index.css), an accent-tinted secondary, a quiet bordered
  tile for neutral actions, and a text-only danger. A solid red is kept for
  the last step of a destructive confirm. Heights stay touch-sized for a
  phone, and buttons stay pills like the rest of KENNETH.
*/
const BASE =
  'inline-flex select-none items-center justify-center font-medium tracking-[-0.01em] transition-[filter,background-color,border-color,color] duration-150 disabled:pointer-events-none disabled:opacity-40'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary text-white',
  secondary: 'border border-brand-600/24 bg-brand-600/12 text-ink dark:border-brand-400/30 dark:bg-brand-500/15',
  ghost: 'btn-tile border border-line text-ink-2 hover:border-line-strong hover:text-ink',
  danger: 'text-penuh-ink hover:bg-penuh-soft dark:text-led-penuh dark:hover:bg-penuh/15',
  destructive: 'bg-penuh-ink text-white hover:brightness-110',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-full px-3 text-[12.5px]',
  md: 'h-11 gap-2 rounded-full px-5 text-[13.5px]',
  lg: 'h-13 gap-2 rounded-full px-6 text-[15px]',
}

/** Size, shape, type and states without a color, for a button that sits on its own dark card. */
export function buttonShape(size: ButtonSize = 'md') {
  return clsx(BASE, SIZES[size])
}

/** The full recipe, for hand-built buttons that need their own haptics or markup. */
export function buttonClass(variant: ButtonVariant = 'ghost', size: ButtonSize = 'md') {
  return clsx(buttonShape(size), VARIANTS[variant])
}
