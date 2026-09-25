import { ArrowsClockwise, PersonSimpleWalk, ShareNetwork, SignOut } from '@phosphor-icons/react'
import { lazy, Suspense, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import { occupancyAt } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { shareSpot } from '../../lib/share'
import { useResolvedTheme } from '../../lib/theme'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { SheetHeader } from '../ui/Sheet'

const FloorScene = lazy(() => import('../park/FloorScene'))

export function FindCarSheet() {
  const t = useT()
  const theme = useResolvedTheme()
  const now = useNow(60_000)
  const spot = useApp((s) => s.parked)
  const leave = useApp((s) => s.leave)
  const { close, notify } = useUi.getState()
  const [metres, setMetres] = useState(0)

  if (!spot) return null
  const venue = VENUE_BY_ID[spot.venueId]
  const walkMin = Math.max(1, Math.round(metres / 1.2 / 60))
  const text = `${venue.name}, ${spot.level} pilar ${spot.zone}-${spot.pillar}, dekat ${spot.lobby}`

  return (
    <div className="pb-5">
      <SheetHeader
        eyebrow={venue.name}
        title={
          <span className="tabular">
            {spot.level} · {spot.zone}-{spot.pillar}
          </span>
        }
        onClose={close}
        closeLabel={t.common.close}
      />
      <div className="relative -mx-1 h-[330px] overflow-hidden rounded-[24px] border border-line">
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
            zones={venue.zones}
            occupancy={Math.min(0.97, occupancyAt(venue, now))}
            dark={theme === 'dark'}
            onWalk={setMetres}
          />
        </Suspense>
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {t.park.view3d}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
        <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-white">
          <PersonSimpleWalk size={20} weight="fill" />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] font-bold">{t.park.walkToCar(walkMin)}</span>
          <span className="text-[12px] text-ink-3">
            {spot.lobby}
            {spot.note ? ` · ${spot.note}` : ''}
          </span>
        </span>
      </div>

      {spot.photo && <img src={spot.photo} alt="" className="mt-3 h-40 w-full rounded-[18px] object-cover" />}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => shareSpot(text, () => notify(t.activity.shared))}>
          <ShareNetwork size={17} weight="bold" /> {t.activity.share}
        </Button>
        <Button
          variant="dark"
          onClick={() => {
            haptic('success')
            leave()
            close()
            notify(t.park.left)
          }}
        >
          <SignOut size={17} weight="bold" /> {t.park.leave}
        </Button>
      </div>
    </div>
  )
}
