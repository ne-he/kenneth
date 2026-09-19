import {
  Buildings,
  CarProfile,
  CaretRight,
  Check,
  CircleHalf,
  Clock,
  Crown,
  GithubLogo,
  GoogleLogo,
  Leaf,
  Lightning,
  LockKey,
  MapTrifold,
  Motorcycle,
  NavigationArrow,
  Plus,
  PresentationChart,
  ShieldCheck,
  SignOut,
  Translate,
  UserFocus,
  Vibrate,
  Wheelchair,
} from '@phosphor-icons/react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { plateParity } from '../../engine/gage'
import { impactOf, sumImpact } from '../../engine/impact'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { REPO_URL } from '../../lib/links'
import { NAV_APP_NAME } from '../../lib/navApps'
import { clock, dayName } from '../../lib/time'
import { useApp, useVehicle, type NavApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Segmented, Toggle } from '../ui/Controls'
import { Plate } from '../ui/Display'
import { Label, List } from '../ui/Kit'
import { LogoMark } from '../ui/Logo'
import { useSignIn } from './useSignIn'

/**
 * Settings, the Linear way: one column of grouped rows, grey labels, no
 * cards shouting for attention. The things for the team and the demo sit at
 * the very bottom, out of a normal user's way.
 */
export function Account() {
  const t = useT()
  const navigate = useNavigate()
  const now = useNow()
  const lang = useApp((s) => s.lang)
  const theme = useApp((s) => s.theme)
  const plan = useApp((s) => s.plan)
  const prefs = useApp((s) => s.prefs)
  const mapPrefs = useApp((s) => s.mapPrefs)
  const history = useApp((s) => s.history)
  const clockMode = useApp((s) => s.clock.mode)
  const isEV = useVehicle().isEV
  const { setPref, setLang, setTheme, setMapPref } = useApp.getState()
  const open = useUi((s) => s.open)

  const month = history.filter((v) => now - v.at < 31 * 86_400_000)
  const impact = sumImpact(month.map((v) => impactOf(v.minutesSaved, isEV)))

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-safe pb-[calc(var(--nav-h)+24px)]">
      <h1 className="pt-3 pb-5 text-[28px] leading-tight font-bold tracking-tight">{t.profile.title}</h1>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Identity />
      </motion.div>

      <Group>
        <Row
          icon={<Crown size={17} weight="fill" />}
          title={plan === 'premium' ? t.profile.premium : t.profile.free}
          hint={plan === 'premium' ? t.premium.active : t.premium.premTag}
          right={<Chevron text={plan === 'premium' ? undefined : t.profile.upgrade} />}
          onClick={() => open({ kind: 'premium' })}
        />
        <Row
          icon={<Leaf size={17} weight="fill" />}
          title={t.activity.impact}
          hint={t.profile.impactLine(
            Math.round(impact.minutes),
            impact.fuelL.toLocaleString('id-ID', { maximumFractionDigits: 2 }),
            impact.co2Kg.toLocaleString('id-ID', { maximumFractionDigits: 1 }),
          )}
          right={<Chevron />}
          onClick={() => open({ kind: 'impact' })}
        />
      </Group>

      <Garage />

      <Group title={t.profile.mapNav}>
        <SegRow icon={<MapTrifold size={17} weight="fill" />} title={t.mapOptions.style}>
          <Segmented
            value={mapPrefs.style}
            onChange={(v) => setMapPref('style', v)}
            options={[
              { value: 'calm', label: t.mapOptions.styles.calm },
              { value: 'detail', label: t.mapOptions.styles.detail },
            ]}
          />
        </SegRow>
        <Row
          icon={<Buildings size={17} weight="fill" />}
          title={t.mapOptions.threeD}
          hint={t.mapOptions.threeDHint}
          right={<Toggle checked={mapPrefs.threeD} onChange={(v) => setMapPref('threeD', v)} label={t.mapOptions.threeD} />}
        />
        <SegRow icon={<NavigationArrow size={17} weight="fill" />} title={t.mapOptions.navApp}>
          <Segmented<NavApp>
            value={mapPrefs.navApp}
            onChange={(v) => setMapPref('navApp', v)}
            options={(['kenneth', 'gmaps', 'waze'] as const).map((a) => ({ value: a, label: NAV_APP_NAME[a] }))}
          />
        </SegRow>
      </Group>

      <Group title={t.profile.prefs}>
        <Row
          icon={<Clock size={17} weight="fill" />}
          title={t.profile.reliefNotif}
          hint={t.profile.reliefNotifHint}
          right={<Toggle checked={prefs.reliefNotif} onChange={(v) => setPref('reliefNotif', v)} label={t.profile.reliefNotif} />}
        />
        <Row
          icon={<ShieldCheck size={17} weight="fill" />}
          title={t.profile.gageWarning}
          hint={t.profile.gageWarningHint}
          right={<Toggle checked={prefs.gageWarning} onChange={(v) => setPref('gageWarning', v)} label={t.profile.gageWarning} />}
        />
        <Row
          icon={<Wheelchair size={17} weight="fill" />}
          title={t.profile.accessibleFirst}
          hint={t.profile.accessibleFirstHint}
          right={
            <Toggle checked={prefs.accessibleFirst} onChange={(v) => setPref('accessibleFirst', v)} label={t.profile.accessibleFirst} />
          }
        />
        <Row
          icon={<Vibrate size={17} weight="fill" />}
          title={t.profile.haptics}
          hint={t.profile.hapticsHint}
          right={<Toggle checked={prefs.haptics} onChange={(v) => setPref('haptics', v)} label={t.profile.haptics} />}
        />
      </Group>

      <Group>
        <SegRow icon={<Translate size={17} weight="fill" />} title={t.profile.language}>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />
        </SegRow>
        <SegRow icon={<CircleHalf size={17} weight="fill" />} title={t.profile.theme}>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: t.profile.themeSystem },
              { value: 'light', label: t.profile.themeLight },
              { value: 'dark', label: t.profile.themeDark },
            ]}
          />
        </SegRow>
        <Row icon={<LockKey size={17} weight="fill" />} title={t.profile.privacy} right={<Chevron />} onClick={() => open({ kind: 'privacy' })} />
      </Group>

      <Group title={t.profile.team}>
        <Row
          icon={<Lightning size={17} weight="fill" />}
          title={t.profile.clock}
          hint={`${clockMode === 'live' ? t.clockSheet.live : t.common.simulated} · ${dayName(now, lang)} ${clock(now)}`}
          right={<Chevron />}
          onClick={() => open({ kind: 'clock' })}
        />
        <Row icon={<UserFocus size={17} weight="fill" />} title={t.profile.booth} right={<Chevron />} onClick={() => navigate('/booth')} />
        <Row icon={<PresentationChart size={17} weight="fill" />} title={t.profile.mitra} right={<Chevron />} onClick={() => navigate('/mitra')} />
      </Group>

      <section className="mt-2 flex flex-col items-center pb-4 text-center">
        <LogoMark size={40} />
        <p className="mt-3 max-w-[300px] text-[12px] leading-relaxed text-ink-3">{t.source.prototype}</p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 hover:text-ink"
        >
          <GithubLogo size={15} weight="fill" /> ne-he/kenneth
        </a>
        <p className="mt-1.5 text-[11px] text-ink-3">
          {t.profile.version} {__APP_VERSION__}
        </p>
      </section>
    </div>
  )
}

