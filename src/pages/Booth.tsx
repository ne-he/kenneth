import { ArrowLeft, Check, DownloadSimple, Heart, Lightbulb, QrCode, Question, SignOut, Sparkle, Trash, UsersThree } from '@phosphor-icons/react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '../components/ui/Button'
import { LogoMark, Wordmark } from '../components/ui/Logo'
import { useLang } from '../i18n'
import { haptic } from '../lib/haptics'
import { shareAnswer, sharedAvailable, watchSession } from '../lib/shared'
import { answerId, combine, download, isSession, newSession, toCsv, useBooth, type BoothResponse } from '../store/booth'

/*
  Validation tool for the BINUS Festival booth. The questions follow the
  course material: ask about what already happened (customer discovery),
  test the one risk that decides the product (accuracy tolerance), then the
  Feedback Capture Grid from the prototype iteration session.
*/

const FEATURES = [
  ['okupansi', 'Okupansi real-time', 'Live occupancy'],
  ['alternatif', 'Alternatif kalau penuh', 'Alternatives when full'],
  ['gerbang', 'Gerbang paling lancar', 'Fastest gate'],
  ['ingetin', 'Ingetin saat lega', 'Remind me when clear'],
  ['biaya', 'Estimasi biaya', 'Cost estimate'],
  ['mobil', 'Inget lokasi mobil', 'Remember my car'],
  ['difabel', 'Slot difabel dan ibu hamil', 'Accessible bays'],
  ['prioritas', 'Zona KENNETH', 'KENNETH Zone'],
  ['ev', 'Booking charger EV', 'EV charger booking'],
] as const

