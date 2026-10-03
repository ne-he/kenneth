import type { CarBody, Vehicle } from '../store/app'

export const BODIES: CarBody[] = ['hatch', 'sedan', 'mpv', 'suv']

/*
  People know their car by its model and its shape, so the shape is guessed
  from the model name until they pick one. Common models on Indonesian roads;
  longer names are tried first, so "Yaris Cross" is an SUV and "Yaris" a
  hatchback. Names of three characters or fewer only match a whole word.
*/
const MODELS: Record<CarBody, string[]> = {
  hatch: [
    'hatchback', 'brio', 'agya', 'ayla', 'jazz', 'yaris', 'swift', 'baleno', 'ignis', 'march', 'sirion', 'celerio', 'spresso',
    'karimun', 'mazda2', 'picanto', 'i10', 'polo', 'golf', 'airev', 'binguo', 'dolphin', 'leaf',
  ],
  sedan: [
    'sedan', 'civic', 'city', 'camry', 'corolla', 'altis', 'vios', 'accord', 'mazda3', 'mazda6', 'lancer', 'elantra', 'ioniq6',
    'seal', 'model3',
  ],
  mpv: [
    'avanza', 'xenia', 'veloz', 'innova', 'zenix', 'calya', 'sigra', 'ertiga', 'apv', 'livina', 'mobilio', 'freed', 'stargazer',
    'xpander', 'serena', 'voxy', 'alphard', 'vellfire', 'sienta', 'luxio', 'hiace', 'staria', 'carens', 'confero', 'cortez', 'm6',
  ],
  suv: [
    'fortuner', 'pajero', 'rush', 'terios', 'crv', 'hrv', 'brv', 'wrv', 'cx3', 'cx5', 'cx30', 'raize', 'rocky', 'xl7', 'xforce',
    'xtrail', 'creta', 'tucson', 'santafe', 'palisade', 'kona', 'ioniq5', 'sportage', 'seltos', 'sonet', 'everest', 'rav4',
    'landcruiser', 'yariscross', 'corollacross', 'xpandercross', 'kicks', 'outlander', 'almaz', 'alvez', 'atto3', 'zs', 'tiggo',
    'omoda', 'jaecoo', 'jolion', 'haval', 'bz4x', 'modely',
  ],
}

const ENTRIES = (Object.entries(MODELS) as [CarBody, string[]][])
  .flatMap(([body, keys]) => keys.map((key) => [key, body] as const))
  .sort((a, b) => b[0].length - a[0].length)

export function guessBody(model: string): CarBody | undefined {
  const words = model.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  const joined = words.join('')
  // "CR-V" and "CX-5" arrive as two words.
  const whole = new Set([...words, ...words.slice(1).map((w, i) => words[i] + w)])
  return ENTRIES.find(([key]) => (key.length > 3 ? joined.includes(key) : whole.has(key)))?.[1]
}

/** The shape to draw: the one picked, else the guess from the model, else a sedan. */
export const bodyOf = (v: Pick<Vehicle, 'model' | 'body'>): CarBody => v.body ?? guessBody(v.model) ?? 'sedan'

const BRANDS = new Set([
  'toyota', 'honda', 'daihatsu', 'suzuki', 'mitsubishi', 'nissan', 'datsun', 'hyundai', 'kia', 'wuling', 'byd', 'mazda', 'chery',
  'lexus', 'volkswagen', 'vw', 'ford', 'isuzu', 'subaru', 'tesla', 'yamaha', 'kawasaki', 'vespa',
])

/** The model as people say it: "Toyota Avanza Veloz" is "Avanza Veloz". "Mazda 2" keeps its brand. */
export function shortModel(model: string) {
  const [first = '', ...rest] = model.trim().split(/\s+/)
  const name = rest.join(' ')
  return BRANDS.has(first.toLowerCase()) && name.length >= 3 && /[a-z]/i.test(name) ? name : model.trim()
}
