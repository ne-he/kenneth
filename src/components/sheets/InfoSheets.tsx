import { Check, DownloadSimple, Leaf, LockKey, Trash } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useState } from 'react'
import { CO2_KG_PER_L, FUEL_L_PER_MIN } from '../../engine/impact'
import { PREMIUM_MONTHLY, formatRupiah } from '../../engine/pricing'
import { plateParity } from '../../engine/gage'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Controls'
import { Plate } from '../ui/Display'
import { SheetHeader } from '../ui/Sheet'

export function ImpactSheet() {
  const t = useT()
  const close = useUi((s) => s.close)
  const steps = [t.impactSheet.step1, t.impactSheet.step2, t.impactSheet.step3, t.impactSheet.step4]
  return (
    <div className="pb-5">
      <SheetHeader eyebrow={t.activity.impact} title={t.impactSheet.title} onClose={close} closeLabel={t.common.close} />
      <p className="mb-4 text-[13.5px] leading-relaxed text-ink-2">{t.impactSheet.intro}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-[16px] border border-line bg-surface p-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">{i + 1}</span>
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
            className={clsx(
              'relative overflow-hidden rounded-[22px] border p-4',
              tier.tone === 'dark' ? 'border-transparent bg-[#0f1311] text-white' : 'border-line bg-surface',
            )}
          >
            {tier.tone === 'dark' && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(120% 80% at 100% 0%, rgb(67 255 159 / 0.22), transparent 60%), radial-gradient(90% 70% at 0% 100%, rgb(31 95 214 / 0.25), transparent 60%)',
                }}
              />
            )}
            <div className="relative flex items-start justify-between">
              <div>
                <div className={clsx('text-[11px] font-bold tracking-[0.14em] uppercase', tier.tone === 'dark' ? 'text-led-lega' : 'text-ink-3')}>
                  {tier.tag}
                </div>
                <div className="mt-1 text-[18px] font-extrabold">{tier.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-extrabold tracking-tight tabular">{tier.price}</div>
                {tier.unit && <div className={clsx('text-[11px]', tier.tone === 'dark' ? 'text-white/55' : 'text-ink-3')}>{tier.unit}</div>}
              </div>
            </div>
            <ul className="relative mt-3 space-y-1.5">
              {tier.items.map((it) => (
                <li key={it} className={clsx('flex gap-2 text-[12.5px]', tier.tone === 'dark' ? 'text-white/80' : 'text-ink-2')}>
                  <Check size={14} weight="bold" className={clsx('mt-[2px] shrink-0', tier.tone === 'dark' ? 'text-led-lega' : 'text-brand-600')} />
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
          <li key={r} className="flex gap-3 rounded-[16px] border border-line bg-surface p-3 text-[13px] leading-relaxed">
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
            setTab('explore')
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

export function VehicleSheet() {
  const t = useT()
  const name = useApp((s) => s.name)
  const vehicle = useApp((s) => s.vehicle)
  const setName = useApp((s) => s.setName)
  const setVehicle = useApp((s) => s.setVehicle)
  const close = useUi((s) => s.close)
  const [n, setN] = useState(name)
  const [plate, setPlate] = useState(vehicle.plate)
  const [model, setModel] = useState(vehicle.model)
  const [isEV, setIsEV] = useState(vehicle.isEV)
  const parity = plateParity(plate)
  const input =
    'h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none placeholder:text-ink-3 focus:border-brand-500'

  return (
    <div className="pb-5">
      <SheetHeader title={t.profile.vehicle} onClose={close} closeLabel={t.common.close} />
      <div className="mb-4 grid place-items-center rounded-[22px] bg-surface-2 py-6">
        <Plate plate={plate.toUpperCase()} className="scale-150" />
        {parity && <span className="mt-6 text-[12px] font-semibold text-ink-2">{t.profile.parity(parity)}</span>}
      </div>
      <label className="mb-3 block">
        <span className="mb-1.5 block px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.onboarding.name}</span>
        <input className={input} value={n} onChange={(e) => setN(e.target.value)} placeholder={t.onboarding.namePh} />
      </label>
      <label className="mb-3 block">
        <span className="mb-1.5 block px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.profile.plate}</span>
        <input
          className={clsx(input, 'font-mono tracking-[0.1em] uppercase')}
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase().slice(0, 11))}
          placeholder={t.onboarding.platePh}
        />
      </label>
      <label className="mb-3 block">
        <span className="mb-1.5 block px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{t.profile.model}</span>
        <input className={input} value={model} onChange={(e) => setModel(e.target.value)} placeholder={t.onboarding.modelPh} />
      </label>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="text-[14px] font-semibold">{t.onboarding.isEv}</span>
        <Toggle checked={isEV} onChange={setIsEV} label={t.onboarding.isEv} />
      </div>
      <Button
        variant="primary"
        size="lg"
        block
        onClick={() => {
          setName(n.trim())
          setVehicle({ plate: plate.trim(), model: model.trim(), isEV })
          close()
        }}
      >
        {t.common.save}
      </Button>
    </div>
  )
}