const COPY = {
  id: {
    title: 'Mode booth',
    sub: 'BINUS Festival. Satu pengunjung, satu isian. Jawaban disimpan di perangkat ini dan bisa diunduh buat laporan validasi.',
    back: 'Kembali ke app',
    q1: 'Kapan terakhir kamu muter nyari parkir di mall?',
    q1o: { minggu: 'Minggu ini', bulan: 'Bulan ini', lama: 'Lebih lama', tidak: 'Nggak pernah bawa mobil' },
    q2: 'Waktu itu kira-kira berapa lama?',
    q3: 'Kalau app ini kadang meleset 10 sampai 15 persen, kamu masih mau pakai?',
    q3o: { ya: 'Masih', mungkin: 'Mungkin', tidak: 'Nggak' },
    q4: 'Dua fitur yang paling kamu butuhin',
    q5: 'Mau bayar Rp15-30rb buat petak pasti di dekat lobi, tanpa muter?',
    q5o: { ya: 'Mau', tergantung: 'Tergantung', tidak: 'Nggak' },
    grid: 'Feedback grid',
    like: 'Yang disuka',
    wish: 'Yang diharapkan',
    question: 'Yang masih bikin bingung',
    idea: 'Ide',
    contact: 'Kontak buat follow up (opsional, dengan izin)',
    contactPh: 'IG atau email',
    submit: 'Kirim jawaban',
    thanks: 'Makasih! Siap buat pengunjung berikutnya.',
    summary: 'Ringkasan langsung',
    total: 'responden',
    csv: 'Unduh CSV',
    json: 'Unduh JSON',
    clear: 'Hapus semua',
    clearConfirm: 'Yakin hapus semua jawaban?',
    none: 'Belum ada jawaban.',
    min: 'mnt',
    subShared:
      'BINUS Festival. Satu pengunjung, satu isian. Jawaban dari semua HP di sesi ini terkumpul jadi satu dan bisa diunduh buat laporan validasi.',
    sessionTitle: 'Gabungkan HP booth',
    sessionOff: 'Jawaban dari beberapa HP masuk ke satu ringkasan dan satu unduhan. Kontak tetap di HP tempat diisi.',
    sessionStart: 'Mulai sesi bersama',
    sessionOn: 'Sesi bersama',
    sessionOnSub: 'Ringkasan dan unduhan di sini berisi jawaban semua HP di sesi ini. Kontak cuma ada di HP tempat diisi.',
    sessionConnecting: 'Menyambung',
    sessionSynced: 'Semua terkirim',
    sessionPending: (n: number) => `${n} belum terkirim`,
    sessionError: 'Tidak tersambung',
    sessionShow: 'Kode gabung',
    sessionHide: 'Tutup kode',
    sessionScan: 'Pindai dari HP tim yang lain. Kode ini membuka semua jawaban sesi, jangan tunjukkan ke pengunjung.',
    sessionCopy: 'Salin tautan',
    sessionCopied: 'Tautan tersalin',
    sessionLeave: 'Keluar sesi',
    sessionLeaveConfirm: 'Yakin keluar?',
    sessionJoined: 'HP ini sudah masuk sesi booth. Jawabannya ikut terkumpul.',
  },
  en: {
    title: 'Booth mode',
    sub: 'BINUS Festival. One visitor, one entry. Answers stay on this device and can be downloaded for the validation report.',
    back: 'Back to the app',
    q1: 'When did you last circle a mall car park looking for a spot?',
    q1o: { minggu: 'This week', bulan: 'This month', lama: 'Longer ago', tidak: 'I never drive' },
    q2: 'Roughly how long did it take?',
    q3: 'If the app were sometimes off by 10 to 15 percent, would you still use it?',
    q3o: { ya: 'Yes', mungkin: 'Maybe', tidak: 'No' },
    q4: 'The two features you need most',
    q5: 'Would you pay Rp15-30k for a sure bay by the lobby, no circling?',
    q5o: { ya: 'Yes', tergantung: 'Depends', tidak: 'No' },
    grid: 'Feedback grid',
    like: 'What I like',
    wish: 'What I wish for',
    question: 'What is still unclear',
    idea: 'Ideas',
    contact: 'Contact for follow up (optional, with consent)',
    contactPh: 'Instagram or email',
    submit: 'Submit answers',
    thanks: 'Thank you! Ready for the next visitor.',
    summary: 'Live summary',
    total: 'responses',
    csv: 'Download CSV',
    json: 'Download JSON',
    clear: 'Delete all',
    clearConfirm: 'Delete every answer?',
    none: 'No answers yet.',
    min: 'min',
    subShared:
      'BINUS Festival. One visitor, one entry. Answers from every phone in this session come together and can be downloaded for the validation report.',
    sessionTitle: 'Combine booth phones',
    sessionOff: 'Answers from several phones go into one summary and one download. Contacts stay on the phone they were typed on.',
    sessionStart: 'Start a shared session',
    sessionOn: 'Shared session',
    sessionOnSub: 'The summary and downloads here hold every phone in this session. Contacts only exist on the phone they were typed on.',
    sessionConnecting: 'Connecting',
    sessionSynced: 'All sent',
    sessionPending: (n: number) => `${n} not sent yet`,
    sessionError: 'Not connected',
    sessionShow: 'Join code',
    sessionHide: 'Hide code',
    sessionScan: 'Scan from another team phone. This code opens every answer in the session, so do not show it to visitors.',
    sessionCopy: 'Copy link',
    sessionCopied: 'Link copied',
    sessionLeave: 'Leave session',
    sessionLeaveConfirm: 'Leave for sure?',
    sessionJoined: 'This phone joined the booth session. Its answers count too.',
  },
}

const EMPTY = {
  lastTime: '' as BoothResponse['lastTime'] | '',
  lostMin: '' as BoothResponse['lostMin'],
  tolerance: '' as BoothResponse['tolerance'] | '',
  features: [] as string[],
  payPriority: '' as BoothResponse['payPriority'] | '',
  like: '',
  wish: '',
  question: '',
  idea: '',
  contact: '',
}