/** Who you are: Google account, or a guest whose data never leaves the phone. */
function Identity() {
  const t = useT()
  const name = useApp((s) => s.name)
  const account = useApp((s) => s.account)
  const { available, busy, signIn, signOut } = useSignIn()
  const shown = account?.name ?? name ?? ''
  return (
    <section className="mb-5 rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-center gap-3.5">
        {account?.photo ? (
          <img src={account.photo} alt="" referrerPolicy="no-referrer" className="size-14 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-[22px] font-bold text-canvas">
            {(shown || t.profile.guest).slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-bold">{shown || t.profile.guest}</span>
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-3">{account ? account.email : t.profile.guestHint}</span>
        </span>
      </div>
      {account ? (
        <button
          type="button"
          onClick={signOut}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-surface-2 text-[13.5px] font-semibold text-ink-2 hover:text-ink"
        >
          <SignOut size={16} weight="bold" /> {t.profile.signOut}
        </button>
      ) : (
        available && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              haptic('tap')
              void signIn()
            }}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[14px] font-semibold text-canvas disabled:opacity-60"
          >
            <GoogleLogo size={17} weight="bold" /> {busy ? t.profile.signingIn : t.profile.signIn}
          </button>
        )
      )}
    </section>
  )
}

/** Every car and motorbike you drive. The one with the check is what the map and the tickets use. */
function Garage() {
  const t = useT()
  const vehicles = useApp((s) => s.vehicles)
  const active = useVehicle()
  const setActive = useApp((s) => s.setActiveVehicle)
  const open = useUi((s) => s.open)
  const notify = useUi((s) => s.notify)
  return (
    <Group title={t.profile.vehicles}>
      {vehicles.map((v) => {
        const on = v.id === active.id
        const parity = plateParity(v.plate)
        return (
          <div key={v.id} className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => {
                if (on) return
                haptic('tap')
                setActive(v.id)
                notify(t.profile.nowUsing(v.model || v.plate || t.profile.kinds[v.kind]))
              }}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className={clsx('grid size-8 shrink-0 place-items-center rounded-[10px]', on ? 'bg-ink text-canvas' : 'bg-surface-2 text-ink-2')}>
                {v.kind === 'motor' ? <Motorcycle size={17} weight="fill" /> : <CarProfile size={17} weight="fill" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{v.model || t.profile.kinds[v.kind]}</span>
                <span className="mt-1 flex items-center gap-2 text-[12px] text-ink-3">
                  <Plate plate={v.plate} small />
                  <span className="truncate">{v.isEV ? 'EV' : parity ? t.profile.parity(parity) : ''}</span>
                </span>
              </span>
              {on && <Check size={17} weight="bold" className="shrink-0 text-brand-600" />}
            </button>
            <button
              type="button"
              onClick={() => open({ kind: 'vehicle', id: v.id })}
              className="shrink-0 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              {t.profile.edit}
            </button>
          </div>
        )
      })}
      <Row icon={<Plus size={17} weight="bold" />} title={t.profile.addVehicle} onClick={() => open({ kind: 'vehicle', id: 'new' })} />
    </Group>
  )
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      {title && <Label>{title}</Label>}
      <List>{children}</List>
    </section>
  )
}

function Row({
  icon,
  title,
  hint,
  right,
  onClick,
}: {
  icon: ReactNode
  title: ReactNode
  hint?: ReactNode
  right?: ReactNode
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx('flex w-full items-center gap-3 px-4 py-3.5 text-left', onClick && 'transition-colors hover:bg-surface-2/60 active:bg-surface-2')}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] leading-snug font-semibold">{title}</span>
        {hint && <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{hint}</span>}
      </span>
      {right}
    </Tag>
  )
}

/** A setting with a segmented control under its title. */
function SegRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">{icon}</span>
        <span className="text-[14px] font-semibold">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Chevron({ text }: { text?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-ink-3">
      {text}
      <CaretRight size={14} weight="bold" />
    </span>
  )
}
