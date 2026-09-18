/**
 * The splash car waits for the map. Building the map compiles its shaders and
 * blocks the main thread for a moment, which would freeze the car mid turn, so
 * the car only drives off once the first map has drawn (or has given up).
 */
export const MAP_READY = 'kenneth:map-ready'

let ready = false
export const mapReady = () => ready

export function signalMapReady() {
  ready = true
  window.dispatchEvent(new Event(MAP_READY))
}