export default function Booth() {
  const lang = useLang()
  const c = COPY[lang]
  const navigate = useNavigate()
  const own = useBooth((s) => s.responses)
  const pool = useBooth((s) => s.pool)
  const session = useBooth((s) => s.session)
  const add = useBooth((s) => s.add)
  const clear = useBooth((s) => s.clear)
  const join = useBooth((s) => s.join)
  // In a session the tally and the downloads hold every phone's answers; this phone's keep their contacts.
  const responses = useMemo(() => (session ? combine(own, pool) : own), [session, own, pool])
  const [f, setF] = useState(EMPTY)
  const [thanks, setThanks] = useState(false)
  const [confirm, setConfirm] = useState(false)
  // A teammate's join link: read on arrival, and again if one opens in this tab while the booth is up.
  const [link, setLink] = useState(() => {
    const key = linkedSession()
    return key ? { key } : null
  })
  const [joined, setJoined] = useState(link !== null)

  useEffect(() => {
    const onHash = () => {
      const key = linkedSession()
      if (!key) return
      setLink({ key })
      setJoined(true)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!link) return
    // The key opens every answer in the session, so it leaves the address bar right away.
    navigate('/booth', { replace: true })
    if (useBooth.getState().session !== link.key) join(link.key)
  }, [link, join, navigate])

  useEffect(() => {
    if (!joined) return
    const id = window.setTimeout(() => setJoined(false), 4000)
    return () => window.clearTimeout(id)
  }, [joined])

  const ready = f.lastTime && f.tolerance && f.payPriority
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((s) => ({ ...s, [k]: v }))

  const submit = () => {
    if (!ready) return
    haptic('success')
    // Question 2 hides when the visitor never drives, so drop an answer picked before switching.
    add({ ...f, lostMin: f.lastTime === 'tidak' ? '' : f.lostMin, id: answerId(), at: Date.now() } as BoothResponse)
    setF(EMPTY)
    setThanks(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => setThanks(false), 2600)
  }

  const count = (key: keyof BoothResponse, value: string) =>
    responses.filter((r) => (Array.isArray(r[key]) ? (r[key] as string[]).includes(value) : r[key] === value)).length

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-5 py-3">
          <Link to="/" className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink" aria-label={c.back}>
            <ArrowLeft size={16} weight="bold" />
          </Link>
          {/* The name needs room the two pills take on a narrow phone; the mark alone says KENNETH there. */}
          <span className="hidden min-[420px]:block">
            <Wordmark />
          </span>
          <span className="shrink-0 min-[420px]:hidden">
            <LogoMark size={26} />
          </span>
          <span className="whitespace-nowrap rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-200">{c.title}</span>
          <span className="ml-auto whitespace-nowrap rounded-full bg-surface-2 px-3 py-1 text-[12px] font-bold tabular">
            {responses.length} {c.total}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1180px] gap-6 px-5 pt-6 pb-16 lg:grid-cols-[1.35fr_1fr]">
        <section>
          <p className="mb-5 max-w-[620px] text-[14.5px] leading-relaxed text-ink-2">{session ? c.subShared : c.sub}</p>
          <AnimatePresence>
            {joined && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-[18px] bg-ink p-4 text-[15px] font-semibold text-canvas">
                  <UsersThree size={20} weight="fill" /> {c.sessionJoined}
                </div>
              </motion.div>
            )}
            {thanks && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-[18px] bg-ink p-4 text-[15px] font-semibold text-canvas">
                  <Check size={20} weight="bold" /> {c.thanks}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Q n={1} title={c.q1}>
            <Choices value={f.lastTime} onChange={(v) => set('lastTime', v)} options={c.q1o} />
          </Q>
          {f.lastTime && f.lastTime !== 'tidak' && (
            <Q n={2} title={c.q2}>
              <Choices
                value={f.lostMin}
                onChange={(v) => set('lostMin', v)}
                options={{ '<5': `< 5 ${c.min}`, '5-15': `5-15 ${c.min}`, '15-30': `15-30 ${c.min}`, '>30': `> 30 ${c.min}` }}
              />
            </Q>
          )}
          <Q n={3} title={c.q3}>
            <Choices value={f.tolerance} onChange={(v) => set('tolerance', v)} options={c.q3o} />
          </Q>
          <Q n={4} title={c.q4}>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(([key, idLabel, enLabel]) => {
                const on = f.features.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set('features', on ? f.features.filter((x) => x !== key) : [...f.features, key].slice(-2))
                    }
                    className={clsx(
                      'h-11 rounded-full border px-4 text-[14px] font-semibold transition-colors',
                      on ? 'border-transparent btn-primary text-white' : 'border-line bg-surface hover:bg-surface-2',
                    )}
                  >
                    {lang === 'id' ? idLabel : enLabel}
                  </button>
                )
              })}
            </div>
          </Q>
          <Q n={5} title={c.q5}>
            <Choices value={f.payPriority} onChange={(v) => set('payPriority', v)} options={c.q5o} />
          </Q>

          <Q n={6} title={c.grid}>
            <div className="grid gap-2 sm:grid-cols-2">
              <GridBox icon={<Heart size={16} weight="fill" />} label={c.like} value={f.like} onChange={(v) => set('like', v)} />
              <GridBox icon={<Sparkle size={16} weight="fill" />} label={c.wish} value={f.wish} onChange={(v) => set('wish', v)} />
              <GridBox icon={<Question size={16} weight="fill" />} label={c.question} value={f.question} onChange={(v) => set('question', v)} />
              <GridBox icon={<Lightbulb size={16} weight="fill" />} label={c.idea} value={f.idea} onChange={(v) => set('idea', v)} />
            </div>
          </Q>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">{c.contact}</span>
            <input
              value={f.contact}
              onChange={(e) => set('contact', e.target.value)}
              placeholder={c.contactPh}
              maxLength={200}
              className="h-12 w-full rounded-2xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-brand-500"
            />
          </label>

          <Button variant="primary" size="lg" block disabled={!ready} onClick={submit}>
            <Check size={18} weight="bold" /> {c.submit}
          </Button>
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-[24px] border border-line bg-surface p-5">
            <h2 className="text-[15px] font-semibold">{c.summary}</h2>
            <p className="mt-0.5 text-[12px] text-ink-3 tabular">
              {responses.length} {c.total}
            </p>
            {responses.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-ink-3">{c.none}</p>
            ) : (
              <div className="mt-4 space-y-5">
                <Tally title={c.q3} total={responses.length} rows={Object.entries(c.q3o).map(([k, l]) => [l, count('tolerance', k)])} />
                <Tally title={c.q5} total={responses.length} rows={Object.entries(c.q5o).map(([k, l]) => [l, count('payPriority', k)])} />
                <Tally
                  title={c.q4}
                  total={responses.length}
                  rows={FEATURES.map(([k, idl, enl]) => [lang === 'id' ? idl : enl, count('features', k)] as [string, number])
                    .filter(([, n]) => n > 0)
                    .sort((a, b) => b[1] - a[1])}
                />
                <Tally title={c.q1} total={responses.length} rows={Object.entries(c.q1o).map(([k, l]) => [l, count('lastTime', k)])} />
              </div>
            )}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                disabled={!responses.length}
                onClick={() => download(`kenneth-booth-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(responses), 'text/csv')}
              >
                <DownloadSimple size={16} weight="bold" /> {c.csv}
              </Button>
              <Button
                variant="ghost"
                disabled={!responses.length}
                onClick={() =>
                  download(`kenneth-booth-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(responses, null, 2), 'application/json')
                }
              >
                <DownloadSimple size={16} weight="bold" /> {c.json}
              </Button>
            </div>
            {responses.length > 0 && !session && (
              <Button
                variant="danger"
                block
                className="mt-2"
                onClick={() => {
                  if (!confirm) {
                    // Arm for a few seconds only, so a stray tap hours later cannot wipe the day's answers.
                    setConfirm(true)
                    window.setTimeout(() => setConfirm(false), 4000)
                    return
                  }
                  clear()
                  setConfirm(false)
                }}
              >
                <Trash size={16} weight="bold" /> {confirm ? c.clearConfirm : c.clear}
              </Button>
            )}
          </div>
          {sharedAvailable && <Session c={c} />}
        </aside>
      </main>
    </div>
  )
}

