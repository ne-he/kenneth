import { Camera, CarProfile, Trash } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useRef, useState } from 'react'
import { VENUE_BY_ID } from '../../data/venues'
import type { VenueId } from '../../data/types'
import { snapshot } from '../../engine/occupancy'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { simNowOf, useApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { Button } from '../ui/Button'
import { Stepper } from '../ui/Controls'
import { SheetHeader } from '../ui/Sheet'

/** Shrink a camera photo so it fits comfortably in localStorage (about 60 to 90 KB). */
async function compress(file: File, max = 720): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const k = Math.min(1, max / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * k)
    c.height = Math.round(img.height * k)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.72)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function Chips({ items, value, onChange, label }: { items: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <button
          key={it}
          type="button"
          role="radio"
          aria-checked={it === value}
          onClick={() => {
            haptic('tap')
            onChange(it)
          }}
          className={clsx(
            'h-10 min-w-12 rounded-[12px] border px-3 text-[14px] font-extrabold',
            it === value ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink-2',
          )}
        >
          {it}
        </button>
      ))}
    </div>
  )
}

export function SaveSpotSheet({ venueId }: { venueId: VenueId }) {
  const t = useT()
  const venue = VENUE_BY_ID[venueId]
  const park = useApp((s) => s.park)
  const { close, notify, setTab, select } = useUi.getState()
  const [level, setLevel] = useState(venue.levels[1] ?? venue.levels[0])
  const [zone, setZone] = useState(venue.zones[2] ?? venue.zones[0])
  const [pillar, setPillar] = useState(12)
  const [lobby, setLobby] = useState(venue.lobbies[0])
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string>()
  const file = useRef<HTMLInputElement>(null)

  const save = () => {
    const at = simNowOf(useApp.getState().clock)
    haptic('success')
    // What the app saved on this arrival: default gate queue versus the recommended one.
    const snap = snapshot(venue, at)
    const savedMin = Math.max(0, Math.round(snap.queueMin - snap.bestGateQueueMin))
    park({ venueId, level, zone, pillar, lobby, photo, note: note.trim() || undefined, at, savedMin })
    close()
    select(null)
    setTab('activity')
    notify(t.park.saved)
  }

  return (
    <div className="pb-4">
      <SheetHeader eyebrow={venue.name} title={t.park.title} onClose={close} closeLabel={t.common.close} />

      <Field label={t.park.level}>
        <Chips items={venue.levels} value={level} onChange={setLevel} label={t.park.level} />
      </Field>
      <Field label={t.park.zone}>
        <Chips items={venue.zones} value={zone} onChange={setZone} label={t.park.zone} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t.park.pillar}>
          <Stepper value={pillar} onChange={setPillar} min={1} max={40} label={t.park.pillar} format={(v) => `${zone}-${v}`} />
        </Field>
        <Field label={t.park.lobby}>
          <select
            value={lobby}
            onChange={(e) => setLobby(e.target.value)}
            className="h-11 w-full rounded-full border border-line bg-surface px-3.5 text-[14px] font-semibold"
          >
            {venue.lobbies.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t.park.photo}>
        <input
          ref={file}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setPhoto(await compress(f))
          }}
        />
        {photo ? (
          <div className="relative overflow-hidden rounded-[18px]">
            <img src={photo} alt="" className="h-40 w-full object-cover" />
            <div className="absolute right-2 bottom-2 flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => file.current?.click()}>
                {t.park.photoChange}
              </Button>
              <Button size="sm" variant="danger" aria-label="Hapus" onClick={() => setPhoto(undefined)}>
                <Trash size={14} />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-dashed border-line-strong text-[13px] font-semibold text-ink-2"
          >
            <Camera size={24} />
            {t.park.photoAdd}
          </button>
        )}
      </Field>

      <Field label={t.park.note}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.park.notePh}
          maxLength={80}
          className="h-11 w-full rounded-full border border-line bg-surface px-4 text-[14px] outline-none placeholder:text-ink-3 focus:border-brand-500"
        />
      </Field>

      <Button variant="primary" size="lg" block onClick={save} className="mt-2">
        <CarProfile size={18} weight="fill" />
        {t.common.save} · {level} {zone}-{pillar}
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 px-1 text-[11px] font-bold tracking-[0.14em] text-ink-3 uppercase">{label}</div>
      {children}
    </div>
  )
}
