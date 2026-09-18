import { ArrowRight, Check } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { plateParity } from '../../engine/gage'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Controls'
import { Led, Plate } from '../ui/Display'
import { Wordmark } from '../ui/Logo'

/*
  First run. Three short slides that carry the pitch (problem, answer,
  honesty about data), then a tiny form so ganjil-genap and the plate on the
  pass are personal. Every illustration is drawn in code.
*/

export function Onboarding() {
  const t = useT()
  const finish = useApp((s) => s.finishOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [model, setModel] = useState('')
  const [isEV, setIsEV] = useState(false)
  const [sample, setSample] = useState(true)

  const slides = [
    { title: t.onboarding.s1Title, body: t.onboarding.s1Body, art: <ArtBoards /> },
    { title: t.onboarding.s2Title, body: t.onboarding.s2Body, art: <ArtCompare /> },
    { title: t.onboarding.s3Title, body: t.onboarding.s3Body, art: <ArtBarrier /> },
  ]
  const last = step === slides.length

  const done = () => {
    haptic('success')
    finish({
      name: name.trim(),
      vehicle: { plate: plate.trim() || 'B 1842 KEN', model: model.trim(), isEV },
      withSample: sample,
    })
  }

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col bg-canvas"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pt-safe flex items-center justify-between px-5 pt-3">
        <Wordmark />
        {!last && (
          <button type="button" onClick={() => setStep(slides.length)} className="text-[13px] font-semibold text-ink-3">
            {t.onboarding.skip}
          </button>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {!last ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="flex h-full flex-col px-6"
            >
              <div className="grid min-h-0 flex-1 place-items-center py-4">{slides[step].art}</div>
              <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-tight">{slides[step].title}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{slides[step].body}</p>
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="no-scrollbar h-full overflow-y-auto px-6 pt-6"
            >
              <h1 className="text-[28px] leading-tight font-extrabold tracking-tight">{t.onboarding.setupTitle}</h1>
              <div className="my-5 grid place-items-center rounded-[24px] bg-surface-2 py-7">
                <Plate plate={(plate || t.onboarding.platePh).toUpperCase()} className="scale-[1.6]" />
                {plateParity(plate) && (
                  <span className="mt-7 text-[12px] font-semibold text-ink-2">{t.profile.parity(plateParity(plate)!)}</span>
                )}
              </div>
              <Input label={t.onboarding.name} value={name} onChange={setName} placeholder={t.onboarding.namePh} />
              <Input
                label={t.onboarding.plate}
                value={plate}
                onChange={(v) => setPlate(v.toUpperCase().slice(0, 11))}
                placeholder={t.onboarding.platePh}
                mono
              />
              <Input label={t.onboarding.model} value={model} onChange={setModel} placeholder={t.onboarding.modelPh} />
              <label className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
                <span className="text-[14px] font-semibold">{t.onboarding.isEv}</span>
                <Toggle checked={isEV} onChange={setIsEV} label={t.onboarding.isEv} />
              </label>
              <button
                type="button"
                onClick={() => setSample(!sample)}
                className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left"
              >
                <span
                  className={clsx(
                    'grid size-6 place-items-center rounded-md border-2',
                    sample ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong',
                  )}
                >
                  {sample && <Check size={14} weight="bold" />}
                </span>
                <span className="text-[13.5px] font-medium">{t.onboarding.sample}</span>
              </button>
              <p className="px-1 pb-4 text-[12px] text-ink-3">{t.onboarding.privacyNote}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pb-safe flex items-center gap-4 px-6 pt-4">
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 rounded-full bg-ink"
              animate={{ width: i === step ? 26 : 8, opacity: i === step ? 1 : 0.2 }}
            />
          ))}
        </div>
        <Button variant="primary" size="lg" onClick={() => (last ? done() : setStep(step + 1))} className="min-w-[132px]">
          {last ? t.onboarding.start : t.common.next}
          <ArrowRight size={17} weight="bold" />
        </Button>
      </div>
    </motion.div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  mono?: boolean
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none placeholder:text-ink-3 focus:border-brand-500',
          mono && 'font-mono tracking-[0.1em] uppercase',
        )}
      />
    </label>
  )
}

