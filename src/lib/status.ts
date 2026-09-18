import type { OccupancyStatus } from '../data/types'

/** Class and color lookups per occupancy status. Keep every status visual in one place. */
export const STATUS = {
  lega: {
    hex: '#0e9f6e',
    led: '#43ff9f',
    dot: 'bg-lega',
    text: 'text-lega-ink dark:text-led-lega',
    soft: 'bg-lega-soft text-lega-ink dark:bg-lega/15 dark:text-led-lega',
    ring: 'ring-lega/30',
  },
  ramai: {
    hex: '#f0a012',
    led: '#ffc53d',
    dot: 'bg-ramai',
    text: 'text-ramai-ink dark:text-led-ramai',
    soft: 'bg-ramai-soft text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai',
    ring: 'ring-ramai/30',
  },
  penuh: {
    hex: '#e5484d',
    led: '#ff5a5f',
    dot: 'bg-penuh',
    text: 'text-penuh-ink dark:text-led-penuh',
    soft: 'bg-penuh-soft text-penuh-ink dark:bg-penuh/15 dark:text-led-penuh',
    ring: 'ring-penuh/30',
  },
} satisfies Record<OccupancyStatus, Record<string, string>>

export const formatMin = (m: number) => (m < 1 ? '<1' : String(Math.round(m)))
