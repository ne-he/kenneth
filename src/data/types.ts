/** Longitude first, the order MapLibre and GeoJSON expect. */
export type LngLat = [number, number]

export type VenueId =
  | 'central-park'
  | 'neo-soho'
  | 'taman-anggrek'
  | 'ciputra'
  | 'lippo-puri'
  | 'puri-indah'
  | 'grand-indonesia'
  | 'slipi-jaya'
  | 'senayan-city'
  | 'plaza-senayan'
  | 'fx-sudirman'
  | 'mall-alsut'
  | 'living-world'
  | 'sm-bekasi'
  | 'binus-anggrek'
  | 'binus-syahdan'
  | 'binus-kijang'
  | 'binus-senayan'
  | 'binus-alsut'
  | 'binus-bekasi'

/** Malls fill up on weekend afternoons, campuses on weekday mornings. */
export type Category = 'mall' | 'kampus'

export type VehicleKind = 'mobil' | 'motor'

/**
 * Where the occupancy number comes from.
 * - palang: entry minus exit count from the barrier system already installed
 * - estimasi: community reports plus public crowd patterns, shown as an estimate
 */
export type DataSource = 'palang' | 'estimasi'

export type OccupancyStatus = 'lega' | 'ramai' | 'penuh'

export type LabelDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface Gate {
  id: string
  name: string
  hint: string
  coords: LngLat
  /** How much of the arrival flow this gate absorbs relative to an even split. */
  pull: number
  priorityLane: boolean
}

export interface Tenant {
  name: string
  floor: string
  lift: string
  /** Walking minutes from the nearest parking lift lobby. */
  walkMin: number
}

export interface Tariff {
  firstHour: number
  nextHour: number
  /** Always false in this prototype. Shown to the user as an estimate. */
  verified: boolean
}

export type Area = 'Jakarta Barat' | 'Jakarta Pusat' | 'Tangerang' | 'Tangerang Selatan' | 'Bekasi'

/** Motorbike bays have their own count, fill level and tariff. */
export interface MotorBays {
  capacity: number
  load: number
  firstHour: number
  nextHour: number
}

/** Valet run by the building. KENNETH only books the drop-off and calls the car back. */
export interface Valet {
  lobbies: string[]
  /** Flat fee paid at the valet desk, never in the app. */
  price: number
}

export interface Venue {
  id: VenueId
  name: string
  short: string
  category: Category
  area: Area
  district: string
  group?: string
  coords: LngLat
  capacity: number
  source: DataSource
  /** Peak multiplier on the base weekly curve. 1 means it hits the curve peak. */
  load: number
  /** Minutes the curve is shifted. Positive means the crowd arrives later. */
  shiftMin: number
  /** Opening and closing hour in WIB. The forecast and booking stay inside it. */
  hours: [number, number]
  motor: MotorBays
  valet?: Valet
  gates: Gate[]
  levels: string[]
  zones: string[]
  lobbies: string[]
  accessible: { difabel: number; ibuHamil: number }
  ev: { chargers: number; kw: number }
  tariff: Tariff
  /** Where the map label sits relative to the point, so dense clusters stay readable. */
  labelDir: LabelDir
  /** True when the access road is inside a ganjil-genap corridor. */
  gageCorridor: boolean
  walkLinks: { to: VenueId; minutes: number; via: string }[]
  tenants: Tenant[]
}