function Q({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="mb-6">
      <legend className="mb-3 flex gap-2.5 text-[17px] leading-snug font-bold">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-[13px] text-canvas">{n}</span>
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Choices<T extends string>({ value, onChange, options }: { value: T | ''; onChange: (v: T) => void; options: Record<T, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(options) as [T, string][]).map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          onClick={() => {
            haptic('tap')
            onChange(k)
          }}
          className={clsx(
            'h-12 min-w-24 rounded-2xl border px-5 text-[15px] font-semibold transition-colors',
            value === k ? 'border-transparent btn-primary text-white' : 'border-line bg-surface hover:bg-surface-2',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function GridBox({ icon, label, value, onChange }: { icon: ReactNode; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block rounded-[18px] border border-line bg-surface p-3 focus-within:border-brand-500">
      <span className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-2">
        {icon} {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={1000}
        className="mt-1.5 w-full resize-none bg-transparent text-[14.5px] outline-none"
      />
    </label>
  )
}

function Tally({ title, total, rows }: { title: string; total: number; rows: [string, number][] }) {
  return (
    <div>
      <div className="mb-2 text-[12.5px] leading-snug font-semibold text-ink-2">{title}</div>
      <ul className="space-y-1.5">
        {rows.map(([label, n]) => (
          <li key={label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 text-[12.5px]">
            <span className="truncate">{label}</span>
            <span className="font-bold tabular">
              {n} <span className="font-medium text-ink-3">({Math.round((n / total) * 100)}%)</span>
            </span>
            <span className="col-span-2 mt-0.5 h-2 rounded-r-[4px] bg-surface-2">
              <span className="block h-full rounded-r-[4px] bg-brand-600" style={{ width: `${(n / total) * 100}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The session key in a teammate's join link, /booth#sesi=<key>, when the address is one. */
function linkedSession(): string | null {
  if (!sharedAvailable) return null
  const key = new URLSearchParams(window.location.hash.slice(1)).get('sesi')
  return key && isSession(key) ? key : null
}

/** Answers on their way to the session, so a re-render does not send one twice. */
const inFlight = new Set<string>()

/**
 * Keeps a joined session in step: everyone's answers come in live, and this
 * phone's unsent answers go out, again after a dropped connection.
 */
function useSessionSync(session: string | null): 'connecting' | 'live' | 'error' {
  const pending = useBooth((s) => s.pending)
  const setPool = useBooth((s) => s.setPool)
  const sent = useBooth((s) => s.sent)
  const [state, setState] = useState<{ session: string; status: 'live' | 'error' } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!session) return
    let retry = 0
    const stop = watchSession(
      session,
      (answers) => {
        setPool(answers)
        setState({ session, status: 'live' })
      },
      () => {
        setState({ session, status: 'error' })
        retry = window.setTimeout(() => setAttempt((n) => n + 1), 15_000)
      },
    )
    return () => {
      stop()
      window.clearTimeout(retry)
    }
  }, [session, setPool, attempt])

  useEffect(() => {
    if (!session) return
    const { responses } = useBooth.getState()
    for (const id of pending) {
      const answer = responses.find((r) => r.id === id)
      if (!answer) {
        sent(id)
        continue
      }
      if (inFlight.has(id)) continue
      inFlight.add(id)
      shareAnswer(session, answer)
        .then(() => {
          if (useBooth.getState().session === session) sent(id)
        })
        .catch((e: { code?: string }) => {
          // An answer the rules refuse would be refused forever. It stays on this phone and in its downloads.
          if (e?.code === 'permission-denied' || e?.code === 'invalid-argument') sent(id)
          else window.setTimeout(() => setAttempt((n) => n + 1), 15_000)
        })
        .finally(() => inFlight.delete(id))
    }
  }, [session, pending, sent, attempt])

  return state?.session === session ? state.status : 'connecting'
}

/** Start a booth session, show its join code to teammates, or leave it. */
function Session({ c }: { c: (typeof COPY)[keyof typeof COPY] }) {
  const session = useBooth((s) => s.session)
  const pending = useBooth((s) => s.pending.length)
  const join = useBooth((s) => s.join)
  const leave = useBooth((s) => s.leave)
  const status = useSessionSync(session)
  const [showCode, setShowCode] = useState(false)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [armed, setArmed] = useState(false)
  const link = session ? `${window.location.origin}/booth#sesi=${session}` : ''

  useEffect(() => {
    if (!showCode || !link) return
    QRCode.toDataURL(link, { margin: 1, width: 400, errorCorrectionLevel: 'M', color: { dark: '#121216', light: '#ffffff' } }).then(setQr)
  }, [showCode, link])

  if (!session) {
    return (
      <div className="mt-4 rounded-[24px] border border-line bg-surface p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <UsersThree size={18} weight="fill" className="text-brand-600 dark:text-brand-400" /> {c.sessionTitle}
        </h2>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{c.sessionOff}</p>
        <Button variant="ghost" block className="mt-4" onClick={() => join(newSession())}>
          {c.sessionStart}
        </Button>
      </div>
    )
  }

  const word = status === 'error' ? c.sessionError : pending > 0 ? c.sessionPending(pending) : status === 'live' ? c.sessionSynced : c.sessionConnecting
  const tone =
    status === 'error'
      ? 'bg-penuh-soft text-penuh-ink dark:bg-penuh/15 dark:text-led-penuh'
      : pending > 0 || status !== 'live'
        ? 'bg-surface-2 text-ink-2'
        : 'bg-lega-soft text-lega-ink dark:bg-lega/15 dark:text-led-lega'

  return (
    <div className="mt-4 rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <UsersThree size={18} weight="fill" className="text-brand-600 dark:text-brand-400" /> {c.sessionOn}
        </h2>
        <span className={clsx('rounded-full px-2.5 py-1 text-[11.5px] font-semibold tabular', tone)}>{word}</span>
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{c.sessionOnSub}</p>
      {showCode && (
        <div className="mt-4">
          <div className="mx-auto w-full max-w-[220px] rounded-[20px] border border-line bg-white p-3 dark:border-transparent">
            {qr ? <img src={qr} alt="" className="aspect-square w-full" /> : <div className="aspect-square w-full" />}
          </div>
          <p className="mx-auto mt-3 max-w-[300px] text-center text-[12px] leading-snug text-ink-3">{c.sessionScan}</p>
          <Button
            variant="ghost"
            block
            className="mt-3"
            onClick={() => {
              navigator.clipboard?.writeText(link).then(() => {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 2000)
              })
            }}
          >
            {copied ? c.sessionCopied : c.sessionCopy}
          </Button>
        </div>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="ghost" onClick={() => setShowCode((v) => !v)}>
          <QrCode size={16} weight="bold" /> {showCode ? c.sessionHide : c.sessionShow}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (!armed) {
              // Same two-tap guard as deleting: a stray tap must not drop this phone out of the session.
              setArmed(true)
              window.setTimeout(() => setArmed(false), 4000)
              return
            }
            setArmed(false)
            setShowCode(false)
            leave()
          }}
        >
          <SignOut size={16} weight="bold" /> {armed ? c.sessionLeaveConfirm : c.sessionLeave}
        </Button>
      </div>
    </div>
  )
}
