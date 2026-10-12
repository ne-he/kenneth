import clsx from 'clsx'
import type { ReactNode } from 'react'
import { CountUp } from '../components/ui/Display'

/* Building blocks shared by the venue and merchant views of /mitra. */

export function Kpi({ icon, label, value, unit, note, tone }: { icon: ReactNode; label: string; value: number | null; unit?: string; note?: string; tone?: 'bad' }) {
  return (
    <div className="rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-3">
        <span className={clsx('grid size-7 place-items-center rounded-full', tone === 'bad' ? 'bg-penuh-soft text-penuh-ink dark:bg-penuh/15 dark:text-led-penuh' : 'bg-surface-2 text-ink-2')}>
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 text-[34px] leading-none font-semibold tracking-tight">
        {value === null ? '-' : <CountUp value={value} grouped />}
        {unit && value !== null && <span className="text-[18px]">{unit}</span>}
      </div>
      {note && <div className="mt-1.5 text-[12px] text-ink-3">{note}</div>}
    </div>
  )
}

export function Card({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[24px] border border-line bg-surface p-5">
      <h2 className="text-[15px] font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 mb-4 text-[12px] text-ink-3">{sub}</p>}
      {!sub && <div className="mb-3" />}
      {children}
    </div>
  )
}
