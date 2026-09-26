import { ArrowLeft, Buildings, Car, Info, LockKey, ShieldCheck, TrendDown, UsersThree } from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Columns, HBars, Heatmap, OccupancyLine, PairedBars } from '../components/charts/Charts'
import { SERIES } from '../components/charts/series'
import { Segmented } from '../components/ui/Controls'
import { CountUp } from '../components/ui/Display'
import { Wordmark } from '../components/ui/Logo'
import type { VenueId } from '../data/types'
import { VENUE_BY_ID, VENUES } from '../data/venues'
import { AVG_STAY_H, BUSY_LINE, FULL_LINE, STEERED, diversions, gateBalance, hourlyFlow, zoneDay, weekHeat } from '../engine/mitra'
import { formatRupiah } from '../engine/pricing'
import { useLang } from '../i18n'
import { useResolvedTheme } from '../lib/theme'
import { atWib, dayName, nextSaturdayAt, wib } from '../lib/time'
import { useNow } from '../store/clock'

const COPY = {
  id: {
    title: 'Dashboard mitra',
    sub: 'Yang pengelola lihat kalau berlangganan. Sekarang mall cuma tahu berapa mobil yang masuk. Mereka nggak tahu berapa yang batal datang, larinya ke mana, dan jam berapa itu terjadi.',
    sim: 'Data simulasi · agregat dan anonim',
    back: 'Kembali ke app',
    day: { today: 'Hari ini', sat: 'Sabtu', tue: 'Selasa' },
    kpiIn: 'Mobil masuk',
    kpiPeak: 'Puncak okupansi',
    kpiLost: 'Batal datang karena penuh',
    kpiZone: 'Booking Zona KENNETH',
    at: 'jam',
    occ: 'Okupansi per jam',
    occSub: 'Garis tipis = batas ramai dan penuh',
    lost: 'Calon pengunjung yang batal datang',
    lostSub: 'Per jam, perkiraan dari laju masuk saat parkiran di atas 88%',
    where: 'Ke mana mereka pergi',
    whereSub: 'Perkiraan tujuan mereka kalau semuanya pakai KENNETH. Properti satu grup diutamakan.',
    gates: 'Pemerataan gerbang saat puncak',
    gatesSub: (pct: number) => `Porsi mobil per gerbang, kalau ${pct}% pengemudi ikut saran gerbang dari KENNETH`,
    without: 'Tanpa KENNETH',
    with: 'Dengan KENNETH',
    week: 'Pola seminggu',
    weekSub: 'Okupansi rata-rata per jam, Senin sampai Minggu',
    products: 'Paket untuk pengelola',
    fit: 'Cocok untuk lokasi ini',
    p1: 'Pengalihan trafik',
    p1p: 'Rp10-15jt / bulan',
    p1d: 'Muncul sebagai rekomendasi saat lokasi lain penuh. Pengunjungnya sudah di jalan dan sudah niat belanja.',
    p2: 'Zona KENNETH',
    p2p: 'Bagi hasil booking',
    p2d: 'Sebagian petak dekat lobi disewakan ke KENNETH, kayak zona parkir khusus merek mobil. Gedung dapat bagi hasil tiap booking, plus valet runner yang parkir di zona yang sama.',
    p3: 'Dashboard data',
    p3p: 'Rp5-10jt / bulan',
    p3d: 'Halaman ini: yang batal datang, larinya ke mana, jam berapa, dan beban tiap gerbang.',
    privacy: 'Semua angka di halaman ini agregat per jam. Tidak ada data per orang yang dibagikan ke pengelola.',
    assume: (h: number) =>
      `Asumsi model: rata-rata parkir ${h} jam, pengunjung mulai batal di atas 88% dan sampai 22% di 100%. Harga paket masih perkiraan, belum divalidasi ke pengelola mana pun.`,
    gross: 'nilai kotor',
    noZone: 'Kampus tidak punya Zona KENNETH',
    table: 'Lihat sebagai tabel',
    hour: 'Jam',
  },
  en: {
    title: 'Partner dashboard',
    sub: 'What a building manager sees on a subscription. Today a mall only knows how many cars came in. Not how many gave up, where they went, or at what hour.',
    sim: 'Simulated data · aggregated and anonymous',
    back: 'Back to the app',
    day: { today: 'Today', sat: 'Saturday', tue: 'Tuesday' },
    kpiIn: 'Cars in',
    kpiPeak: 'Peak occupancy',
    kpiLost: 'Gave up because full',
    kpiZone: 'KENNETH Zone bookings',
    at: 'at',
    occ: 'Occupancy by hour',
    occSub: 'Thin lines mark the busy and full thresholds',
    lost: 'Visitors who gave up',
    lostSub: 'Per hour, estimated from arrivals while the lot is above 88%',
    where: 'Where they went',
    whereSub: 'Where they would go if they all used KENNETH. Same group properties first.',
    gates: 'Gate balance at peak',
    gatesSub: (pct: number) => `Share of cars per gate, if ${pct}% of drivers follow the KENNETH gate tip`,
    without: 'Without KENNETH',
    with: 'With KENNETH',
    week: 'Week pattern',
    weekSub: 'Average occupancy by hour, Monday to Sunday',
    products: 'Plans for managers',
    fit: 'Fits this venue',
    p1: 'Traffic redirection',
    p1p: 'Rp10-15m / month',
    p1d: 'Shows up as the recommendation when nearby venues are full. These visitors are already on the road with intent to shop.',
    p2: 'KENNETH Zone',
    p2p: 'Booking revenue share',
    p2d: 'Some bays by the lobby are leased to KENNETH, like brand-only parking zones. The building gets a share of every booking, plus runner valet parking in the same zone.',
    p3: 'Data dashboard',
    p3p: 'Rp5-10m / month',
    p3d: 'This page: who gave up, where they went, at what hour, and the load on each gate.',
    privacy: 'Every number on this page is aggregated per hour. No per-person data is shared with managers.',
    assume: (h: number) =>
      `Model assumptions: average stay ${h} hours, visitors start giving up above 88% and up to 22% at 100%. Plan prices are estimates, not validated with any manager yet.`,
    gross: 'gross value',
    noZone: 'Campuses have no KENNETH Zone',
    table: 'View as table',
    hour: 'Hour',
  },
}

