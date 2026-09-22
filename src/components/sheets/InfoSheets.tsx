import { CarProfile, Check, DownloadSimple, Leaf, LockKey, LockSimple, Motorcycle, Sparkle, Trash } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VehicleKind, VenueId } from '../../data/types'
import { plateParity } from '../../engine/gage'
import { CO2_KG_PER_L, FUEL_L_PER_MIN, impactOf, sumImpact } from '../../engine/impact'
import { forecastDay, quietestHour } from '../../engine/occupancy'
import { PREMIUM_MONTHLY, formatRupiah } from '../../engine/pricing'
import { useLang, useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { dayName, hourLabel, wib } from '../../lib/time'
import { activeVehicleOf, uid, useApp, type Vehicle, type Visit } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Segmented, Toggle } from '../ui/Controls'
import { CountUp, Plate } from '../ui/Display'
import { Label } from '../ui/Kit'
import { SheetHeader } from '../ui/Sheet'

/** Monthly impact, how it is counted, and the Premium habit insight. */
export function ImpactSheet() {
  const t = useT()
  const now = useNow(60_000)
  const close = useUi((s) => s.close)
  const history = useApp((s) => s.history)
  const isEV = useApp((s) => activeVehicleOf(s).isEV)
  const month = history.filter((v) => now - v.at < 31 * 86_400_000)
  const total = sumImpact(month.map((v) => impactOf(v.minutesSaved, isEV)))
  const steps = [t.impactSheet.step1, t.impactSheet.step2, t.impactSheet.step3, t.impactSheet.step4]
  return (
    <div className="pb-5">
      <SheetHeader eyebrow={t.activity.impact} title={t.impactSheet.title} onClose={close} closeLabel={t.common.close} />
      <div className="mb-5 grid grid-cols-3 gap-2">
        <Metric label={t.activity.impactTime} value={total.minutes} unit={t.unit.min} />
        <Metric label={t.activity.impactFuel} value={total.fuelL} unit="L" decimals={2} />
        <Metric label={t.activity.impactCo2} value={total.co2Kg} unit="kg" decimals={2} />
      </div>
      <PatternCard history={history} now={now} />
      <Label className="mt-5">{t.activity.impactHow}</Label>
      <p className="mb-3 px-1 text-[13px] leading-relaxed text-ink-2">{t.impactSheet.intro}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-[16px] bg-surface-2 p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[12px] font-bold text-canvas">{i + 1}</span>
            <span className="text-[13px] leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 rounded-[16px] bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-ink-2">
        fuel_L = minutes × {FUEL_L_PER_MIN}
        <br />
        co2_kg = fuel_L × {CO2_KG_PER_L}
      </div>
      <p className="mt-4 flex gap-2.5 rounded-[18px] bg-lega-soft p-3.5 text-[13px] leading-relaxed text-lega-ink dark:bg-lega/10 dark:text-led-lega">
        <Leaf size={20} weight="fill" className="mt-[1px] shrink-0" />
        {t.impactSheet.bigger}
      </p>
    </div>
  )
}

function Metric({ label, value, unit, decimals = 0 }: { label: string; value: number; unit: string; decimals?: number }) {
  return (
    <div className="rounded-[16px] bg-surface-2 p-3">
      <div className="text-[11.5px] font-medium text-ink-3">{label}</div>
      <div className="mt-1 text-[19px] leading-none font-bold tracking-tight">
        <CountUp value={value} decimals={decimals} />
        <span className="ml-0.5 text-[11px] font-semibold text-ink-3">{unit}</span>
      </div>
    </div>
  )
}

/** Feature 11, personal pattern. Premium only, shown blurred on Free. */
function PatternCard({ history, now }: { history: Visit[]; now: number }) {
  const t = useT()
  const lang = useLang()
  const plan = useApp((s) => s.plan)
  const open = useUi((s) => s.open)
  if (history.length < 3) return null

  const counts = new Map<VenueId, number>()
  history.forEach((v) => counts.set(v.venueId, (counts.get(v.venueId) ?? 0) + 1))
  const venue = VENUE_BY_ID[[...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]]
  // Malls are a weekend habit, campuses a weekday one.
  const want = venue.category === 'kampus' ? 2 : 6
  const day = history.find((v) => v.venueId === venue.id && wib(v.at).day === want)?.at ?? now
  const [openH, closeH] = venue.hours
  const series = forecastDay(venue, day)
  const worst = series.filter((p) => p.hour > openH && p.hour < closeH - 1).reduce((a, b) => (b.queueMin > a.queueMin ? b : a))
  const best = quietestHour(venue, day)
  const diff = Math.max(1, Math.round(worst.queueMin - best.queueMin))
  const body = t.premium.patternBody(venue.name, dayName(day, lang, false), hourLabel(worst.hour), hourLabel(best.hour), diff)

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-line p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-3">
        <Sparkle size={14} weight="fill" className="text-brand-500" /> {t.premium.pattern}
      </div>
      <p className={clsx('mt-2 text-[14px] leading-relaxed font-medium', plan !== 'premium' && 'blur-[5px] select-none')}>{body}</p>
      {plan !== 'premium' && (
        <div className="absolute inset-0 grid place-items-center bg-surface/40">
          <Button size="sm" variant="dark" onClick={() => open({ kind: 'premium' })}>
            <LockSimple size={14} weight="fill" /> {t.premium.locked}
          </Button>
        </div>
      )}
    </section>
  )
}

