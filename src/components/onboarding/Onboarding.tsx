import { ArrowsSplit, CarProfile, Check, Gauge, GoogleLogo, GraduationCap, Motorcycle, Storefront, Ticket } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { VENUES } from '../../data/venues'
import type { VehicleKind, VenueId } from '../../data/types'
import { plateParity } from '../../engine/gage'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { useSignIn } from '../account/useSignIn'
import { Button } from '../ui/Button'
import { Segmented, Toggle } from '../ui/Controls'
import { Plate } from '../ui/Display'
import { Wordmark } from '../ui/Logo'

/*
  First run, the only time the app talks about itself. Four short steps, the
  last two make the app personal (places you go, what you drive). "Lewati"
  on any step drops you straight on the map with sensible defaults. After
  this there is no dashboard and no tour: the map is home.
*/

const STEPS = 4
const CAMPUSES = VENUES.filter((v) => v.category === 'kampus')
const MALLS = VENUES.filter((v) => v.category === 'mall')

export function Onboarding() {
  const t = useT()
  const finish = useApp((s) => s.finishOnboarding)
  const account = useApp((s) => s.account)
  const { available, busy, signIn } = useSignIn()
  const [step, setStep] = useState(0)
  const [favorites, setFavorites] = useState<VenueId[]>([])
  const [kind, setKind] = useState<VehicleKind>('mobil')
  const [name, setName] = useState('')
  const [plate, setPlate] = useState('')
  const [model, setModel] = useState('')
  const [isEV, setIsEV] = useState(false)
  const [sample, setSample] = useState(true)

  const done = () => {
    haptic('success')
    finish({
      name: name.trim() || account?.name.split(' ')[0] || '',
      vehicle: { kind, plate: plate.trim() || 'B 1842 KEN', model: model.trim(), isEV: kind === 'mobil' && isEV },
      favorites,
      withSample: sample,
    })
  }
  const next = () => (step === STEPS - 1 ? done() : setStep(step + 1))
  const toggle = (id: VenueId) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col bg-canvas"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pt-safe px-5 pt-3">
        <div className="flex items-center justify-between">
          <Wordmark />
          {step < STEPS - 1 && (
            <button type="button" onClick={done} className="text-[13px] font-semibold text-ink-3 hover:text-ink">
              {t.onboarding.skip}
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className="h-1 overflow-hidden rounded-full bg-surface-3">
              <motion.span className="block h-full rounded-full bg-ink" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} />
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            className="no-scrollbar absolute inset-0 overflow-y-auto px-6 pt-6 pb-4"
          >
            {step === 0 && <Welcome />}
            {step === 1 && <What />}
            {step === 2 && <Favorites favorites={favorites} toggle={toggle} />}
            {step === 3 && (
              <VehicleStep
                kind={kind}
                setKind={setKind}
                name={name}
                setName={setName}
                plate={plate}
                setPlate={setPlate}
                model={model}
                setModel={setModel}
                isEV={isEV}
                setIsEV={setIsEV}
                sample={sample}
                setSample={setSample}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-safe px-6 pt-2">
        <Button variant="primary" size="lg" block onClick={next}>
          {step === 0 ? t.onboarding.start : step === STEPS - 1 ? t.onboarding.finish : t.common.next}
        </Button>
        {step === 0 && available && !account && (
          <Button
            variant="secondary"
            size="lg"
            block
            className="mt-2"
            disabled={busy}
            onClick={async () => {
              if (await signIn()) setStep(1)
            }}
          >
            <GoogleLogo size={18} weight="bold" /> {busy ? t.profile.signingIn : t.profile.signIn}
          </Button>
        )}
        {step === 0 && <p className="mt-3 text-center text-[11.5px] text-ink-3">{t.onboarding.privacyNote}</p>}
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="mt-2 h-10 w-full text-[13px] font-semibold text-ink-3 hover:text-ink">
            {t.common.back}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function Welcome() {
  const t = useT()
  return (
    <div className="flex min-h-full flex-col">
      <div className="grid flex-1 place-items-center py-2">
        <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[32px] bg-black shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
          <video
            className="size-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster="/brand/loading-poster.jpg"
            aria-hidden="true"
          >
            <source src="/brand/loop.webm" type="video/webm" />
            <source src="/brand/loop.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
      <h1 className="mt-6 text-[30px] leading-[1.08] font-bold tracking-tight text-balance">{t.onboarding.welcomeTitle}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{t.onboarding.welcomeBody}</p>
    </div>
  )
}

function What() {
  const t = useT()
  const icons = [<Gauge key="g" size={22} weight="duotone" />, <ArrowsSplit key="a" size={22} weight="duotone" />, <Ticket key="t" size={22} weight="duotone" />]
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">{t.onboarding.whatTitle}</h1>
      <ul className="mt-6 space-y-5">
        {t.onboarding.what.map((w, i) => (
          <motion.li
            key={w.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.07 }}
            className="flex gap-4"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-surface-2 text-ink">{icons[i]}</span>
            <span>
              <span className="block text-[16px] font-semibold">{w.title}</span>
              <span className="mt-0.5 block text-[14px] leading-relaxed text-ink-2">{w.body}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-8 rounded-[16px] bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-ink-2">{t.onboarding.honest}</p>
    </div>
  )
}

function Favorites({ favorites, toggle }: { favorites: VenueId[]; toggle: (id: VenueId) => void }) {
  const t = useT()
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">{t.onboarding.favTitle}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{t.onboarding.favBody}</p>
      <Group icon={<GraduationCap size={15} weight="fill" />} title={t.onboarding.favCampus}>
        {CAMPUSES.map((v) => (
          <Chip key={v.id} on={favorites.includes(v.id)} onClick={() => toggle(v.id)}>
            {v.name}
          </Chip>
        ))}
      </Group>
      <Group icon={<Storefront size={15} weight="fill" />} title={t.onboarding.favMall}>
        {MALLS.map((v) => (
          <Chip key={v.id} on={favorites.includes(v.id)} onClick={() => toggle(v.id)}>
            {v.name}
          </Chip>
        ))}
      </Group>
    </div>
  )
}

function Group({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink-3">
        {icon} {title}
      </h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className={clsx(
        'flex h-10 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors',
        on ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2 hover:text-ink',
      )}
    >
      {on && <Check size={14} weight="bold" />}
      {children}
    </button>
  )
}

const input = 'h-12 w-full rounded-2xl border border-transparent bg-surface-2 px-4 text-[15px] outline-none placeholder:text-ink-3 focus:border-brand-500'

function VehicleStep(p: {
  kind: VehicleKind
  setKind: (k: VehicleKind) => void
  name: string
  setName: (v: string) => void
  plate: string
  setPlate: (v: string) => void
  model: string
  setModel: (v: string) => void
  isEV: boolean
  setIsEV: (v: boolean) => void
  sample: boolean
  setSample: (v: boolean) => void
}) {
  const t = useT()
  const parity = plateParity(p.plate)
  return (
    <div>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight">{t.onboarding.vehicleTitle}</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{t.onboarding.vehicleBody}</p>
      <Segmented
        value={p.kind}
        onChange={p.setKind}
        options={[
          { value: 'mobil', label: <span className="flex items-center gap-1.5"><CarProfile size={15} weight="fill" /> {t.profile.kinds.mobil}</span> },
          { value: 'motor', label: <span className="flex items-center gap-1.5"><Motorcycle size={15} weight="fill" /> {t.profile.kinds.motor}</span> },
        ]}
        className="mt-5"
      />
      <div className="my-5 grid place-items-center rounded-[22px] bg-surface-2 py-6">
        <Plate plate={(p.plate || t.onboarding.platePh).toUpperCase()} className="scale-[1.5]" />
        {parity && p.kind === 'mobil' && <span className="mt-6 text-[12px] font-semibold text-ink-2">{t.profile.parity(parity)}</span>}
      </div>
      <Field label={t.onboarding.plate}>
        <input
          className={clsx(input, 'font-mono tracking-[0.1em] uppercase')}
          value={p.plate}
          onChange={(e) => p.setPlate(e.target.value.toUpperCase().slice(0, 11))}
          placeholder={t.onboarding.platePh}
        />
      </Field>
      <Field label={t.onboarding.model}>
        <input
          className={input}
          value={p.model}
          onChange={(e) => p.setModel(e.target.value)}
          placeholder={p.kind === 'motor' ? t.onboarding.modelPhMotor : t.onboarding.modelPh}
        />
      </Field>
      <Field label={t.onboarding.name}>
        <input className={input} value={p.name} onChange={(e) => p.setName(e.target.value)} placeholder={t.onboarding.namePh} />
      </Field>
      {p.kind === 'mobil' && (
        <label className="mb-3 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-[14px] font-semibold">{t.onboarding.isEv}</span>
          <Toggle checked={p.isEV} onChange={p.setIsEV} label={t.onboarding.isEv} />
        </label>
      )}
      <button
        type="button"
        onClick={() => p.setSample(!p.sample)}
        className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-left"
      >
        <span
          className={clsx(
            'grid size-6 shrink-0 place-items-center rounded-md border-2',
            p.sample ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong',
          )}
        >
          {p.sample && <Check size={14} weight="bold" />}
        </span>
        <span className="text-[13.5px] font-medium">{t.onboarding.sample}</span>
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">{label}</span>
      {children}
    </label>
  )
}
