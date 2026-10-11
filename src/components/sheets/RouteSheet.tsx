import { ArrowsClockwise, Car } from '@phosphor-icons/react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { occupancyAt } from '../../engine/occupancy'
import { bayOf, zoneOf } from '../../engine/zone'
import { useT } from '../../i18n'
import { useResolvedTheme } from '../../lib/theme'
import { useApp, type ParkedSpot } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { SheetHeader } from '../ui/Sheet'

const FloorScene = lazy(() => import('../park/FloorScene'))

/**
 * The way from the gate to a booked Zona KENNETH bay: the same 3D floor as
 * finding your car, run the other way. A car drives from the entry ramp along
 * the aisle into the bay, and four steps say it in words for the driver's
 * passenger. The floor is drawn from the booking, not a surveyed plan.
 */
export function RouteSheet({ passId }: { passId: string }) {
  const t = useT()
  const theme = useResolvedTheme()
  const now = useNow(60_000)
  const pass = useApp((s) => s.passes.find((p) => p.id === passId))
  const close = useUi((s) => s.close)
  const [metres, setMetres] = useState(0)

  const venue = pass ? VENUE_BY_ID[pass.venueId] : null
  const zone = venue ? zoneOf(venue) : null
  const bay = pass && venue ? bayOf(pass, venue) : ''
  // K-07 becomes section K, bay 7, beside the venue's own sections so the floor reads like the real one.
  const spot = useMemo<ParkedSpot | null>(() => {
    if (!pass || !zone) return null
    const [section, no] = bay.split('-')
    return { venueId: pass.venueId, level: zone.level, section, pillar: Number(no) || 1, lobby: zone.lobby, at: pass.windowStart, savedMin: 0 }
  }, [pass, zone, bay])
  const sections = useMemo(() => (venue && spot ? [...venue.sections.filter((s) => s !== spot.section).slice(0, 2), spot.section] : []), [venue, spot])

  if (!pass || !venue || !zone || !spot) return null
  const gate = venue.gates.find((g) => g.id === pass.gateId) ?? zone.gate
  const steps = t.activity.routeSteps(gate.name, zone.level, bay, zone.lobby)

  return (
    <div className="pb-5">
      <SheetHeader eyebrow={`${t.activity.routeEyebrow} · ${venue.name}`} title={<span className="tabular">{zone.level} · {bay}</span>} onClose={close} closeLabel={t.common.close} />
      <div className="relative -mx-1 h-[300px] overflow-hidden rounded-[24px] border border-line">
        <Suspense
          fallback={
            <div className="grid h-full place-items-center text-[13px] text-ink-3">
              <span className="flex items-center gap-2">
                <ArrowsClockwise size={16} className="animate-spin" /> {t.park.loading3d}
              </span>
            </div>
          }
        >
          <FloorScene
            spot={spot}
            sections={sections}
            occupancy={Math.min(0.97, occupancyAt(venue, now))}
            dark={theme === 'dark'}
            onWalk={setMetres}
            drive={t.activity.ramp}
            bayLabel={bay}
          />
        </Suspense>
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {t.park.view3d}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          <Car size={20} weight="fill" />
        </span>
        <span className="text-[15px] font-semibold">{t.activity.routeDrive(Math.round(metres / 5) * 5)}</span>
      </div>

      <ol className="mt-3 overflow-hidden rounded-[20px] border border-line bg-surface">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3 border-t border-line px-4 py-3 text-[14px] first:border-t-0">
            <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold text-ink-2">{i + 1}</span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
