import { Lightning, SunDim } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { passPhase } from '../../engine/pass'
import { WINDOW_MINUTES, formatRupiah } from '../../engine/pricing'
import { useDayLabel, useT } from '../../i18n'
import { clock, dayDiff, stopwatch } from '../../lib/time'
import { useApp, useVehicle } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Plate } from '../ui/Display'

/**
 * The gate pass, styled like a boarding pass: dark, high contrast, and the
 * QR as big as the sheet allows so a scanner reads it on the first try.
 */
export function PassSheet({ passId }: { passId: string }) {
  const t = useT()
  const dayLabel = useDayLabel()
  const now = useNow(1000)
  const pass = useApp((s) => s.passes.find((p) => p.id === passId))
  const plate = useVehicle().plate
  const cancelPass = useApp((s) => s.cancelPass)
  const { close, notify } = useUi.getState()
  const [qr, setQr] = useState('')

  useEffect(() => {
    if (!pass) return
    QRCode.toDataURL(`kenneth://pass/${pass.token}?w=${pass.windowStart}`, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: 'M',
      color: { dark: '#0c0f0d', light: '#ffffff' },
    }).then(setQr)
  }, [pass])

  if (!pass) return null
  const venue = VENUE_BY_ID[pass.venueId]
  const gate = venue.gates.find((g) => g.id === pass.gateId)!
  const end = pass.windowStart + WINDOW_MINUTES * 60_000
  const phase = passPhase(pass.windowStart, now)
  const countdown = phase === 'upcoming' ? pass.windowStart - now : end - now

  return (
    <div className="pb-5 text-white">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.16em] text-led-lega uppercase">
            <Lightning size={12} weight="fill" /> {t.activity.passTitle}
          </div>
          <h2 className="mt-1 text-[22px] leading-tight font-extrabold">{venue.name}</h2>
          <p className="text-[13px] text-white/60">
            {gate.name} · {gate.hint}
          </p>
        </div>
        <Plate plate={plate} />
      </div>

      <div className="mx-auto w-full max-w-[260px] rounded-[26px] bg-white p-3.5 shadow-[0_0_0_6px_rgb(67_255_159/0.15),0_24px_50px_-18px_rgb(67_255_159/0.35)]">
        {qr ? <img src={qr} alt={pass.token} className="aspect-square w-full" /> : <div className="aspect-square w-full" />}
        <div className="mt-2 text-center font-mono text-[12px] font-bold tracking-[0.2em] text-[#0c0f0d]">{pass.token}</div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/55">
        <SunDim size={15} /> {t.activity.qrHint}
      </p>

      <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-[20px] border border-white/10 text-center">
        <Cell label={t.activity.window} value={`${clock(pass.windowStart)}-${clock(end)}`} />
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
        <button
          type="button"
          onClick={() => {
            cancelPass(pass.id)
            notify(t.activity.passCancelled)
            close()
          }}
          className="mt-4 h-11 w-full rounded-2xl bg-white/8 text-[13.5px] font-semibold text-white/80 hover:bg-white/12"
        >
          {t.activity.cancelPass}
        </button>
      )}
    </div>
  )
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border-r border-white/10 px-2 py-3 last:border-r-0">
      <div className="text-[10px] font-bold tracking-[0.12em] text-white/45 uppercase">{label}</div>
      <div className={`mt-1 font-mono text-[15px] font-bold tabular ${accent ? 'text-led-lega' : 'text-white'}`}>{value}</div>
    </div>
  )
}
