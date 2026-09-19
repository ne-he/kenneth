import type { LngLat } from '../data/types'
import type { NavApp } from '../store/app'

/*
  People in Jakarta drive with Waze or Google Maps, and that is fine. KENNETH
  hands them the right gate as the destination, which is the part those apps
  do not know. Both links open the installed app on a phone, the website on a
  laptop.
*/

export const NAV_APP_NAME: Record<NavApp, string> = {
  kenneth: 'KENNETH',
  gmaps: 'Google Maps',
  waze: 'Waze',
}

export function externalNavUrl(app: Exclude<NavApp, 'kenneth'>, [lng, lat]: LngLat): string {
  const ll = `${lat.toFixed(6)},${lng.toFixed(6)}`
  return app === 'gmaps'
    ? `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=driving`
    : `https://waze.com/ul?ll=${ll}&navigate=yes`
}
