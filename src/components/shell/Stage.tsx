import { ArrowClockwise } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useT } from '../../i18n'
import { Segmented } from '../ui/Controls'
import { Wordmark } from '../ui/Logo'

type Device = 'phone' | 'tablet'
type Orient = 'portrait' | 'landscape'

/** Screen size, bezel, corner radii and safe areas of each frame the app can be shown in. */
const DEVICES: Record<Device, { w: number; h: number; bezel: number; outer: number; inner: number; safeTop: number; safeBottom: number }> = {
  phone: { w: 390, h: 844, bezel: 12, outer: 64, inner: 52, safeTop: 48, safeBottom: 22 },
  tablet: { w: 820, h: 1180, bezel: 18, outer: 46, inner: 30, safeTop: 24, safeBottom: 20 },
}

const KEY = 'kenneth-stage-device'
const ORIENT_KEY = 'kenneth-stage-orient'

function saved<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && allowed.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}

function remember(key: string, v: string) {
  try {
    localStorage.setItem(key, v)
  } catch {
    // Private mode: the choice just is not remembered.
  }
}

/** How long the frame takes to turn a quarter, like a phone turned in the hand. */
const TURN = { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const }

/**
 * Laptop and projector view: the working app in a device frame, and nothing
 * else competing with it. No pitch, no headline, no dashboard. The switch at
 * the top shows the same app on a phone or a tablet, and the round button turns
 * it between portrait and landscape: the frame swings a quarter turn with the
 * app still upright inside, then the app lays itself out for the new shape.
 * The QR in the corner is for the booth, so visitors can carry the same app away.
 */
export function Stage({ children }: { children: ReactNode }) {
  const t = useT()
  const [qr, setQr] = useState('')
  const [scale, setScale] = useState(1)
  const [device, setDevice] = useState<Device>(() => saved(KEY, ['phone', 'tablet'], 'phone'))
  const [orient, setOrient] = useState<Orient>(() => saved(ORIENT_KEY, ['portrait', 'landscape'], 'portrait'))
  /** Degrees the frame is swinging through right now; 0 at rest. */
  const [turning, setTurning] = useState(0)
  /** A veil of the screen colour that covers the app while it changes shape, so the relayout never shows. */
  const [veil, setVeil] = useState(false)
  /**
   * Once the veil is down the app itself is hidden, so the turning frame does not repaint the map and
   * the frosted glass on every frame; that repaint is what made the turn stutter.
   */
  const [covered, setCovered] = useState(false)
  const d = DEVICES[device]
  const land = orient === 'landscape'
  const screenW = land ? d.h : d.w
  const screenH = land ? d.w : d.h
  const frameW = screenW + d.bezel * 2
  const frameH = screenH + d.bezel * 2

  useEffect(() => {
    QRCode.toDataURL(window.location.origin, { margin: 1, width: 240, color: { dark: '#121216', light: '#ffffff' } }).then(setQr)
  }, [])

  useEffect(() => {
    // Room is kept above the frame for the switch. One scale fits both orientations, so turning never resizes the frame.
    const fit = () => {
      const h = window.innerHeight - 110
      const w = window.innerWidth - 120
      setScale(Math.min(1, h / frameH, w / frameW, h / frameW, w / frameH))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [frameW, frameH])

  const pick = (v: Device) => {
    setDevice(v)
    remember(KEY, v)
  }

  const turn = () => {
    if (turning || veil) return
    // To landscape the frame turns counter-clockwise, back to portrait clockwise, as a hand would.
    setVeil(true)
    // The frame starts turning just after the veil is down.
    window.setTimeout(() => setTurning(land ? 90 : -90), 140)
  }

  return (
    <div className="relative flex h-full min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas pt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--line-strong) 1px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 55% 65% at 50% 50%, black, transparent)',
        }}
      />

      <div className="absolute top-7 left-8">
        <Wordmark />
      </div>

      <div className="absolute top-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        <Segmented
          className="w-[240px]"
          value={device}
          onChange={pick}
          options={[
            { value: 'phone', label: t.stage.phone },
            { value: 'tablet', label: t.stage.tablet },
          ]}
        />
        <button
          type="button"
          onClick={turn}
          aria-label={land ? t.stage.toPortrait : t.stage.toLandscape}
          title={land ? t.stage.toPortrait : t.stage.toLandscape}
          className="grid size-10 place-items-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowClockwise size={18} weight="bold" />
        </button>
      </div>

      <motion.div
        key={device}
        initial={{ opacity: 0, y: 30, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: turning }}
        transition={turning ? { rotate: TURN } : { type: 'spring', stiffness: 90, damping: 18, rotate: { duration: 0 } }}
        onAnimationComplete={() => {
          if (!turning) return
          // The swing ends on the new shape: swap the frame's sides with no rotation, which looks the same, and let the app relayout.
          const next: Orient = land ? 'portrait' : 'landscape'
          setOrient(next)
          remember(ORIENT_KEY, next)
          setTurning(0)
          setCovered(false)
          // Give the map a moment to take its new size, then lift the veil on the new layout.
          window.setTimeout(() => setVeil(false), 180)
        }}
        className="relative z-10 shrink-0"
        style={{ width: frameW * scale, height: frameH * scale, willChange: 'transform' }}
      >
        <div
          className="origin-top-left bg-[#121216] shadow-[0_60px_120px_-40px_rgb(0_0_0/0.55),0_0_0_1.5px_rgb(255_255_255/0.08)_inset]"
          style={{ width: frameW, height: frameH, padding: d.bezel, borderRadius: d.outer, transform: `scale(${scale})` }}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ borderRadius: d.inner, '--safe-top': `${land ? 16 : d.safeTop}px`, '--safe-bottom': `${land ? 14 : d.safeBottom}px`, '--safe-left': `${land && device === 'phone' ? 50 : 0}px` } as CSSProperties}
          >
            <div className="h-full w-full" style={{ visibility: covered ? 'hidden' : 'visible' }}>
              {children}
            </div>
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[79] bg-canvas"
              initial={false}
              animate={{ opacity: veil ? 1 : 0 }}
              transition={veil ? { duration: 0.14, ease: 'easeOut' } : { duration: 0.34, ease: 'easeOut' }}
              onAnimationComplete={() => {
                if (veil) setCovered(true)
              }}
            />
            {device === 'phone' &&
              (land ? (
                <div className="pointer-events-none absolute top-1/2 left-2.5 z-[80] h-[112px] w-[30px] -translate-y-1/2 rounded-full bg-black" />
              ) : (
                <div className="pointer-events-none absolute top-2.5 left-1/2 z-[80] h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
              ))}
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-[80] h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-ink/70" />
          </div>
        </div>
      </motion.div>

      {qr && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute right-8 bottom-8 flex items-center gap-3 rounded-[20px] border border-line bg-surface p-2.5 pr-4 shadow-float"
        >
          <img src={qr} alt="QR" className="size-[76px] rounded-[12px]" />
          <span className="max-w-[150px] text-[12.5px] leading-snug font-semibold text-ink-2">{t.stage.scan}</span>
        </motion.div>
      )}
    </div>
  )
}
