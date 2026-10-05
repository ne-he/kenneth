import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type Snap = 'peek' | 'half' | 'full'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Height of the collapsed state. Left out, the sheet measures its handle, header and footer. */
  peek?: number
  /** The collapsed height in use, given or measured, whenever it changes. */
  onPeek?: (px: number) => void
  /** Changing this scrolls the body back to the top. */
  contentKey?: string
  /**
   * A CSS length the sheet keeps running under, for a bar floating over its
   * bottom edge (the dock). The body scrolls on under the bar, and the
   * resting heights are measured above it.
   */
  inset?: string
}

const SPRING = { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 } as const

/**
 * The persistent Explore sheet, in the spirit of Apple Maps: always on screen,
 * three resting heights, the header is the drag handle, the body scrolls.
 * Height (not transform) is animated so the body can scroll at every height.
 */
export function DockSheet({ snap, onSnap, header, children, footer, peek, onPeek, contentKey, inset }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const under = useRef<HTMLDivElement>(null)
  const [H, setH] = useState(720)
  const [measured, setMeasured] = useState(172)
  const [underH, setUnderH] = useState(0)
  const below = inset ? underH : 0
  const base = peek ?? measured
  const peekH = base + below
  const h = useMotionValue(peekH)
  // Collapsed, the sheet shows only what sits above the bar; the rows under the bar fade in as it is pulled up.
  const cover = useTransform(h, [peekH, peekH + 56], [1, 0])
  const coverTaps = useTransform(cover, (v) => (v > 0.5 ? 'auto' : 'none'))
  const start = useRef(0)
  const body = useRef<HTMLDivElement>(null)

  // New content (list to detail, one venue to another) starts at the top.
  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
  }, [contentKey])

  useLayoutEffect(() => {
    const el = wrap.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    setH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  // Without a fixed peek, the collapsed sheet is exactly the handle plus the header and the footer.
  useLayoutEffect(() => {
    const top = head.current
    if (peek !== undefined || !top) return
    const read = () => setMeasured(top.offsetHeight + (foot.current?.offsetHeight ?? 0))
    const ro = new ResizeObserver(read)
    ro.observe(top)
    if (foot.current) ro.observe(foot.current)
    read()
    return () => ro.disconnect()
  }, [peek])

  // The part under the floating bar, in pixels, so it can be added to every resting height.
  useLayoutEffect(() => {
    const el = under.current
    if (!el) return
    const ro = new ResizeObserver(() => setUnderH(el.offsetHeight))
    ro.observe(el)
    setUnderH(el.offsetHeight)
    return () => ro.disconnect()
  }, [inset])

  useEffect(() => {
    onPeek?.(peekH)
  }, [onPeek, peekH])

  // Peek and half are measured above the floating bar, so they look the same with or without one.
  const heights: Record<Snap, number> = useMemo(
    () => ({
      peek: peekH,
      half: Math.round(Math.max(base + 120, (H - below) * 0.5)) + below,
      full: H - 64,
    }),
    [peekH, base, below, H],
  )

  useEffect(() => {
    const c = animate(h, heights[snap], SPRING)
    return () => c.stop()
  }, [h, heights, snap])

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const projected = h.get() - info.velocity.y * 0.18
    const order: Snap[] = ['peek', 'half', 'full']
    const next = order.reduce((a, b) => (Math.abs(heights[b] - projected) < Math.abs(heights[a] - projected) ? b : a))
    if (next === snap) animate(h, heights[snap], SPRING)
    onSnap(next)
  }

  return (
    <motion.div
      ref={wrap}
      style={{ height: h }}
      // Solid surface with one hairline and a soft lift off the map, the same top edge as the other sheets.
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-surface shadow-[0_-10px_30px_-16px_rgb(0_0_0/0.22)]"
    >
      <motion.div
        ref={head}
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        onPanStart={() => (start.current = h.get())}
        onPan={(_, info) =>
          h.set(Math.min(heights.full + 24, Math.max(heights.peek - 24, start.current - info.offset.y)))
        }
        onPanEnd={onPanEnd}
        onDoubleClick={() => onSnap(snap === 'full' ? 'half' : 'full')}
      >
        <div className="flex justify-center pt-2.5 pb-1.5">
          <span className="h-1 w-9 rounded-full bg-line-strong" />
        </div>
        {header}
      </motion.div>
      <div ref={body} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
        {/* The rows run on under the floating bar; this is room to scroll the last one out from under it. */}
        {inset && !footer && <div aria-hidden="true" style={{ height: inset }} />}
      </div>
      {footer && (
        <div ref={foot} className="shrink-0 px-3.5 pt-1.5 pb-safe" style={inset ? { marginBottom: inset } : undefined}>
          {footer}
        </div>
      )}
      {/* The strip under the bar, measured for the resting heights. It takes no room, so the body runs to the bottom edge. */}
      {inset && (
        <motion.div
          ref={under}
          aria-hidden="true"
          // Above the list's sticky headers (z-10).
          className="absolute inset-x-0 bottom-0 z-20 bg-surface"
          style={{ height: inset, opacity: cover, pointerEvents: coverTaps }}
        />
      )}
    </motion.div>
  )
}
