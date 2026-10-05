import { CarProfile, Check, DownloadSimple, Leaf, LockKey, LockSimple, Motorcycle, Plus, Sparkle, Trash, X } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useRef, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VehicleKind, VenueId } from '../../data/types'
import { plateParity } from '../../engine/gage'
import { CO2_KG_PER_L, FUEL_L_PER_MIN, impactOf, sumImpact } from '../../engine/impact'
import { forecastDay, quietestHour } from '../../engine/occupancy'
import { PREMIUM_MONTHLY, formatRupiah } from '../../engine/pricing'
import { useLang, useT } from '../../i18n'
import { BODIES, bodyOf, displayModel } from '../../lib/carBody'
import { matchModel, modelById, searchModels, shortName, type CarModel } from '../../lib/carCatalog'
import { DEFAULT_PAINT, PAINT_ORDER, PAINTS, type CarPaint } from '../../lib/carPaint'
import { haptic } from '../../lib/haptics'
import { dayName, hourLabel, wib } from '../../lib/time'
import { activeVehicleOf, uid, useApp, type CarBody, type Vehicle, type Visit } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Segmented, Toggle } from '../ui/Controls'
import { CountUp, Plate } from '../ui/Display'
import { Label } from '../ui/Kit'
import { SheetHeader } from '../ui/Sheet'
import { BodyIcon, CarSprite, VehicleIcon } from '../ui/VehicleIcon'

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
      <div className="mb-5 grid grid-cols-3 divide-x divide-line rounded-[20px] border border-line py-3.5">
        <Metric label={t.activity.impactTime} value={total.minutes} unit={t.unit.min} />
        <Metric label={t.activity.impactFuel} value={total.fuelL} unit="L" decimals={2} />
        <Metric label={t.activity.impactCo2} value={total.co2Kg} unit="kg" decimals={2} />
      </div>
      <PatternCard history={history} now={now} />
      <Label className="mt-6">{t.activity.impactHow}</Label>
      <p className="mb-4 px-1 text-[13px] leading-relaxed text-ink-2">{t.impactSheet.intro}</p>
      <ol className="space-y-3 px-1">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-4 shrink-0 pt-px font-mono text-[12px] text-ink-3 tabular">{i + 1}</span>
            <span className="text-[13px] leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-[14px] bg-surface-2 p-3 font-mono text-[12px] leading-relaxed text-ink-2">
        fuel_L = minutes × {FUEL_L_PER_MIN}
        <br />
        co2_kg = fuel_L × {CO2_KG_PER_L}
      </div>
      <p className="mt-5 flex gap-2.5 border-t border-line px-1 pt-4 text-[13px] leading-relaxed text-ink-2">
        <Leaf size={18} weight="fill" className="mt-[1px] shrink-0 text-ink-3" />
        {t.impactSheet.bigger}
      </p>
    </div>
  )
}

