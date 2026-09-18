import {
  CaretRight,
  ChartBar,
  Clock,
  Crown,
  GithubLogo,
  Lightning,
  LockKey,
  PresentationChart,
  ShieldCheck,
  UserFocus,
  Vibrate,
  Wheelchair,
} from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { plateParity } from '../../engine/gage'
import { useT } from '../../i18n'
import { clock, dayName } from '../../lib/time'
import { useApp } from '../../store/app'
import { useNow } from '../../store/clock'
import { useUi } from '../../store/ui'
import { Group, Row, Segmented, Toggle } from '../ui/Controls'
import { Plate } from '../ui/Display'
import { LogoMark } from '../ui/Logo'

export const REPO_URL = 'https://github.com/ne-he/kenneth'

export function Profile() {
  const t = useT()
  const navigate = useNavigate()
  const now = useNow()
  const name = useApp((s) => s.name)
  const vehicle = useApp((s) => s.vehicle)
  const plan = useApp((s) => s.plan)
  const prefs = useApp((s) => s.prefs)
  const lang = useApp((s) => s.lang)
  const theme = useApp((s) => s.theme)
  const clockMode = useApp((s) => s.clock.mode)
  const { setPref, setLang, setTheme } = useApp.getState()
  const open = useUi((s) => s.open)
  const parity = plateParity(vehicle.plate)

  return (
    <div className="no-scrollbar h-full overflow-y-auto px-4 pt-safe pb-28">
      <h1 className="pt-3 pb-4 text-[30px] leading-tight font-extrabold tracking-tight">{t.profile.title}</h1>

      <motion.button
        type="button"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => open({ kind: 'vehicle' })}
        className="mb-5 flex w-full items-center gap-3.5 rounded-[26px] border border-line bg-surface p-4 text-left"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-[22px] font-extrabold text-canvas">
          {(name || t.profile.guest).slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[18px] font-extrabold">{name || t.profile.guest}</span>
            {plan === 'premium' && (
              <span className="flex items-center gap-1 rounded-full bg-led-bg px-2 py-0.5 text-[10.5px] font-bold text-led-lega dark:ring-1 dark:ring-line-strong">
                <Crown size={11} weight="fill" /> Premium
              </span>
            )}
          </span>
          <span className="mt-1.5 flex items-center gap-2 text-[12.5px] text-ink-3">
            <Plate plate={vehicle.plate} />
            <span className="truncate">
              {vehicle.model || t.profile.vehicle}
              {vehicle.isEV ? ' · EV' : parity ? ` · ${t.profile.parity(parity)}` : ''}
            </span>
          </span>
        </span>
        <CaretRight size={16} className="text-ink-3" />
      </motion.button>

      <button
        type="button"
        onClick={() => open({ kind: 'premium' })}
        className="relative mb-5 block w-full overflow-hidden rounded-[26px] bg-[#0f1311] p-4 text-left text-white"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(100% 90% at 100% 0%, rgb(67 255 159 / 0.25), transparent 55%), radial-gradient(80% 80% at 0% 100%, rgb(31 95 214 / 0.3), transparent 60%)',
          }}
        />
        <span className="relative flex items-center justify-between">
          <span>
            <span className="block text-[11px] font-bold tracking-[0.14em] text-led-lega uppercase">{t.profile.plan}</span>
            <span className="mt-1 block text-[20px] font-extrabold">{plan === 'premium' ? t.profile.premium : t.profile.free}</span>
            <span className="mt-0.5 block text-[12.5px] text-white/60">{t.premium.premTag}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[12.5px] font-bold text-[#0f1311]">
            {plan === 'premium' ? t.premium.active : t.profile.upgrade} <CaretRight size={12} weight="bold" />
          </span>
        </span>
      </button>

      <Group title={t.profile.prefs}>
        <Row
          icon={<ShieldCheck size={17} weight="fill" />}
          title={t.profile.gageWarning}
          hint={t.profile.gageWarningHint}
          right={<Toggle checked={prefs.gageWarning} onChange={(v) => setPref('gageWarning', v)} label={t.profile.gageWarning} />}
        />
        <Row
          icon={<Clock size={17} weight="fill" />}
          title={t.profile.reliefNotif}
          hint={t.profile.reliefNotifHint}
          right={<Toggle checked={prefs.reliefNotif} onChange={(v) => setPref('reliefNotif', v)} label={t.profile.reliefNotif} />}
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
        <div className="px-4 py-3.5">
          <div className="mb-2 text-[13px] font-semibold">{t.profile.language}</div>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: 'id', label: 'Indonesia' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
        <div className="px-4 py-3.5">
          <div className="mb-2 text-[13px] font-semibold">{t.profile.theme}</div>
          <Segmented
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: t.profile.themeSystem },
              { value: 'light', label: t.profile.themeLight },
              { value: 'dark', label: t.profile.themeDark },
            ]}
          />
        </div>
      </Group>

      <Group>
        <Row icon={<LockKey size={17} weight="fill" />} title={t.profile.privacy} right={<CaretRight size={15} className="text-ink-3" />} onClick={() => open({ kind: 'privacy' })} />
      </Group>

      <Group title={t.profile.demo}>
        <Row
          icon={<Lightning size={17} weight="fill" />}
          title={t.profile.clock}
          hint={`${clockMode === 'live' ? t.clockSheet.live : t.common.simulated} · ${dayName(now, lang)} ${clock(now)}`}
          right={<CaretRight size={15} className="text-ink-3" />}
          onClick={() => open({ kind: 'clock' })}
        />
        <Row
          icon={<UserFocus size={17} weight="fill" />}
          title={t.profile.booth}
          right={<CaretRight size={15} className="text-ink-3" />}
          onClick={() => navigate('/booth')}
        />
        <Row
          icon={<PresentationChart size={17} weight="fill" />}
          title={t.profile.mitra}
          right={<CaretRight size={15} className="text-ink-3" />}
          onClick={() => navigate('/mitra')}
        />
      </Group>

      <section className="mt-6 flex flex-col items-center pb-4 text-center">
        <LogoMark size={44} />
        <p className="mt-3 max-w-[300px] text-[12.5px] leading-relaxed text-ink-3">{t.source.prototype}</p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 hover:text-ink"
        >
          <GithubLogo size={15} weight="fill" /> ne-he/kenneth
        </a>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-3">
          <ChartBar size={12} /> {t.profile.version} 0.1.0
        </p>
      </section>
    </div>
  )
}
