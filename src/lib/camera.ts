/*
  Camera numbers that do not need the map: pure, so the rule behind a move
  can be tested without maplibre.
*/

/** Zoom band for gliding between the home cards: close enough to tell neighbours apart, never a re-zoom. */
export const GLIDE_ZOOM_MIN = 14.2
export const GLIDE_ZOOM_MAX = 15.6

/** The zoom a glide keeps: the current one, pulled into the band when the map was left closer or wider. */
export const glideZoom = (current: number) => Math.max(GLIDE_ZOOM_MIN, Math.min(GLIDE_ZOOM_MAX, current))
