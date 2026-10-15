import { wib } from '../lib/time'
import type { VenueId } from './types'

/**
 * Merchant promos and events at a place. Merchants run them from the merchant
 * dashboard; these are the ones the app ships with. Names are wordplay on
 * familiar shops (Starbak, Unikloh), never a real brand's name or logo.
 *
 * Each repeats weekly on its days and hours, so a place always has its usual
 * offers. A parking perk is what KENNETH is about, so it gets its own line.
 * An event that draws a crowd says so: the car park fills faster that day.
 */
export interface Promo {
  id: string
  venueId: VenueId
  merchant: string
  kind: 'promo' | 'event'
  title: { id: string; en: string }
  floor: string
  /** Days it runs, 0 = Sunday. */
  days: number[]
  /** Hours it runs, WIB, end exclusive. */
  from: number
  to: number
  /** Free or cheaper parking with a receipt. */
  parking?: { id: string; en: string }
  /** Whole hours of parking the receipt covers, taken off the bill when leaving. */
  freeHours?: number
  /** The event brings more cars than usual. */
  busy?: boolean
}

const ALL = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]
const WEEKEND = [0, 6]

export const PROMOS: Promo[] = [
  { id: 'cp-starbak', venueId: 'central-park', merchant: 'Starbak', kind: 'promo', title: { id: 'Beli 1 gratis 1 minuman grande', en: 'Buy 1 get 1 grande drink' }, floor: 'LG', days: WEEKDAYS, from: 14, to: 17 },
  { id: 'cp-unikloh', venueId: 'central-park', merchant: 'Unikloh', kind: 'promo', title: { id: 'Diskon 20% koleksi musim lalu', en: '20% off last season' }, floor: 'Lt. 1', days: ALL, from: 10, to: 22, parking: { id: 'Gratis parkir 2 jam, belanja min. Rp300rb', en: '2 hours free parking, spend Rp300k' }, freeHours: 2 },
  { id: 'cp-bazar', venueId: 'central-park', merchant: 'Central Park', kind: 'event', title: { id: 'Bazar kuliner akhir pekan', en: 'Weekend food bazaar' }, floor: 'Taman atap', days: WEEKEND, from: 11, to: 21, busy: true },
  { id: 'ns-janji', venueId: 'neo-soho', merchant: 'Janji Jiwo', kind: 'promo', title: { id: 'Kopi susu Rp15rb', en: 'Iced coffee Rp15k' }, floor: 'LG', days: ALL, from: 8, to: 11 },
  { id: 'ns-gramedio', venueId: 'neo-soho', merchant: 'Gramedio', kind: 'promo', title: { id: 'Diskon 25% buku kuliah', en: '25% off textbooks' }, floor: 'Lt. 2', days: WEEKDAYS, from: 10, to: 21, parking: { id: 'Parkir Rp2rb/jam pertama dengan struk', en: 'First hour Rp2k with receipt' } },
  { id: 'ta-hokbin', venueId: 'taman-anggrek', merchant: 'Hokbin', kind: 'promo', title: { id: 'Paket hemat Rp35rb', en: 'Value set Rp35k' }, floor: 'Lt. 4', days: WEEKDAYS, from: 11, to: 15 },
  { id: 'ta-timezona', venueId: 'taman-anggrek', merchant: 'Timezona', kind: 'promo', title: { id: 'Isi saldo Rp100rb dapat Rp150rb', en: 'Top up Rp100k, get Rp150k' }, floor: 'Lt. 4', days: ALL, from: 10, to: 22, parking: { id: 'Gratis parkir 3 jam, isi saldo min. Rp200rb', en: '3 hours free parking, top up Rp200k' }, freeHours: 3 },
  { id: 'ta-konser', venueId: 'taman-anggrek', merchant: 'Taman Anggrek', kind: 'event', title: { id: 'Panggung musik di atrium', en: 'Live music in the atrium' }, floor: 'Atrium', days: [5, 6], from: 18, to: 22, busy: true },
  { id: 'ci-sushitai', venueId: 'ciputra', merchant: 'Sushi Tai', kind: 'promo', title: { id: 'Diskon 30% semua menu salmon', en: '30% off salmon dishes' }, floor: 'Lt. 3', days: [1, 2, 3], from: 17, to: 21 },
  { id: 'lp-minisu', venueId: 'lippo-puri', merchant: 'Minisu', kind: 'promo', title: { id: 'Beli 3 diskon 15%', en: 'Buy 3, 15% off' }, floor: 'Lt. 1', days: ALL, from: 10, to: 22 },
  { id: 'pi-matahary', venueId: 'puri-indah', merchant: 'Matahary', kind: 'promo', title: { id: 'Diskon hingga 50% pakaian anak', en: 'Up to 50% off kidswear' }, floor: 'Lt. 2', days: WEEKEND, from: 10, to: 22, parking: { id: 'Gratis parkir 2 jam, belanja min. Rp250rb', en: '2 hours free parking, spend Rp250k' }, freeHours: 2 },
  { id: 'gi-sephoro', venueId: 'grand-indonesia', merchant: 'Sephoro', kind: 'promo', title: { id: 'Gratis sampel untuk belanja Rp500rb', en: 'Free samples over Rp500k' }, floor: 'Lt. 1', days: ALL, from: 10, to: 22 },
  { id: 'gi-hn', venueId: 'grand-indonesia', merchant: 'H&N', kind: 'promo', title: { id: 'Diskon 30% koleksi denim', en: '30% off denim' }, floor: 'Lt. 2', days: WEEKDAYS, from: 10, to: 22, parking: { id: 'Gratis parkir 2 jam, belanja min. Rp400rb', en: '2 hours free parking, spend Rp400k' }, freeHours: 2 },
  { id: 'gi-pameran', venueId: 'grand-indonesia', merchant: 'Grand Indonesia', kind: 'event', title: { id: 'Pameran otomotif', en: 'Car show' }, floor: 'West Mall', days: WEEKEND, from: 10, to: 21, busy: true },
  { id: 'sc-chatimo', venueId: 'senayan-city', merchant: 'Chatimo', kind: 'promo', title: { id: 'Upgrade ukuran gratis', en: 'Free size upgrade' }, floor: 'LG', days: WEEKDAYS, from: 13, to: 17 },
  { id: 'ps-zora', venueId: 'plaza-senayan', merchant: 'Zora', kind: 'promo', title: { id: 'Diskon 20% member baru', en: '20% off for new members' }, floor: 'Lt. 1', days: ALL, from: 10, to: 22 },
  { id: 'fx-gacoon', venueId: 'fx-sudirman', merchant: 'Mie Gacoon', kind: 'promo', title: { id: 'Mie level 0 sampai 2 Rp10rb', en: 'Level 0 to 2 noodles Rp10k' }, floor: 'Lt. 3', days: WEEKDAYS, from: 15, to: 18 },
  { id: 'ma-ace', venueId: 'mall-alsut', merchant: 'Ace Hardwear', kind: 'promo', title: { id: 'Diskon 25% alat rumah tangga', en: '25% off home tools' }, floor: 'Lt. 2', days: WEEKEND, from: 10, to: 22, parking: { id: 'Gratis parkir 3 jam, belanja min. Rp500rb', en: '3 hours free parking, spend Rp500k' }, freeHours: 3 },
  { id: 'lw-informo', venueId: 'living-world', merchant: 'Informo', kind: 'promo', title: { id: 'Cicilan 0% 12 bulan', en: '0% instalments, 12 months' }, floor: 'Lt. 1', days: ALL, from: 10, to: 22 },
  { id: 'lw-jko', venueId: 'living-world', merchant: 'J.KO', kind: 'promo', title: { id: 'Selusin donat Rp99rb', en: 'A dozen donuts Rp99k' }, floor: 'GF', days: ALL, from: 16, to: 21 },
  { id: 'sm-cgf', venueId: 'sm-bekasi', merchant: 'CGF', kind: 'promo', title: { id: 'Tiket nonton Rp35rb hari Selasa', en: 'Rp35k tickets on Tuesday' }, floor: 'Lt. 3', days: [2], from: 11, to: 23 },
  { id: 'pp-richeese', venueId: 'pacific-place', merchant: 'Richeese Faktory', kind: 'promo', title: { id: 'Paket berdua Rp49rb', en: 'Meal for two Rp49k' }, floor: 'Lt. 5', days: WEEKDAYS, from: 11, to: 14 },
  { id: 'pi-erafon', venueId: 'plaza-indonesia', merchant: 'Erafon', kind: 'promo', title: { id: 'Tukar tambah HP lama, bonus Rp500rb', en: 'Trade in, Rp500k bonus' }, floor: 'Lt. 3', days: ALL, from: 10, to: 22, parking: { id: 'Gratis parkir 2 jam dengan struk', en: '2 hours free parking with receipt' }, freeHours: 2 },
  { id: 'sp-festival', venueId: 'senayan-park', merchant: 'Senayan Park', kind: 'event', title: { id: 'Festival jajanan malam', en: 'Night snack festival' }, floor: 'Area danau', days: [5, 6], from: 17, to: 23, busy: true },
]

export type PromoState = 'now' | 'later'

/** Promos at a place today: running now first, then the ones that start later today. */
export function promosAt(venueId: VenueId, ts: number, list: Promo[] = PROMOS): { promo: Promo; state: PromoState }[] {
  const { day, hourF } = wib(ts)
  return list
    .filter((p) => p.venueId === venueId && p.days.includes(day) && hourF < p.to)
    .map((p) => ({ promo: p, state: (hourF >= p.from ? 'now' : 'later') as PromoState }))
    .sort((a, b) => (a.state === b.state ? a.promo.from - b.promo.from : a.state === 'now' ? -1 : 1))
}