type DayKey = 'today' | 'sat' | 'tue'

export default function Mitra() {
  const lang = useLang()
  const c = COPY[lang]
  const theme = useResolvedTheme()
  const now = useNow(30_000)
  const [venueId, setVenueId] = useState<VenueId>('central-park')
  const [dayKey, setDayKey] = useState<DayKey>('today')
  const venue = VENUE_BY_ID[venueId]
  const colors = SERIES[theme]

  const dayTs = useMemo(() => {
    if (dayKey === 'sat') return nextSaturdayAt(now, 12, 0)
    if (dayKey === 'tue') {
      const ahead = (2 - wib(now).day + 7) % 7
      return atWib(now + ahead * 86_400_000, 12, 0)
    }
    return now
  }, [dayKey, now])

  const flow = useMemo(() => hourlyFlow(venue, dayTs), [venue, dayTs])
  const totalIn = flow.reduce((a, r) => a + r.entries, 0)
  const totalLost = flow.reduce((a, r) => a + r.lost, 0)
  const peak = flow.reduce((a, b) => (b.occ > a.occ ? b : a))
  const div = useMemo(() => diversions(venue, dayTs, totalLost), [venue, dayTs, totalLost])
  const gates = useMemo(() => gateBalance(venue, dayTs), [venue, dayTs])
  const heat = useMemo(() => weekHeat(venue, now), [venue, now])
  const prio = useMemo(() => zoneDay(venue, dayTs), [venue, dayTs])
  const busyVenue = peak.occ >= FULL_LINE
  // Campuses sell nothing (docs/PRODUCT.md), so only the dashboard plan fits them.
  const isMall = venue.category === 'mall'
  const nowHour = dayKey === 'today' ? wib(now).hourF : undefined

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3 px-5 py-3">
          <Link to="/" className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink" aria-label={c.back}>
            <ArrowLeft size={16} weight="bold" />
          </Link>
          <Wordmark />
          <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-canvas">{c.title}</span>
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-ramai-soft px-2.5 py-1 text-[11px] font-bold text-ramai-ink dark:bg-ramai/15 dark:text-led-ramai">
            <Info size={12} weight="fill" /> {c.sim}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-[38px] leading-tight font-extrabold tracking-tight">{venue.name}</h1>
          <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-ink-2">{c.sub}</p>
        </motion.div>

        {/* Filters: one row, above everything they scope. */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface pr-2 pl-3.5">
            <Buildings size={16} className="text-ink-3" />
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value as VenueId)}
              className="h-full bg-transparent pr-1 text-[13.5px] font-semibold outline-none"
            >
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <Segmented
            className="w-[300px]"
            value={dayKey}
            onChange={setDayKey}
            options={[
              { value: 'today', label: c.day.today },
              { value: 'sat', label: c.day.sat },
              { value: 'tue', label: c.day.tue },
            ]}
          />
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={<Car size={18} weight="fill" />} label={c.kpiIn} value={totalIn} />
          <Kpi
            icon={<UsersThree size={18} weight="fill" />}
            label={c.kpiPeak}
            value={Math.round(peak.occ * 100)}
            unit="%"
            note={`${c.at} ${String(peak.hour).padStart(2, '0')}.00`}
          />
          <Kpi icon={<TrendDown size={18} weight="fill" />} label={c.kpiLost} value={totalLost} tone={totalLost > 0 ? 'bad' : undefined} />
          <Kpi
            icon={<ShieldCheck size={18} weight="fill" />}
            label={c.kpiZone}
            value={isMall ? prio.tickets : null}
            note={!isMall ? c.noZone : prio.gross ? `${formatRupiah(prio.gross, true)} ${c.gross}` : undefined}
          />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card title={c.occ} sub={c.occSub}>
            <OccupancyLine
              data={flow}
              color={colors.mono}
              nowHour={nowHour}
              thresholds={[
                { value: BUSY_LINE, label: `${lang === 'id' ? 'Ramai' : 'Busy'} 70%` },
                { value: FULL_LINE, label: `${lang === 'id' ? 'Penuh' : 'Full'} 90%` },
              ]}
            />
            <TableView head={[c.hour, '%']} rows={flow.map((r) => [`${r.hour}.00`, `${Math.round(r.occ * 100)}%`])} label={c.table} />
          </Card>
          <Card title={c.lost} sub={c.lostSub}>
            <Columns
              data={flow.map((r) => ({ key: `${r.hour}`, value: r.lost }))}
              color={colors.a}
              format={(v) => v.toLocaleString('id-ID')}
              label={c.lost}
            />
            <TableView head={[c.hour, c.kpiLost]} rows={flow.map((r) => [`${r.hour}.00`, String(r.lost)])} label={c.table} />
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card title={c.where} sub={c.whereSub}>
            {div.length ? (
              <HBars
                data={div.map((d) => ({ label: VENUE_BY_ID[d.to].name, value: d.count }))}
                color={colors.b}
                format={(v) => v.toLocaleString('id-ID')}
              />
            ) : (
              <p className="py-6 text-center text-[13px] text-ink-3">-</p>
            )}
          </Card>
          <Card title={c.gates} sub={c.gatesSub(Math.round(STEERED * 100))}>
            <PairedBars
              data={gates.map((g) => ({ label: g.name, a: g.without, b: g.with }))}
              colors={colors}
              names={{ a: c.without, b: c.with }}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Card>
          <Card title={c.products} sub="">
            <div className="space-y-2">
              <Product name={c.p1} price={c.p1p} desc={c.p1d} fit={isMall && !busyVenue} fitLabel={c.fit} />
              <Product name={c.p2} price={c.p2p} desc={c.p2d} fit={isMall && busyVenue} fitLabel={c.fit} />
              <Product name={c.p3} price={c.p3p} desc={c.p3d} fit fitLabel={c.fit} />
            </div>
          </Card>
        </section>

        <section className="mt-4">
          <Card title={c.week} sub={c.weekSub}>
            <Heatmap
              dark={theme === 'dark'}
              format={(v) => `${Math.round(v * 100)}%`}
              rows={heat.map((d) => ({ label: dayName(d.ts, lang), cells: d.hours.map((h) => ({ hour: h.hour, value: h.occ })) }))}
            />
          </Card>
        </section>

        <footer className="mt-6 space-y-2 text-[12.5px] leading-relaxed text-ink-3">
          <p className="flex gap-2">
            <LockKey size={15} weight="fill" className="mt-[2px] shrink-0 text-brand-600" /> {c.privacy}
          </p>
          <p className="flex gap-2">
            <Info size={15} weight="fill" className="mt-[2px] shrink-0" /> {c.assume(AVG_STAY_H)}
          </p>
        </footer>
      </main>
    </div>
  )
}

