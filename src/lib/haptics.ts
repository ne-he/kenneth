import { useApp } from '../store/app'

type Pattern = 'tap' | 'success' | 'warn'

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  success: [10, 40, 16],
  warn: [24, 60, 24],
}

/** Light vibration on Android. iOS Safari ignores it, which is fine. */
export function haptic(p: Pattern = 'tap') {
  if (!useApp.getState().prefs.haptics) return
  try {
    navigator.vibrate?.(PATTERNS[p])
  } catch {
    // Some browsers throw when vibration is blocked by policy.
  }
}
