import { Buildings, NavigationArrow } from '@phosphor-icons/react'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useT } from '../../i18n'
import { haptic } from '../../lib/haptics'
import { NAV_APP_NAME } from '../../lib/navApps'
import { useApp, type MapStyle, type NavApp } from '../../store/app'
import { useUi } from '../../store/ui'
import { Toggle } from '../ui/Controls'
import { Label, List } from '../ui/Kit'
import { SheetHeader } from '../ui/Sheet'

const STYLES: MapStyle[] = ['calm', 'detail']
const APPS: NavApp[] = ['kenneth', 'gmaps', 'waze']

/** Map look and which app drives. The same settings live in Akun, this is the shortcut from the map. */
export function MapOptionsSheet() {
  const t = useT()
  const close = useUi((s) => s.close)
  const prefs = useApp((s) => s.mapPrefs)
  const setMapPref = useApp((s) => s.setMapPref)

  return (
    <div className="pb-5">
      <SheetHeader title={t.mapOptions.title} onClose={close} closeLabel={t.common.close} />

      <Label>{t.mapOptions.style}</Label>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {STYLES.map((s) => (
          <StyleCard key={s} style={s} active={prefs.style === s} onClick={() => setMapPref('style', s)}>
            <span className="block text-[14px] font-semibold">{t.mapOptions.styles[s]}</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{t.mapOptions.styleHints[s]}</span>
          </StyleCard>
        ))}
      </div>

      <List className="mb-5">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">
            <Buildings size={17} weight="fill" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">{t.mapOptions.threeD}</span>
            <span className="block text-[12px] text-ink-3">{t.mapOptions.threeDHint}</span>
          </span>
          <Toggle checked={prefs.threeD} onChange={(v) => setMapPref('threeD', v)} label={t.mapOptions.threeD} />
        </div>
      </List>

      <Label>{t.mapOptions.navApp}</Label>
      <List>
        {APPS.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={prefs.navApp === a}
            onClick={() => {
              haptic('tap')
              setMapPref('navApp', a)
            }}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-2/60"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-surface-2 text-ink-2">
              <NavigationArrow size={16} weight="fill" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{NAV_APP_NAME[a]}</span>
              <span className="block text-[12px] text-ink-3">{t.mapOptions.navHints[a]}</span>
            </span>
            <span
              className={clsx(
                'grid size-5 place-items-center rounded-full border-2',
                prefs.navApp === a ? 'border-brand-600 bg-brand-600' : 'border-line-strong',
              )}
            >
              {prefs.navApp === a && <span className="size-2 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </List>
    </div>
  )
}

/** A tiny drawing of each map look, so the choice is visual. */
function StyleCard({ style, active, onClick, children }: { style: MapStyle; active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => {
        haptic('tap')
        onClick()
      }}
      className={clsx('rounded-[18px] border-2 p-2 text-left transition-colors', active ? 'border-ink' : 'border-transparent bg-surface-2')}
    >
      <svg viewBox="0 0 120 64" className="mb-2 w-full rounded-[12px]" aria-hidden="true">
        {style === 'calm' ? (
          <>
            <rect width="120" height="64" fill="#efeee9" />
            <path d="M0 40 L120 22" stroke="#ffffff" strokeWidth="7" />
            <path d="M44 0 L60 64" stroke="#ffffff" strokeWidth="5" />
            <rect x="72" y="34" width="22" height="14" rx="2" fill="#e2e0d8" />
            <circle cx="30" cy="24" r="5" fill="#0e9f6e" />
            <circle cx="84" cy="14" r="5" fill="#e5484d" />
          </>
        ) : (
          <>
            <rect width="120" height="64" fill="#f2efe6" />
            <path d="M0 50 C30 44 50 60 120 40" fill="none" stroke="#a9d3f2" strokeWidth="8" />
            <rect x="0" y="0" width="34" height="26" fill="#d4ebc8" />
            <path d="M0 40 L120 22" stroke="#fbd28a" strokeWidth="7" />
            <path d="M44 0 L60 64" stroke="#ffffff" strokeWidth="5" />
            <rect x="72" y="34" width="22" height="14" rx="2" fill="#dcd6ca" />
            <circle cx="92" cy="50" r="3" fill="#6c63d9" />
            <circle cx="20" cy="46" r="3" fill="#d9534f" />
            <circle cx="30" cy="24" r="5" fill="#0e9f6e" />
            <circle cx="84" cy="14" r="5" fill="#e5484d" />
          </>
        )}
      </svg>
      {children}
    </button>
  )
}
