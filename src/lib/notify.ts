/*
  System notifications for relief reminders. The in-app toast always shows,
  this is the extra nudge when the app sits in the background.
*/

const ICON = '/pwa-192.png'

const supported = () => typeof window !== 'undefined' && 'Notification' in window

/** Ask once, at the moment the user sets a reminder, never on page load. */
export function askNotificationPermission() {
  if (supported() && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => undefined)
  }
}

export async function systemNotify(title: string, body: string) {
  if (!supported() || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: ICON })
  } catch {
    // Chrome on Android only allows notifications through a service worker.
    const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined)
    await reg?.showNotification(title, { body, icon: ICON, badge: ICON }).catch(() => undefined)
  }
}
