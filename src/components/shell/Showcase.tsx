import { ArrowUpRight, Check, GithubLogo, PresentationChart, UserFocus } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { VENUES } from '../../data/venues'
import { snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { STATUS } from '../../lib/status'
import { useNow } from '../../store/clock'
import { REPO_URL } from '../profile/Profile'
import { Wordmark } from '../ui/Logo'

const PHONE_W = 390
const PHONE_H = 844

/** Desktop and projector view: the pitch on the left, the working phone on the right. */
export function Showcase({ children }: { children: ReactNode }) {
  const t = useT()
  const now = useNow(20_000)
  const [qr, setQr] = useState('')
  const [scale, setScale] = useState(1)

  useEffect(() => {
    QRCode.toDataURL(window.location.origin, { margin: 1, width: 320, color: { dark: '#111512', light: '#ffffff' } }).then(setQr)
  }, [])

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 48) / (PHONE_H + 24)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const board = VENUES.slice(0, 4).map((v) => snapshot(v, now))

  return (
    <div className="relative flex h-full min-h-[100dvh] items-center justify-center gap-16 overflow-hidden bg-canvas px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--line-strong) 1px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 30% 50%, black, transparent)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-[35%] size-[620px] rounded-full bg-brand-400/15 blur-[120px]"
      />

      <motion.section
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative z-10 max-w-[520px]"
      >
        <Wordmark />
        <p className="mt-10 text-[12px] font-bold tracking-[0.18em] text-brand-700 uppercase dark:text-brand-300">
          {t.showcase.eyebrow}
        </p>
        <h1 className="mt-3 text-[56px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">{t.showcase.headline}</h1>
        <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-ink-2">{t.showcase.sub}</p>

        <div className="mt-7 grid max-w-[460px] grid-cols-4 gap-2">
          {board.map((s) => (
            <div key={s.venue.id} className="rounded-[16px] bg-led-bg p-3 shadow-[0_14px_30px_-18px_rgb(0_0_0/0.6)]">
              <div className="truncate text-[10px] font-bold tracking-[0.1em] text-white/50 uppercase">{s.venue.short}</div>
              <div
                className="font-led text-[26px] leading-none font-black tabular"
                style={{ color: STATUS[s.status].led, textShadow: `0 0 12px ${STATUS[s.status].led}66` }}
              >
                {s.pct}%
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-7 space-y-2.5">
          {t.showcase.points.map((p) => (
            <li key={p} className="flex items-center gap-2.5 text-[15px] font-medium">
              <span className="grid size-6 place-items-center rounded-full bg-brand-600 text-white">
                <Check size={13} weight="bold" />
              </span>
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-9 flex items-center gap-5">
          {qr && <img src={qr} alt="QR" className="size-[112px] rounded-[18px] border border-line bg-white p-2" />}
          <div>
            <p className="text-[14px] font-bold">{t.showcase.scan}</p>
            <p className="mt-1 max-w-[260px] text-[13px] text-ink-3">{t.showcase.tryLive}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip to="/mitra" icon={<PresentationChart size={14} weight="fill" />}>
                Mitra
              </Chip>
              <Chip to="/booth" icon={<UserFocus size={14} weight="fill" />}>
                Booth
              </Chip>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
              >
                <GithubLogo size={14} weight="fill" /> GitHub <ArrowUpRight size={11} />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: 2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.1 }}
        className="relative z-10 shrink-0"
        style={{ width: (PHONE_W + 24) * scale, height: (PHONE_H + 24) * scale }}
      >
        <div
          className="origin-top-left rounded-[64px] bg-[#0c0f0d] p-3 shadow-[0_60px_120px_-40px_rgb(0_0_0/0.55),0_0_0_1.5px_rgb(255_255_255/0.08)_inset]"
          style={{ width: PHONE_W + 24, height: PHONE_H + 24, transform: `scale(${scale})` }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-[52px]"
            style={{ '--safe-top': '48px', '--safe-bottom': '22px' } as React.CSSProperties}
          >
            {children}
            <div className="pointer-events-none absolute top-2.5 left-1/2 z-[80] h-[30px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-[80] h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-ink/70" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Chip({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
    >
      {icon}
      {children}
    </Link>
  )
}
