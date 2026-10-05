import { useT } from '../../../i18n'
import { isPlate, typedPlate } from '../../../lib/plate'
import { Plate } from '../../ui/Display'

/**
 * The plate a booking needs, asked the first time it is needed instead of at
 * onboarding. A saved plate is one quiet row; without one the row is a field,
 * and the panel saves what was typed to the car when the booking goes through.
 */
export function PlateField({ saved, value, onChange, hint }: { saved: string; value: string; onChange: (v: string) => void; hint: string }) {
  const t = useT()
  if (saved) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Plate plate={saved} small />
        <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink-3">{hint}</span>
      </div>
    )
  }
  return (
    <label className="block px-4 py-3">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-3">{t.profile.plate}</span>
      <input
        value={value}
        onChange={(e) => onChange(typedPlate(e.target.value))}
        placeholder={t.onboarding.platePh}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={value.length > 0 && !isPlate(value)}
        className="h-11 w-full rounded-full border border-transparent bg-surface-2 px-4 text-[15px] font-semibold tracking-[0.08em] uppercase outline-none placeholder:font-medium placeholder:tracking-normal placeholder:text-ink-3 focus:border-brand-500"
      />
      <span className="mt-1.5 block text-[12px] leading-snug text-ink-3">{hint}</span>
    </label>
  )
}
