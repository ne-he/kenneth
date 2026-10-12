import { Car, CheckCircle, Eye, HandTap, Trash } from '@phosphor-icons/react'
import clsx from 'clsx'
import { useMemo, useState, type FormEvent } from 'react'
import { Segmented } from '../components/ui/Controls'
import { buttonClass } from '../components/ui/buttonStyles'
import { PROMOS, type Promo } from '../data/promos'
import type { Venue } from '../data/types'
import { promoStats } from '../engine/merchant'
import { wib } from '../lib/time'
import { useMerchant } from '../store/merchant'
import { Card, Kpi } from './mitraKit'

type Lang = 'id' | 'en'

const COPY = {
  id: {
    seen: 'Dilihat di app',
    taps: 'Diketuk',
    perks: 'Parkir gratis dipakai',
    perksNote: 'Struk yang ditukar di palang',
    mine: (v: string) => `Promo kamu di ${v}`,
    mineSub: 'Perkiraan hari yang dipilih, dari mobil yang masuk saat promo berjalan',
    none: 'Belum ada promo di sini. Buat yang pertama di sebelah.',
    merchant: 'Merchant',
    schedule: 'Jadwal',
    live: 'Tayang',
    off: 'Tidak hari ini',
    remove: 'Hapus',
    create: 'Buat promo',
    createSub: 'Langsung tayang di halaman tempat ini di app',
    kind: { promo: 'Promo', event: 'Acara' },
    name: 'Nama merchant',
    title: 'Judul promo',
    titlePh: 'Contoh: Diskon 20% semua minuman',
    floor: 'Lantai',
    days: 'Hari',
    from: 'Mulai',
    to: 'Sampai',
    perk: 'Bonus parkir (opsional)',
    perkPh: 'Contoh: Gratis parkir 2 jam, belanja min. Rp200rb',
    busy: 'Acara ini bikin parkiran lebih ramai',
    submit: 'Tayangkan',
    errTitle: 'Isi judul promo.',
    errName: 'Isi nama merchant.',
    errDays: 'Pilih minimal satu hari.',
    errHours: 'Jam selesai harus setelah jam mulai.',
    done: (v: string) => `Tayang di halaman ${v}.`,
    dayNames: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
    all: 'Semua merchant',
  },
  en: {
    seen: 'Seen in the app',
    taps: 'Tapped',
    perks: 'Free parking used',
    perksNote: 'Receipts redeemed at the barrier',
    mine: (v: string) => `Your offers at ${v}`,
    mineSub: 'Estimate for the chosen day, from cars that come in while each offer runs',
    none: 'No offers here yet. Make the first one alongside.',
    merchant: 'Merchant',
    schedule: 'Schedule',
    live: 'Live',
    off: 'Not today',
    remove: 'Delete',
    create: 'New offer',
    createSub: 'Goes live on this place’s page in the app',
    kind: { promo: 'Offer', event: 'Event' },
    name: 'Merchant name',
    title: 'Offer title',
    titlePh: 'Example: 20% off all drinks',
    floor: 'Floor',
    days: 'Days',
    from: 'From',
    to: 'Until',
    perk: 'Parking perk (optional)',
    perkPh: 'Example: 2 hours free parking, spend Rp200k',
    busy: 'This event fills the car park faster',
    submit: 'Publish',
    errTitle: 'Add a title.',
    errName: 'Add the merchant name.',
    errDays: 'Pick at least one day.',
    errHours: 'The end time must be after the start.',
    done: (v: string) => `Live on the ${v} page.`,
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    all: 'All merchants',
  },
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 6)
const hh = (h: number) => `${String(h).padStart(2, '0')}.00`
const field = 'h-11 w-full rounded-full border border-transparent bg-surface-2 px-4 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-brand-500'

