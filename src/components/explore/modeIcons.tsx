import { CarProfile, ChargingStation, Key, Lightning } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import type { ParkMode } from '../../engine/modes'

/** One icon per mode, used by the dropdown, the mode pill and the place card. */
export const MODE_ICON: Record<ParkMode, (p: { size: number; weight?: 'fill' | 'bold' }) => ReactNode> = {
  park: (p) => <CarProfile {...p} />,
  priority: (p) => <Lightning {...p} />,
  valet: (p) => <Key {...p} />,
  ev: (p) => <ChargingStation {...p} />,
}