function Metric({ label, value, unit, decimals = 0 }: { label: string; value: number; unit: string; decimals?: number }) {
  return (
    <div className="min-w-0 px-3.5">
      <div className="truncate text-[11.5px] font-medium text-ink-3">{label}</div>
      <div className="mt-1.5 text-[19px] leading-none font-semibold tracking-tight">
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
  // Malls are a weekend habit, campuses and offices a weekday one.
  const want = venue.category === 'mall' ? 6 : 2
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
          <Button size="sm" variant="primary" onClick={() => open({ kind: 'premium' })}>
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
    { key: 'premium', name: p.premName, price: p.premPrice, unit: p.premUnit, tag: p.premTag, items: p.premItems, tone: 'accent' },
  ] as const
  return (
    <div className="pb-5">
      <SheetHeader title={p.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-5 text-[13px] leading-relaxed text-ink-2">{p.principle}</p>
      {/* Premium is the brand moment here: a soft cornflower tint instead of a solid black card. */}
      <div className="space-y-3">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={clsx(
              'rounded-[20px] border p-4',
              tier.tone === 'accent' ? 'border-brand-200 bg-brand-50 dark:border-brand-400/20 dark:bg-brand-500/10' : 'border-line bg-surface',
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={clsx('text-[12px] font-medium', tier.tone === 'accent' ? 'text-brand-700 dark:text-brand-300' : 'text-ink-3')}>
                  {tier.tag}
                </div>
                <div className="mt-0.5 text-[17px] font-semibold tracking-tight">{tier.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-semibold tracking-tight tabular">{tier.price}</div>
                {tier.unit && <div className="text-[11px] text-ink-3">{tier.unit}</div>}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {tier.items.map((it) => (
                <li key={it} className="flex gap-2 text-[12.5px] text-ink-2">
                  <Check
                    size={14}
                    weight="bold"
                    className={clsx('mt-[2px] shrink-0', tier.tone === 'accent' ? 'text-brand-600 dark:text-brand-300' : 'text-ink-3')}
                  />
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
            variant="ghost"
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
      <p className="mb-5 text-[13.5px] leading-relaxed text-ink-2">{t.privacy.intro}</p>
      <ul className="divide-y divide-line rounded-[20px] border border-line">
        {rules.map((r) => (
          <li key={r} className="flex gap-3 px-4 py-3 text-[13px] leading-relaxed">
            <LockKey size={16} weight="fill" className="mt-[3px] shrink-0 text-ink-3" />
            {r}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
        <span className="flex-1">
          <span className="block text-[14px] font-medium">{t.privacy.share}</span>
          <span className="text-[12px] text-ink-3">{t.privacy.shareHint}</span>
        </span>
        <Toggle checked={shareAnonymous} onChange={(v) => setPref('shareAnonymous', v)} label={t.privacy.share} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={exportData}>
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

/**
 * Which vehicle this trip is in, opened from the chip on Beranda. A motorbike
 * only parks, so picking one drops any service and says why.
 */
export function VehiclePickerSheet() {
  const t = useT()
  const vehicles = useApp((s) => s.vehicles)
  const active = useApp(activeVehicleOf)
  const { setActiveVehicle } = useApp.getState()
  const { close, open, notify, setMode } = useUi.getState()

  const pick = (v: Vehicle) => {
    haptic('tap')
    setActiveVehicle(v.id)
    if (v.kind === 'motor' && useUi.getState().mode !== 'park') {
      setMode('park')
      notify(t.modes.motorSwitched)
    }
    close()
  }

  return (
    <div className="pb-5">
      <SheetHeader title={t.modes.pickVehicle} onClose={close} closeLabel={t.common.close} />
      <ul className="divide-y divide-line">
        {vehicles.map((v) => {
          const on = v.id === active.id
          return (
            <li key={v.id} className="flex items-center gap-2">
              <button type="button" aria-pressed={on} onClick={() => pick(v)} className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left">
                <span className="grid h-12 w-16 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink">
                  <VehicleIcon vehicle={v} size={36} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{displayModel(v) || t.profile.kinds[v.kind]}</span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">
                    <span className="font-mono tracking-wider">{v.plate || t.modes.noPlate}</span>
                    {v.kind === 'mobil' && ` · ${t.profile.bodies[bodyOf(v)]}`}
                    {v.kind === 'mobil' && v.isEV && ' · EV'}
                  </span>
                </span>
                {on && <Check size={18} weight="bold" className="shrink-0 text-ink" />}
              </button>
              <button
                type="button"
                onClick={() => open({ kind: 'vehicle', id: v.id })}
                className="shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                {t.profile.edit}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => open({ kind: 'vehicle', id: 'new' })}
        className="mt-1 flex w-full items-center gap-3 border-t border-line pt-3 text-left text-[15px] font-semibold"
      >
        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-2xl border border-dashed border-line-strong text-ink-2">
          <Plus size={18} weight="bold" />
        </span>
        {t.profile.addVehicle}
      </button>
    </div>
  )
}

const input =
  'h-12 w-full rounded-2xl border border-transparent bg-surface-2 px-4 text-[15px] outline-none placeholder:text-ink-3 focus:border-brand-500'

/**
 * The model, typed or picked. For a car, focusing it lists the best sellers
 * and typing searches every model with an icon, each drawn in the chosen
 * paint. A name that is not in the list is kept as typed; the car then gets
 * the template icon.
 */
function ModelField({
  kind,
  model,
  picked,
  paint,
  onType,
  onPick,
}: {
  kind: VehicleKind
  model: string
  picked: CarModel | undefined
  paint: CarPaint
  onType: (text: string) => void
  onPick: (m: CarModel) => void
}) {
  const t = useT()
  const field = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const car = kind === 'mobil'
  const results = car && open ? searchModels(model, 6) : []
  // Tapping a result must not blur the field first, or the list closes under the finger.
  const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault()
  return (
    <div className="mb-3">
      <label htmlFor="vehicle-model" className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">
        {t.profile.model}
      </label>
      <div className="relative">
        <input
          id="vehicle-model"
          ref={field}
          className={clsx(input, model && 'pr-11')}
          value={model}
          autoComplete="off"
          onChange={(e) => onType(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={car ? t.profile.modelSearch : t.onboarding.modelPhMotor}
        />
        {model && (
          <button
            type="button"
            aria-label={t.profile.modelClear}
            onMouseDown={keepFocus}
            onClick={() => {
              onType('')
              field.current?.focus()
            }}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:text-ink"
          >
            <X size={14} weight="bold" />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div role="listbox" aria-label={t.profile.model} className="mt-2 overflow-hidden rounded-2xl border border-line bg-surface">
          {!model.trim() && <p className="px-3 pt-2.5 pb-1 text-[11.5px] font-semibold text-ink-3">{t.profile.modelPopular}</p>}
          {results.map((m) => (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={picked?.id === m.id}
              onMouseDown={keepFocus}
              onClick={() => {
                haptic('tap')
                onPick(m)
                field.current?.blur()
              }}
              className="flex w-full items-center gap-3 px-3 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <CarSprite id={m.id} paint={paint} height={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{shortName(m)}</span>
                <span className="block truncate text-[12px] text-ink-3">{m.brand}</span>
              </span>
              {picked?.id === m.id && <Check size={16} weight="bold" className="shrink-0 text-brand-600 dark:text-brand-400" />}
            </button>
          ))}
        </div>
      )}
      {car && !open && model.trim() && !picked && <p className="mt-1.5 px-1 text-[12px] leading-snug text-ink-3">{t.profile.modelNotListed}</p>}
    </div>
  )
}

/** The car's paint, drawn on its icon everywhere: the list, the form and the map while driving. */
function PaintPicker({ value, onChange }: { value: CarPaint; onChange: (p: CarPaint) => void }) {
  const t = useT()
  return (
    <div className="mb-3">
      <span className="mb-1.5 flex items-baseline justify-between px-1 text-[13px] font-semibold text-ink-3">
        {t.profile.paint}
        <span className="font-medium text-ink-2">{t.profile.paints[value]}</span>
      </span>
      <div role="radiogroup" aria-label={t.profile.paint} className="flex flex-wrap gap-2.5 px-1">
        {PAINT_ORDER.map((p) => {
          const on = p === value
          return (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t.profile.paints[p]}
              onClick={() => {
                haptic('tap')
                onChange(p)
              }}
              style={{ backgroundColor: PAINTS[p] }}
              className={clsx(
                'grid size-8 place-items-center rounded-full border border-black/10 ring-offset-2 ring-offset-surface transition-shadow dark:border-white/15',
                on ? 'ring-2 ring-brand-600 dark:ring-brand-400' : 'hover:ring-2 hover:ring-line-strong',
              )}
            >
              {on && <Check size={14} weight="bold" className={p === 'putih' || p === 'silver' ? 'text-ink' : 'text-white'} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
  // Unpicked, the shape follows the model as it is typed.
  const [body, setBody] = useState<CarBody | undefined>(base.body)
  const [modelId, setModelId] = useState(base.modelId)
  const [paint, setPaint] = useState<CarPaint>(base.paint ?? DEFAULT_PAINT)
  const car = kind === 'mobil'
  // The catalog model: picked from the list, else what the typed name means.
  const picked = car ? (modelById(modelId) ?? matchModel(model)) : undefined
  const shape = picked?.body ?? bodyOf({ model, body })
  const parity = plateParity(plate)
  const caption = [
    t.profile.kinds[kind],
    car && t.profile.bodies[shape],
    car && isEV ? 'EV' : car && parity ? t.profile.parity(parity) : '',
  ].filter(Boolean)

  return (
    <div className="pb-5">
      <SheetHeader title={creating ? t.profile.addVehicle : t.profile.editVehicle} onClose={close} closeLabel={t.common.close} />
      <div className="mb-4 grid place-items-center rounded-[22px] bg-surface-2 pt-4 pb-6">
        <VehicleIcon vehicle={{ kind, model, body, modelId: picked?.id, paint }} size={96} className="mb-3 text-ink-2" />
        <Plate plate={plate.toUpperCase()} className="scale-150" />
        <span className="mt-6 text-[12px] font-semibold text-ink-2">{caption.join(' · ')}</span>
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
      <ModelField
        kind={kind}
        model={model}
        picked={picked}
        paint={paint}
        onType={(text) => {
          setModel(text)
          setModelId(undefined)
        }}
        onPick={(m) => {
          setModel(m.name)
          setModelId(m.id)
          setBody(undefined)
        }}
      />
      {car && <PaintPicker value={paint} onChange={setPaint} />}
      {car && !picked && (
        <div className="mb-3">
          <span className="mb-1.5 block px-1 text-[13px] font-semibold text-ink-3">{t.profile.body}</span>
          <div role="radiogroup" aria-label={t.profile.body} className="grid grid-cols-4 gap-2">
            {BODIES.map((b) => {
              const on = b === shape
              return (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => {
                    haptic('tap')
                    setBody(b)
                  }}
                  className={clsx(
                    'flex flex-col items-center gap-0.5 rounded-2xl pt-1.5 pb-2.5 text-[12px] font-semibold transition-colors',
                    on ? 'btn-primary text-white' : 'bg-surface-2 text-ink-2 hover:text-ink',
                  )}
                >
                  <BodyIcon body={b} size={34} />
                  {t.profile.bodies[b]}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {car && (
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
          saveVehicle({
            id: base.id,
            kind,
            plate: plate.trim(),
            model: model.trim(),
            isEV: car && isEV,
            body: car && !picked ? body : undefined,
            modelId: picked?.id,
            paint: car ? paint : undefined,
          })
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