/** The merchant side of /mitra: how your offers do, and a form to publish a new one. */
export function MerchantView({ venue, dayTs, lang }: { venue: Venue; dayTs: number; lang: Lang }) {
  const c = COPY[lang]
  const mine = useMerchant((s) => s.promos)
  const removePromo = useMerchant((s) => s.removePromo)
  const all = useMemo(() => [...mine, ...PROMOS].filter((p) => p.venueId === venue.id), [mine, venue.id])
  const merchants = useMemo(() => [...new Set(all.map((p) => p.merchant))], [all])
  const [who, setWho] = useState<string>('')
  const shown = who ? all.filter((p) => p.merchant === who) : all
  const day = wib(dayTs).day
  const rows = useMemo(() => shown.map((p) => ({ p, s: p.days.includes(day) ? promoStats(p, venue, dayTs) : { seen: 0, taps: 0, perks: 0 } })), [shown, day, venue, dayTs])
  const sum = rows.reduce((a, r) => ({ seen: a.seen + r.s.seen, taps: a.taps + r.s.taps, perks: a.perks + r.s.perks }), { seen: 0, taps: 0, perks: 0 })
  const ownIds = new Set(mine.map((p) => p.id))

  return (
    <>
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi icon={<Eye size={18} weight="fill" />} label={c.seen} value={sum.seen} />
        <Kpi icon={<HandTap size={18} weight="fill" />} label={c.taps} value={sum.taps} />
        <Kpi icon={<Car size={18} weight="fill" />} label={c.perks} value={sum.perks} note={c.perksNote} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card title={c.mine(venue.name)} sub={c.mineSub}>
          {merchants.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {['', ...merchants].map((m) => (
                <button
                  key={m || 'all'}
                  type="button"
                  aria-pressed={who === m}
                  onClick={() => setWho(m)}
                  className={clsx(
                    'h-8 rounded-full border px-3 text-[12.5px] font-medium',
                    who === m ? 'border-brand-600/24 bg-brand-600/12 text-ink dark:border-brand-400/30 dark:bg-brand-500/15' : 'border-line text-ink-2 hover:text-ink',
                  )}
                >
                  {m || c.all}
                </button>
              ))}
            </div>
          )}
          {rows.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-3">{c.none}</p>
          ) : (
            <div className="-mx-1 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px] tabular">
                <thead>
                  <tr className="text-[11.5px] text-ink-3">
                    <th className="px-1 py-1.5 font-semibold">{c.merchant}</th>
                    <th className="px-1 py-1.5 font-semibold">{c.schedule}</th>
                    <th className="px-1 py-1.5 text-right font-semibold">{c.seen}</th>
                    <th className="px-1 py-1.5 text-right font-semibold">{c.taps}</th>
                    <th className="px-1 py-1.5 text-right font-semibold">{c.perks}</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, s }) => (
                    <tr key={p.id} className="border-t border-line align-top">
                      <td className="px-1 py-2.5">
                        <span className="block text-[12px] text-ink-3">
                          {p.merchant} · {c.kind[p.kind]}
                        </span>
                        <span className="font-medium">{p.title[lang]}</span>
                      </td>
                      <td className="px-1 py-2.5 text-ink-2">
                        <span className="block">{p.days.length === 7 ? '' : p.days.map((d) => c.dayNames[d]).join(', ')}</span>
                        {hh(p.from)}–{hh(p.to)}
                        <span className={clsx('mt-1 block text-[11.5px] font-semibold', p.days.includes(day) ? 'text-lega-ink dark:text-led-lega' : 'text-ink-3')}>
                          {p.days.includes(day) ? c.live : c.off}
                        </span>
                      </td>
                      <td className="px-1 py-2.5 text-right">{s.seen.toLocaleString('id-ID')}</td>
                      <td className="px-1 py-2.5 text-right">{s.taps.toLocaleString('id-ID')}</td>
                      <td className="px-1 py-2.5 text-right">{p.parking ? s.perks.toLocaleString('id-ID') : '-'}</td>
                      <td className="px-1 py-2">
                        {ownIds.has(p.id) && (
                          <button type="button" onClick={() => removePromo(p.id)} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-penuh-soft hover:text-penuh-ink" aria-label={c.remove}>
                            <Trash size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title={c.create} sub={c.createSub}>
          <NewPromo key={venue.id} venue={venue} lang={lang} defaultName={who || merchants[0] || ''} />
        </Card>
      </section>
    </>
  )
}

function NewPromo({ venue, lang, defaultName }: { venue: Venue; lang: Lang; defaultName: string }) {
  const c = COPY[lang]
  const addPromo = useMerchant((s) => s.addPromo)
  const [kind, setKind] = useState<Promo['kind']>('promo')
  const [name, setName] = useState(defaultName)
  const [title, setTitle] = useState('')
  const [floor, setFloor] = useState('Lt. 1')
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [from, setFrom] = useState(10)
  const [to, setTo] = useState(21)
  const [perk, setPerk] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = !name.trim() ? c.errName : !title.trim() ? c.errTitle : days.length === 0 ? c.errDays : to <= from ? c.errHours : ''
    setError(err)
    setDone(false)
    if (err) return
    addPromo({
      id: `m-${Date.now()}`,
      venueId: venue.id,
      merchant: name.trim(),
      kind,
      title: { id: title.trim(), en: title.trim() },
      floor: floor.trim() || '-',
      days: [...days].sort((a, b) => a - b),
      from,
      to,
      parking: perk.trim() ? { id: perk.trim(), en: perk.trim() } : undefined,
      busy: kind === 'event' && busy,
    })
    setTitle('')
    setPerk('')
    setDone(true)
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-3">
      <Segmented value={kind} onChange={setKind} options={[{ value: 'promo', label: c.kind.promo }, { value: 'event', label: c.kind.event }]} />
      <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
        {c.name}
        <input id="m-name" className={field + ' text-ink'} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
        {c.title}
        <input id="m-title" className={field + ' text-ink'} value={title} placeholder={c.titlePh} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
          {c.floor}
          <input id="m-floor" className={field + ' text-ink'} value={floor} onChange={(e) => setFloor(e.target.value)} />
        </label>
        <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
          {c.from}
          <select id="m-from" className={field + ' text-ink'} value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hh(h)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
          {c.to}
          <select id="m-to" className={field + ' text-ink'} value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {hh(h)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-[13px] font-medium text-ink-3">{c.days}</legend>
        <div className="flex flex-wrap gap-1.5">
          {c.dayNames.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(i)}
              onClick={() => setDays((x) => (x.includes(i) ? x.filter((y) => y !== i) : [...x, i]))}
              className={clsx(
                'h-8 min-w-11 rounded-full border px-2.5 text-[12.5px] font-medium',
                days.includes(i) ? 'border-brand-600/24 bg-brand-600/12 text-ink dark:border-brand-400/30 dark:bg-brand-500/15' : 'border-line text-ink-2',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1.5 text-[13px] font-medium text-ink-3">
        {c.perk}
        <input id="m-perk" className={field + ' text-ink'} value={perk} placeholder={c.perkPh} onChange={(e) => setPerk(e.target.value)} />
      </label>
      {kind === 'event' && (
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <input id="m-busy" type="checkbox" checked={busy} onChange={(e) => setBusy(e.target.checked)} className="size-4 accent-[var(--color-brand-600)]" />
          {c.busy}
        </label>
      )}
      {error && <p className="text-[12.5px] font-medium text-penuh-ink dark:text-led-penuh" role="alert">{error}</p>}
      {done && (
        <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-lega-ink dark:text-led-lega" role="status">
          <CheckCircle size={15} weight="fill" /> {c.done(venue.name)}
        </p>
      )}
      <button type="submit" className={buttonClass('primary', 'md')}>
        {c.submit}
      </button>
    </form>
  )
}

/** For the venue manager: every offer and event in the building that day, and which ones bring more cars. */
export function VenuePromos({ venue, dayTs, lang }: { venue: Venue; dayTs: number; lang: Lang }) {
  const v = VCOPY[lang]
  const mine = useMerchant((s) => s.promos)
  const day = wib(dayTs).day
  const rows = useMemo(
    () =>
      [...mine, ...PROMOS]
        .filter((p) => p.venueId === venue.id && p.days.includes(day))
        .sort((a, b) => a.from - b.from)
        .map((p) => ({ p, s: promoStats(p, venue, dayTs) })),
    [mine, venue, day, dayTs],
  )
  return (
    <Card title={v.title} sub={v.sub(rows.length)}>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-ink-3">{v.none}</p>
      ) : (
        <div className="divide-y divide-line">
          {rows.map(({ p, s }) => (
            <div key={p.id} className="flex items-start justify-between gap-3 py-2.5 text-[13px]">
              <span className="min-w-0">
                <span className="block text-[12px] text-ink-3">
                  {p.merchant} · {hh(p.from)}–{hh(p.to)}
                </span>
                <span className="font-medium">{p.title[lang]}</span>
                {p.busy && <span className="mt-1 block text-[12px] font-medium text-ramai-ink dark:text-led-ramai">{v.busy}</span>}
              </span>
              <span className="shrink-0 text-right tabular text-ink-2">
                {s.seen.toLocaleString('id-ID')}
                <span className="block text-[11.5px] text-ink-3">{v.seen}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

const VCOPY = {
  id: {
    title: 'Promo dan acara di gedung ini',
    sub: (n: number) => `${n} berjalan di hari yang dipilih. Merchant mengaturnya sendiri dari tab Merchant.`,
    none: 'Tidak ada promo atau acara di hari ini.',
    busy: 'Menambah mobil yang datang: siapkan petugas gerbang',
    seen: 'dilihat',
  },
  en: {
    title: 'Offers and events in this building',
    sub: (n: number) => `${n} running on the chosen day. Merchants manage them from the Merchant tab.`,
    none: 'No offers or events on this day.',
    busy: 'Brings more cars: staff the gates',
    seen: 'seen',
  },
}