function Kpi({ icon, label, value, unit, note, tone }: { icon: ReactNode; label: string; value: number | null; unit?: string; note?: string; tone?: 'bad' }) {
  return (
    <div className="rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-3">
        <span className={clsx('grid size-7 place-items-center rounded-full', tone === 'bad' ? 'bg-penuh-soft text-penuh-ink dark:bg-penuh/15 dark:text-led-penuh' : 'bg-surface-2 text-ink-2')}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-[34px] leading-none font-extrabold tracking-tight">
        {value === null ? '-' : <CountUp value={value} grouped />}
        {unit && value !== null && <span className="text-[18px]">{unit}</span>}
      </div>
      {note && <div className="mt-1.5 text-[12px] text-ink-3">{note}</div>}
    </div>
  )
}

function Card({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[24px] border border-line bg-surface p-5">
      <h2 className="text-[15px] font-extrabold">{title}</h2>
      {sub && <p className="mt-0.5 mb-4 text-[12px] text-ink-3">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </div>
  )
}

function Product({ name, price, desc, fit, fitLabel }: { name: string; price: string; desc: string; fit: boolean; fitLabel: string }) {
  return (
    <div className={clsx('rounded-[16px] border p-3', fit ? 'border-brand-500/40 bg-brand-50/60 dark:bg-brand-400/[0.07]' : 'border-line')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-bold">{name}</span>
        <span className="text-[12px] font-bold text-ink-2 tabular">{price}</span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-ink-3">{desc}</p>
      {fit && <span className="mt-2 inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[10.5px] font-bold text-white">{fitLabel}</span>}
    </div>
  )
}

function TableView({ head, rows, label }: { head: string[]; rows: string[][]; label: string }) {
  return (
    <details className="mt-3 text-[12px]">
      <summary className="cursor-pointer font-semibold text-ink-3 hover:text-ink-2">{label}</summary>
      <table className="mt-2 w-full text-left tabular">
        <thead>
          <tr className="text-ink-3">
            {head.map((h) => (
              <th key={h} className="py-1 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-t border-line">
              {r.map((cell, i) => (
                <td key={i} className="py-1">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
