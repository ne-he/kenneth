import { LockSimple, LockSimpleOpen } from '@phosphor-icons/react'
import { useT } from '../../i18n'

/** Bays drawn in each row. The zone can be up to 40 bays; the map shows the ten around yours. */
const ROW = 10
const BAY_W = 19
const STEP = 21
const ROW_X = 54

/** "Gerbang 3" reads G3 on the map and a named gate keeps its name: "Gerbang utama" reads Utama. */
const gateLabel = (name: string) => {
  const n = name.match(/^Gerbang\s+(\d+)$/i)
  if (n) return `G${n[1]}`
  const rest = name.replace(/^Gerbang\s+/i, '')
  return rest.charAt(0).toUpperCase() + rest.slice(1)
}

/**
 * Where your bay is, drawn small on the ticket: the zone level, the gate with
 * the plate camera, the aisle to the Zona KENNETH bays beside the lift lobby,
 * and your bay with its parking lock. A plan, not a survey: the layout is the
 * same for every building, only the level, the gate and the bay change.
 * The lock is how only you can park there (class feedback, 1 Oct): it stays
 * up until the camera at the gate reads your plate.
 */
export function BayMap({
  bay,
  bays,
  level,
  gate,
  lobby,
  plate,
  phase,
}: {
  bay: string
  bays: number
  level: string
  gate: string
  lobby: string
  plate: string
  phase: 'upcoming' | 'open' | 'expired'
}) {
  const t = useT()
  const n = Number(bay.replace(/\D/g, '')) || 1
  const first = Math.min(Math.max(1, n - 4), Math.max(1, bays - ROW + 1))
  const slot = Math.min(ROW - 1, Math.max(0, n - first))
  const bx = ROW_X + slot * STEP + BAY_W / 2
  const Lock = phase === 'open' ? LockSimpleOpen : LockSimple

  return (
    <section className="mb-5 overflow-hidden rounded-[20px] border border-line">
      <svg viewBox="0 0 320 172" className="block w-full" role="img" aria-label={t.activity.mapLabel(level, gate, bay, lobby)}>
        <rect x="0" y="0" width="320" height="172" className="fill-surface-2" />
        {/* The aisle from the gate along the zone. */}
        <rect x="0" y="88" width="264" height="28" className="fill-surface dark:fill-surface-3" />
        {/* Zona KENNETH bays in the accent tint, yours filled. */}
        {Array.from({ length: ROW }, (_, i) => (
          <rect
            key={`z${i}`}
            x={ROW_X + i * STEP}
            y={40}
            width={BAY_W}
            height={44}
            rx={3}
            className={i === slot ? 'fill-brand-600' : 'fill-brand-100 dark:fill-brand-500/25'}
          />
        ))}
        {/* Ordinary bays across the aisle. */}
        {Array.from({ length: ROW }, (_, i) => (
          <rect key={`o${i}`} x={ROW_X + i * STEP} y={120} width={BAY_W} height={44} rx={3} className="fill-surface-3 dark:fill-ink/10" />
        ))}
        {/* Lift lobby, right next to the zone. */}
        <rect x="272" y="40" width="40" height="76" rx="9" className="fill-ink/10" />
        <path d="M292 56 l-6 8 h12 z M292 86 l-6 -8 h12 z" className="fill-ink-2" />
        <text x="292" y="106" textAnchor="middle" className="fill-ink-2 text-[9.5px] font-semibold">
          {t.activity.lift}
        </text>
        {/* The gate: a barrier with the plate camera above it. */}
        <line x1="40" y1="88" x2="40" y2="116" className="stroke-ink-3" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="33" y="70" width="14" height="10" rx="3" className="fill-ink-2" />
        <circle cx="40" cy="75" r="2.6" className="fill-surface-2" />
        <text x="8" y="64" className="fill-ink-2 text-[10px] font-semibold">
          {gateLabel(gate)}
        </text>
        {/* The way in, from the gate along the aisle to your bay. */}
        <path
          d={`M6 102 H${bx} V86`}
          fill="none"
          className="stroke-brand-600 dark:stroke-brand-400"
          strokeWidth="2.5"
          strokeDasharray="5 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* The parking lock at the mouth of your bay. */}
        <g transform={`translate(${bx - 5} ${phase === 'open' ? 70 : 72})`} className="fill-white stroke-white">
          <path d={phase === 'open' ? 'M2 5 V2.5 a3 3 0 0 1 6 0' : 'M2 5 V2.5 a3 3 0 0 1 6 0 V5'} fill="none" strokeWidth="1.4" />
          <rect x="0" y="5" width="10" height="7.5" rx="1.5" stroke="none" />
        </g>
        {/* Your bay's number above it. */}
        <rect x={bx - 18} y="12" width="36" height="18" rx="9" className="fill-ink" />
        <text x={bx} y="24.5" textAnchor="middle" className="fill-canvas text-[10px] font-bold">
          {bay}
        </text>
        {/* Which level this is. */}
        <rect x="8" y="10" width="30" height="20" rx="6" className="fill-surface dark:fill-surface-3" />
        <text x="23" y="24" textAnchor="middle" className="fill-ink text-[10.5px] font-semibold">
          {level}
        </text>
      </svg>
      <div className="flex gap-3 border-t border-line px-4 py-3">
        <Lock size={18} weight="fill" className="mt-px shrink-0 text-brand-600 dark:text-brand-400" />
        <p className="text-[12.5px] leading-snug text-ink-2">
          <span className="block font-semibold text-ink">
            {phase === 'upcoming' ? t.activity.lockUp(bay) : phase === 'open' ? t.activity.lockOpen(bay) : t.activity.lockDone(bay)}
          </span>
          {t.activity.lockHow(plate || t.onboarding.platePh)}
        </p>
      </div>
    </section>
  )
}
