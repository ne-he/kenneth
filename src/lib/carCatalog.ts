import { CAR_MODELS, HAS_TEMPLATE_CAR, POPULAR_ORDER, type CarModel } from '../data/carModels'
import type { Vehicle } from '../store/app'

export type { CarModel }

/** The generic car drawn for any model that is not in the catalog. */
export const TEMPLATE_CAR = 'template-car'

const BY_ID = new Map(CAR_MODELS.map((m) => [m.id, m]))

/** Lowercase letters and digits, accents dropped: "Huracán" is "huracan", "CR-V" is "cr" and "v". */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

// Longest key first, so "Yaris Cross" is not a Yaris and "Kijang Innova Zenix" not the older Innova.
const KEYS = CAR_MODELS.flatMap((m) => m.keys.map((key) => [key, m] as const)).sort((a, b) => b[0].length - a[0].length)

export const modelById = (id: string | undefined): CarModel | undefined => (id ? BY_ID.get(id) : undefined)

/** The catalog model a typed name means: "Toyota Avanza", "avanza 1.5 G" and "AVANZA" are all the Avanza. */
export function matchModel(text: string): CarModel | undefined {
  const w = words(text)
  if (w.length === 0) return undefined
  const joined = w.join('')
  // "CR-V" and "CX-5" arrive as two words; short keys only count as a whole word.
  const whole = new Set([...w, ...w.slice(1).map((x, i) => w[i] + x)])
  return KEYS.find(([key]) => (key.length > 3 ? joined.includes(key) : whole.has(key)))?.[1]
}

/** The catalog model of a vehicle: the one picked from the list, else what its typed name means. */
export const modelOf = (v: Pick<Vehicle, 'model' | 'modelId'>): CarModel | undefined => modelById(v.modelId) ?? matchModel(v.model)

const POPULAR = POPULAR_ORDER.map((id) => BY_ID.get(id)).filter((m): m is CarModel => !!m)

/**
 * The picker's results: every typed word has to start a word of the name or
 * one of its keys ("cr v", "x5", "innova", "merc"). Models whose name starts
 * with what was typed come first ("cr" puts CR-V before Tiggo Cross), then the
 * best sellers. Nothing typed shows the best sellers.
 */
export function searchModels(query: string, limit = 12): CarModel[] {
  const q = words(query)
  if (q.length === 0) return POPULAR.slice(0, limit)
  const hits = CAR_MODELS.filter((m) => {
    const name = words(m.name)
    return q.every((t) => name.some((n) => n.startsWith(t)) || m.keys.some((k) => k.startsWith(t)))
  })
  const typed = q.join('')
  const lead = (m: CarModel) => (words(shortName(m)).join('').startsWith(typed) ? 0 : 1)
  const rank = (m: CarModel) => (m.popular ? POPULAR.indexOf(m) : POPULAR.length)
  return hits.sort((a, b) => lead(a) - lead(b) || rank(a) - rank(b) || a.name.localeCompare(b.name)).slice(0, limit)
}

/** The model as people say it, the brand shown on its own: "Toyota Avanza" is "Avanza". */
export const shortName = (m: CarModel) => (m.name.startsWith(`${m.brand} `) ? m.name.slice(m.brand.length + 1) : m.name)

/** The icon a car gets: its own model, else the template car. Undefined means the flat shape icon. */
export function spriteIdOf(v: Pick<Vehicle, 'kind' | 'model' | 'modelId'>): string | undefined {
  if (v.kind !== 'mobil') return undefined
  return modelOf(v)?.id ?? (HAS_TEMPLATE_CAR ? TEMPLATE_CAR : undefined)
}

export type CarView = 'front' | 'rear'

export const spriteUrl = (id: string, view: CarView) => `/vehicles/${id}-${view}.webp`
