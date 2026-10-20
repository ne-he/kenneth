import { motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useT } from '../../i18n'
import { Segmented } from '../ui/Controls'
import { Wordmark } from '../ui/Logo'

type Device = 'phone' | 'tablet'

/** Screen size, bezel, corner radii and safe areas of each frame the app can be shown in. */
const DEVICES: Record<Device, { w: number; h: number; bezel: number; outer: number; inner: number; safeTop: number; safeBottom: number }> = {
  phone: { w: 390, h: 844, bezel: 12, outer: 64, inner: 52, safeTop: 48, safeBottom: 22 },
  tablet: { w: 820, h: 1180, bezel: 18, outer: 46, inner: 30, safeTop: 24, safeBottom: 20 },
}

const KEY = 'kenneth-stage-device'

function savedDevice(): Device {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'tablet' ? v : 'phone'
  } catch {
    return 'phone'
  }
}

/**
 * Laptop and projector view: the working app in a device frame, and nothing
 * else competing with it. No pitch, no headline, no dashboard. The switch at
 * the top shows the same app on a phone or a tablet. The QR in the corner is
 * for the booth, so visitors can carry the same app away.
 */
export function Stage({ children }: { children: ReactNode }) {
  const t = useT()
  const [qr, setQr] = useState('')
  const [scale, setScale] = useState(1)
  const [device, setDevice] = useState<Device>(savedDevice)
  const d = DEVICES[device]
  const frameW = d.w + d.bezel * 2
  const frameH = d.h + d.bezel * 2

  useEffect(() => {
    QRCode.toDataURL(window.location.origin, { margin: 1, width: 240, color: { dark: '#121216', light: '#ffffff' } }).then(setQr)
  }, [])

  useEffect(() => {
    // Room is kept above the frame for the device switch.
    const fit = () => setScale(Math.min(1, (window.innerHeight - 110) / frameH, (window.innerWidth - 120) / frameW))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [frameW, frameH])

  const pick = (v: Device) => {
    setDevice(v)
    try {
      localStorage.setItem(KEY, v)
    } catch {
      // Private mode: the choice just is not remembered.
    }
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

      <div className="absolute top-5 left-1/2 z-20 w-[240px] -translate-x-1/2">
        <Segmented
          value={device}
          onChange={pick}
          options={[
            { value: 'phone', label: t.stage.phone },
            { value: 'tablet', label: t.stage.tablet },
          ]}
        />
      </div>

      <motion.div
        key={device}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        className="relative z-10 shrink-0"
        style={{ width: frameW * scale, height: frameH * scale }}
      >
        <div
          className="origin-top-left bg-[#121216] shadow-[0_60px_120px_-40px_rgb(0_0_0/0.55),0_0_0_1.5px_rgb(255_255_255/0.08)_inset]"
          style={{ width: frameW, height: frameH, padding: d.bezel, borderRadius: d.outer, transform: `scale(${scale})` }}
        >
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ borderRadius: d.inner, '--safe-top': `${d.safeTop}px`, '--safe-bottom': `${d.safeBottom}px` } as CSSProperties}
          >
            {children}
            {device === 'phone' && (
              <div className="pointer-events-none absolute top-2.5 left-1/2 z-[80] h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
            )}
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
