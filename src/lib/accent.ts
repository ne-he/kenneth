import type { Accent } from '../store/app'

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

/*
  The accent the user picks in Akun, in the order macOS lists its own. Each one
  is a full brand scale, so every bg-brand-* and text-brand-* in the app follows
  it. Shade 600 carries white text on buttons, so it keeps at least 4.5:1.
  Green, amber and red are not offered: they are the status colors (lega,
  ramai, penuh) and an accent in the same hue would read as a status.
*/
export const ACCENTS: Record<Accent, Record<Shade, string>> = {
  cornflower: {
    50: '#f0f4fe',
    100: '#e3eafd',
    200: '#c7d5fa',
    300: '#a3baf5',
    400: '#7c9bec',
    500: '#5279e3',
    600: '#2f5bd3',
    700: '#2649ae',
    800: '#213d8c',
    900: '#1d3370',
  },
  purple: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#db2777',
    600: '#be185d',
    700: '#9d174d',
    800: '#831843',
    900: '#6b1239',
  },
  graphite: {
    50: '#f5f5f6',
    100: '#ebebed',
    200: '#d5d5d9',
    300: '#b4b4bb',
    400: '#8e8e97',
    500: '#6b6b74',
    600: '#4a4a52',
    700: '#3a3a41',
    800: '#2b2b31',
    900: '#1d1d22',
  },
}

export const ACCENT_ORDER: Accent[] = ['cornflower', 'purple', 'pink', 'graphite']

/** The scale of an accent, cornflower for a value saved by an older build that no longer exists. */
export const scaleOf = (accent: Accent) => ACCENTS[accent] ?? ACCENTS.cornflower

const SHADES: Shade[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

/** Writes the accent's scale over the brand variables on <html>, so the CSS follows without a reload. */
export function applyAccent(accent: Accent, root: HTMLElement = document.documentElement) {
  const scale = scaleOf(accent)
  for (const s of SHADES) root.style.setProperty(`--color-brand-${s}`, scale[s])
  // EV is a service, so it wears the accent like the rest.
  root.style.setProperty('--color-ev', scale[600])
}
