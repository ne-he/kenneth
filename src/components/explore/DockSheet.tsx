import { animate, motion, useMotionValue, type PanInfo } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export type Snap = 'peek' | 'half' | 'full'

interface Props {
  snap: Snap
  onSnap: (s: Snap) => void
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Height of the collapsed state, header plus footer. */
  peek?: number
}

const SPRING = { type: 'spring', stiffness: 380, damping: 40, mass: 0.9 } as const

/**
 * The persistent Explore sheet, in the spirit of Apple Maps: always on screen,
 * three resting heights, the header is the drag handle, the body scrolls.
 * Height (not transform) is animated so the body can scroll at every height.
 */
export function DockSheet({ snap, onSnap, header, children, footer, peek = 172 }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const [H, setH] = useState(720)
  const h = useMotionValue(peek)
  const start = useRef(0)

  useLayoutEffect(() => {
    const el = wrap.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(() => setH(el.clientHeight))
    ro.observe(el)
    setH(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const heights: Record<Snap, number> = {
    peek,
    half: Math.round(Math.max(peek + 120, H * 0.5)),
    full: H - 74,
  }

  useEffect(() => {
    const c = animate(h, heights[snap], SPRING)
    return () => c.stop()
  }, [snap, H, peek])

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
      className="shadow-sheet absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-[30px] border-t border-glass-line bg-surface/[0.94] backdrop-blur-2xl"
    >
      <motion.div
        className="shrink-0 cursor-grab touch-none active:cursor-grabbing"
        onPanStart={() => (start.current = h.get())}
        onPan={(_, info) =>
          h.set(Math.min(heights.full + 24, Math.max(heights.peek - 24, start.current - info.offset.y)))
        }
        onPanEnd={onPanEnd}
        onDoubleClick={() => onSnap(snap === 'full' ? 'half' : 'full')}
      >
        <div className="flex justify-center pt-2.5 pb-1.5">
          <span className="h-[5px] w-10 rounded-full bg-line-strong" />
        </div>
        {header}
      </motion.div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 px-3.5 pt-1.5 pb-safe">{footer}</div>}
    </motion.div>
  )
}
