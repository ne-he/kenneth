import { Crown, DoorOpen, SunDim } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { passPhase } from '../../engine/pass'
import { formatRupiah } from '../../engine/pricing'
import { ZONE_HOLD_MIN, bayOf, zoneOf } from '../../engine/zone'
import { useDayLabel, useT } from '../../i18n'
import { clock, dayDiff, stopwatch } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { useCancel } from '../activity/useCancel'
import { CancelConfirm } from '../ui/CancelConfirm'
import { Plate } from '../ui/Display'

/**
 * The Zona KENNETH ticket, styled like a boarding pass: the bay number big
 * enough to read from the driver's seat, and the QR on plain white as a
 * backup for when the barrier camera misses the plate. It follows the theme
 * like every sheet; the accent marks the brand and the live countdown.
 */
export function PassSheet({ passId }: { passId: string }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const now = useNow(1000)
  const pass = useApp((s) => s.passes.find((p) => p.id === passId))
  const plate = useVehicle().plate
  const cancel = useCancel()
  const close = useUi((s) => s.close)
  const [qr, setQr] = useState('')

  useEffect(() => {
    if (!pass) return
    QRCode.toDataURL(`kenneth://pass/${pass.token}?w=${pass.windowStart}`, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: 'M',
      color: { dark: '#121216', light: '#ffffff' },
    }).then(setQr)
  }, [pass])

  if (!pass) return null
  const venue = VENUE_BY_ID[pass.venueId]
  const gate = venue.gates.find((g) => g.id === pass.gateId) ?? venue.gates[0]
  const zone = zoneOf(venue)
  const bay = bayOf(pass, venue)
  const end = pass.windowStart + ZONE_HOLD_MIN * 60_000
  const phase = passPhase(pass.windowStart, now)
  const countdown = phase === 'upcoming' ? pass.windowStart - now : end - now

  return (
    <div className="pb-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 dark:text-brand-300">
            <Crown size={12} weight="fill" /> {t.activity.passTitle}
          </div>
          <h2 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-tight">{venue.name}</h2>
          {zone && <p className="mt-0.5 text-[13px] text-ink-3">{t.activity.bayWhere(zone.level, zone.lobby)}</p>}
        </div>
        <Plate plate={plate} />
      </div>

      <div className="mb-5 flex items-end justify-between rounded-[20px] border border-line px-4 py-3.5">
        <div>
          <div className="text-[12px] font-medium text-ink-3">{t.activity.bay}</div>
          <div className="tabular mt-1 text-[44px] leading-none font-semibold tracking-tight">{bay}</div>
        </div>
        <p className="flex max-w-[55%] items-start gap-1.5 text-right text-[12px] leading-snug text-ink-2">
          <DoorOpen size={15} weight="fill" className="mt-px shrink-0" />
          {t.activity.followSigns(gate.name)}
        </p>
      </div>

      <div className="mx-auto w-full max-w-[260px] rounded-[24px] border border-line bg-white p-3.5 dark:border-transparent">
        {qr ? <img src={qr} alt={pass.token} className="aspect-square w-full" /> : <div className="aspect-square w-full" />}
        <div className="tabular mt-2 text-center text-[13px] font-semibold tracking-[0.06em] text-[#121216]">{pass.token}</div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-ink-3">
        <SunDim size={15} /> {t.activity.qrHint}
      </p>

      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[20px] border border-line text-center">
        <Cell label={t.activity.window} value={clock(pass.windowStart)} />
        <Cell
          label={phase === 'upcoming' ? t.activity.upcoming : phase === 'open' ? t.activity.open : t.activity.expired}
          value={
            phase === 'expired'
              ? '--:--'
              : dayDiff(now, pass.windowStart) > 0
                ? dayLabel(pass.windowStart, now)
                : stopwatch(countdown)
          }
          accent={phase === 'open'}
        />
        <Cell label={t.book.price} value={formatRupiah(pass.price, true)} />
      </div>

      {pass.status === 'active' && phase === 'upcoming' && (
        <CancelConfirm
          className="mt-4"
          policy={t.activity.cancelPolicy}
          onConfirm={() => {
            cancel.pass(pass.id)
            close()
          }}
        />
      )}
    </div>
  )
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-r border-line px-2 py-3 last:border-r-0">
      {/* Two lines are reserved so a wrapping label ("Datang dalam") keeps the three values on one baseline. */}
      <div className="flex min-h-[28px] items-end justify-center text-[11.5px] leading-[14px] font-medium text-ink-3">{label}</div>
      <div className={`tabular mt-1 text-[15px] font-semibold ${accent ? 'text-brand-600 dark:text-brand-400' : 'text-ink'}`}>{value}</div>
    </div>
  )
}