export function PremiumSheet() {
  const t = useT()
  const plan = useApp((s) => s.plan)
  const setPlan = useApp((s) => s.setPlan)
  const { close, notify } = useUi.getState()
  const p = t.premium
  const tiers = [
    { key: 'free', name: p.freeName, price: p.freePrice, unit: '', tag: p.freeTag, items: p.freeItems, tone: 'plain' },
    { key: 'pay', name: p.payName, price: p.payPrice, unit: p.payUnit, tag: p.payTag, items: p.payItems, tone: 'plain' },
    { key: 'premium', name: p.premName, price: p.premPrice, unit: p.premUnit, tag: p.premTag, items: p.premItems, tone: 'dark' },
  ] as const
  return (
    <div className="pb-5">
      <SheetHeader title={p.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 text-[13px] leading-relaxed text-ink-2">{p.principle}</p>
      <div className="space-y-2.5">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={clsx('rounded-[20px] border p-4', tier.tone === 'dark' ? 'border-transparent bg-ink text-canvas' : 'border-line bg-surface')}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={clsx('text-[12px] font-semibold', tier.tone === 'dark' ? 'text-canvas/60' : 'text-ink-3')}>{tier.tag}</div>
                <div className="mt-0.5 text-[17px] font-bold">{tier.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold tracking-tight tabular">{tier.price}</div>
                {tier.unit && <div className={clsx('text-[11px]', tier.tone === 'dark' ? 'text-canvas/60' : 'text-ink-3')}>{tier.unit}</div>}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {tier.items.map((it) => (
                <li key={it} className={clsx('flex gap-2 text-[12.5px]', tier.tone === 'dark' ? 'text-canvas/80' : 'text-ink-2')}>
                  <Check size={14} weight="bold" className={clsx('mt-[2px] shrink-0', tier.tone === 'dark' ? 'text-brand-400' : 'text-brand-600')} />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4">
        {plan === 'premium' ? (
          <Button
            block
            size="lg"
            variant="secondary"
            onClick={() => {
              setPlan('free')
              close()
            }}
          >
            {p.downgrade}
          </Button>
        ) : (
          <Button
            block
            size="lg"
            variant="primary"
            onClick={() => {
              haptic('success')
              setPlan('premium')
              notify(p.activated)
              close()
            }}
          >
            {p.activate} · {formatRupiah(PREMIUM_MONTHLY, true)}
          </Button>
        )}
        <p className="mt-2 text-center text-[11px] text-ink-3">{t.book.demoPay}</p>
      </div>
    </div>
  )
}

export function PrivacySheet() {
  const t = useT()
  const shareAnonymous = useApp((s) => s.prefs.shareAnonymous)
  const setPref = useApp((s) => s.setPref)
  const resetAll = useApp((s) => s.resetAll)
  const { close, notify, setTab } = useUi.getState()
  const [confirm, setConfirm] = useState(false)
  const rules = [t.privacy.rule1, t.privacy.rule2, t.privacy.rule3, t.privacy.rule4]

  const exportData = () => {
    const { clock: _clock, ...data } = useApp.getState()
    void _clock
    const plain = JSON.parse(JSON.stringify(data, (k, v) => (typeof v === 'function' || k === 'photo' ? undefined : v)))
    const blob = new Blob([JSON.stringify(plain, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'kenneth-data.json'
    a.click()
    URL.revokeObjectURL(a.href)
    notify(t.privacy.exported)
  }

  return (
    <div className="pb-5">
      <SheetHeader title={t.privacy.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-2">{t.privacy.intro}</p>
      <ul className="space-y-2">
        {rules.map((r) => (
          <li key={r} className="flex gap-3 rounded-[16px] bg-surface-2 p-3 text-[13px] leading-relaxed">
            <LockKey size={18} weight="fill" className="mt-[1px] shrink-0 text-brand-600" />
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
        <span className="flex-1">
          <span className="block text-[14px] font-semibold">{t.privacy.share}</span>
          <span className="text-[12px] text-ink-3">{t.privacy.shareHint}</span>
        </span>
        <Toggle checked={shareAnonymous} onChange={(v) => setPref('shareAnonymous', v)} label={t.privacy.share} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={exportData}>
          <DownloadSimple size={16} weight="bold" /> {t.privacy.exportShort}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!confirm) return setConfirm(true)
            resetAll()
            close()
            setTab('park')
          }}
        >
          <Trash size={16} weight="bold" />
          {confirm ? t.common.confirmDelete : t.common.delete}
        </Button>
      </div>
      {confirm && <p className="mt-2 text-center text-[12px] font-semibold text-penuh-ink">{t.profile.resetConfirm}</p>}
      <p className="mt-4 text-center text-[11px] text-ink-3">{t.privacy.law}</p>
    </div>
  )
}

const input =
  'h-12 w-full rounded-2xl border border-transparent bg-surface-2 px-4 text-[15px] outline-none placeholder:text-ink-3 focus:border-brand-500'

/**
 * Add or edit one vehicle. `id` undefined edits the one in use, 'new' starts
 * a blank one. The name field lives here too, it is the only other thing
 * the pass and the valet ticket print.
 */
export function VehicleSheet({ id }: { id?: string }) {
  const t = useT()
  const name = useApp((s) => s.name)
  const vehicles = useApp((s) => s.vehicles)
  const active = useApp(activeVehicleOf)
  const { setName, saveVehicle, removeVehicle } = useApp.getState()
  const close = useUi((s) => s.close)
  const creating = id === 'new' || (id === undefined && vehicles.length === 0)
  // Read once: a new vehicle keeps the same id while the form is open.
  const [base] = useState<Vehicle>(() =>
    creating ? { id: uid(), kind: 'mobil', model: '', plate: '', isEV: false } : (vehicles.find((v) => v.id === id) ?? active),
  )
  const [n, setN] = useState(name)
  const [kind, setKind] = useState<VehicleKind>(base.kind)
  const [plate, setPlate] = useState(base.plate)
  const [model, setModel] = useState(base.model)
  const [isEV, setIsEV] = useState(base.isEV)
  const parity = plateParity(plate)

  return (
    <div className="pb-5">
      <SheetHeader title={creating ? t.profile.addVehicle : t.profile.editVehicle} onClose={close} closeLabel={t.common.close} />
      <div className="mb-4 grid place-items-center rounded-[22px] bg-surface-2 py-6">
        <Plate plate={plate.toUpperCase()} className="scale-150" />
        <span className="mt-6 text-[12px] font-semibold text-ink-2">
          {kind === 'motor' ? t.profile.kinds.motor : t.profile.kinds.mobil}
          {isEV && kind === 'mobil' ? ' · EV' : parity && kind === 'mobil' ? ` · ${t.profile.parity(parity)}` : ''}
        </span>
      </div>
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'mobil', label: <span className="flex items-center gap-1.5"><CarProfile size={15} weight="fill" /> {t.profile.kinds.mobil}</span> },
          { value: 'motor', label: <span className="flex items-center gap-1.5"><Motorcycle size={15} weight="fill" /> {t.profile.kinds.motor}</span> },
        ]}
        className="mb-4"
      />
      <label className="mb-3 block">
        <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">{t.profile.plate}</span>
        <input
          className={clsx(input, 'font-mono tracking-[0.1em] uppercase')}
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase().slice(0, 11))}
          placeholder={t.onboarding.platePh}
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">{t.profile.model}</span>
        <input
          className={input}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={kind === 'motor' ? t.onboarding.modelPhMotor : t.onboarding.modelPh}
        />
      </label>
      {kind === 'mobil' && (
        <div className="mb-3 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <span className="text-[14px] font-semibold">{t.onboarding.isEv}</span>
          <Toggle checked={isEV} onChange={setIsEV} label={t.onboarding.isEv} />
        </div>
      )}
      <label className="mb-4 block">
        <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">{t.onboarding.name}</span>
        <input className={input} value={n} onChange={(e) => setN(e.target.value)} placeholder={t.onboarding.namePh} />
      </label>
      <Button
        variant="primary"
        size="lg"
        block
        onClick={() => {
          haptic('success')
          setName(n.trim())
          saveVehicle({ id: base.id, kind, plate: plate.trim(), model: model.trim(), isEV: kind === 'mobil' && isEV })
          close()
        }}
      >
        {t.common.save}
      </Button>
      {!creating && vehicles.length > 1 && (
        <Button
          variant="danger"
          block
          className="mt-2"
          onClick={() => {
            removeVehicle(base.id)
            close()
          }}
        >
          <Trash size={16} weight="bold" /> {t.profile.removeVehicle}
        </Button>
      )}
    </div>
  )
}
