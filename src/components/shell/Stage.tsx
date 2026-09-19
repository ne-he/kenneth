import { motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useT } from '../../i18n'
import { Wordmark } from '../ui/Logo'

const PHONE_W = 390
const PHONE_H = 844

/**
 * Laptop and projector view: the working app in a phone frame, and nothing
 * else competing with it. No pitch, no headline, no dashboard. The QR in the
 * corner is for the booth, so visitors can carry the same app away.
 */
export function Stage({ children }: { children: ReactNode }) {
  const t = useT()
  const [qr, setQr] = useState('')
  const [scale, setScale] = useState(1)

  useEffect(() => {
    QRCode.toDataURL(window.location.origin, { margin: 1, width: 240, color: { dark: '#111512', light: '#ffffff' } }).then(setQr)
  }, [])

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / (PHONE_H + 24)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="relative flex h-full min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        className="relative z-10 shrink-0"
        style={{ width: (PHONE_W + 24) * scale, height: (PHONE_H + 24) * scale }}
      >
        <div
          className="origin-top-left rounded-[64px] bg-[#0c0f0d] p-3 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.55),0_0_0_1.5px_rgb(255_255_255/0.08)_inset]"
          style={{ width: PHONE_W + 24, height: PHONE_H + 24, transform: `scale(${scale})` }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-[52px]"
            style={{ '--safe-top': '48px', '--safe-bottom': '22px' } as CSSProperties}
          >
            {children}
            <div className="pointer-events-none absolute top-2.5 left-1/2 z-[80] h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
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
