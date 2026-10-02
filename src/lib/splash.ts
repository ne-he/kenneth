/**
 * The splash waits for the map. Building the map compiles its shaders and
 * blocks the main thread for a moment, so the splash only fades once the
 * first map has drawn (or has given up) and the app appears ready at once.
 */
export const MAP_READY = 'kenneth:map-ready'

let ready = false
export const mapReady = () => ready

export function signalMapReady() {
  ready = true
  window.dispatchEvent(new Event(MAP_READY))
}