/** Slide 1: the LED board you only see once you are already in the queue, next to the one you could have seen from home. */
function ArtBoards() {
  const t = useT()
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setN((x) => (x + 1) % 2), 2200)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="relative w-full max-w-[320px]">
      <motion.div
        animate={{ rotate: n ? -4 : -2, y: n ? 6 : 0 }}
        className="relative z-10 rounded-[24px] bg-led-bg p-5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.7)]"
      >
        <div className="font-led text-[13px] font-bold tracking-[0.25em] text-white/50">SISA SLOT</div>
        <Led value={n ? 0 : 3} status="penuh" className="mt-1 block text-[76px]" />
        <div className="mt-2 flex gap-[5px]">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} className="h-[7px] flex-1 rounded-full bg-led-penuh shadow-[0_0_8px_#ff5a5faa]" />
          ))}
        </div>
      </motion.div>
      <motion.div
        animate={{ rotate: n ? 6 : 4, x: n ? 8 : 0 }}
        className="absolute -right-2 -bottom-10 z-20 rounded-[20px] bg-surface p-3.5 shadow-float"
      >
        <div className="text-[10px] font-bold tracking-[0.14em] text-ink-3 uppercase">Neo Soho</div>
        <div className="mt-0.5 text-[26px] leading-none font-extrabold text-lega-ink tabular dark:text-led-lega">612</div>
        <div className="text-[11px] text-ink-3">{t.onboarding.artFree}</div>
      </motion.div>
    </div>
  )
}

/** Slide 2: the compare list, rows sliding into their ranked order. */
function ArtCompare() {
  const t = useT()
  const rows = [
    { name: 'Central Park', pct: 96, hex: '#e5484d', min: 29 },
    { name: 'Taman Anggrek', pct: 62, hex: '#0e9f6e', min: 14 },
    { name: 'Neo Soho', pct: 45, hex: '#0e9f6e', min: 13 },
  ]
  const [sorted, setSorted] = useState(false)
  useEffect(() => {
    const id = window.setInterval(() => setSorted((s) => !s), 2000)
    return () => window.clearInterval(id)
  }, [])
  const list = sorted ? [...rows].sort((a, b) => a.min - b.min) : rows
  return (
    <div className="w-full max-w-[320px] space-y-2">
      {list.map((r, i) => (
        <motion.div
          layout
          key={r.name}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className={clsx(
            'flex items-center gap-3 rounded-[20px] border bg-surface p-3',
            sorted && i === 0 ? 'border-brand-500/50' : 'border-line',
          )}
        >
          <span className="grid size-11 place-items-center rounded-[14px] text-[13px] font-extrabold text-white" style={{ background: r.hex }}>
            {r.pct}%
          </span>
          <span className="flex-1 text-[14px] font-bold">{r.name}</span>
          <span className="text-[17px] font-extrabold tabular">
            {r.min}
            <span className="text-[10px] text-ink-3"> {t.unit.min}</span>
          </span>
        </motion.div>
      ))}
    </div>
  )
}

/** Slide 3: the barrier that already counts every car. In minus out, that is the data. */
function ArtBarrier() {
  const t = useT()
  const [count, setCount] = useState({ in: 1412, out: 1219 })
  const [up, setUp] = useState(false)
  useEffect(() => {
    const id = window.setInterval(() => {
      setUp(true)
      setCount((c) => (Math.random() > 0.45 ? { ...c, in: c.in + 1 } : { ...c, out: c.out + 1 }))
      window.setTimeout(() => setUp(false), 900)
    }, 1800)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="w-full max-w-[320px]">
      <svg viewBox="0 0 320 170" className="w-full" aria-hidden="true">
        <rect x="0" y="150" width="320" height="4" rx="2" className="fill-line-strong" />
        <rect x="40" y="70" width="26" height="82" rx="6" className="fill-ink" />
        <rect x="46" y="80" width="14" height="10" rx="2" fill="#43ff9f" />
        <motion.g
          style={{ originX: '53px', originY: '84px' }}
          animate={{ rotate: up ? -62 : 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        >
          <rect x="53" y="79" width="230" height="10" rx="5" fill="#f4f3ef" stroke="#111512" strokeWidth="1.5" />
          {Array.from({ length: 11 }, (_, i) => (
            <rect key={i} x={62 + i * 20} y="79" width="10" height="10" fill="#e5484d" />
          ))}
        </motion.g>
        <circle cx="53" cy="84" r="6" className="fill-ink" />
      </svg>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <Counter label={t.onboarding.artIn} value={count.in} />
        <Counter label={t.onboarding.artOut} value={count.out} />
        <Counter label={t.onboarding.artInside} value={count.in - count.out} strong />
      </div>
    </div>
  )
}

function Counter({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={clsx('rounded-[16px] p-2.5', strong ? 'bg-ink text-canvas' : 'bg-surface-2')}>
      <div className={clsx('font-led text-[24px] font-black tabular', strong && 'text-led-lega')}>{value}</div>
      <div className={clsx('text-[11px] font-semibold', strong ? 'text-canvas/60' : 'text-ink-3')}>{label}</div>
    </div>
  )
}
