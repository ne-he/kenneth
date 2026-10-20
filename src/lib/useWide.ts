import { useLayoutEffect, useState, type RefObject } from 'react'

/** Width at which the app switches to its tablet layout: a side panel instead of a bottom sheet. */
export const WIDE_PX = 700

/**
 * True when the element is at least WIDE_PX wide. Measured on the app's own box,
 * not the window, so the tablet frame on the desktop stage gets the tablet layout too.
 */
export function useWide(ref: RefObject<HTMLElement | null>): boolean {
  const [wide, setWide] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWide(el.clientWidth >= WIDE_PX))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return wide
}
