import clsx from 'clsx'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/*
  Small hand-rolled SVG charts for the partner dashboard. Specs follow the
  house dataviz rules: 2px lines, bars capped at 24px with 4px rounded ends
  square at the baseline, hairline solid grid, one axis only, labels in ink
  tokens (never the series color), hover on every mark, a table behind each.
*/

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(320)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function Tip({ x, y, children, width }: { x: number; y: number; children: ReactNode; width: number }) {
  const left = Math.min(Math.max(8, x + 12), width - 170)
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-[150px] rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float"
      style={{ left, top: Math.max(0, y - 10) }}
    >
      {children}
    </div>
  )
}

const pct = (v: number) => `${Math.round(v * 100)}%`

/** Occupancy through the day, with the two status thresholds drawn as reference lines. */
export function OccupancyLine({
  data,
  color,
  nowHour,
  thresholds,
}: {
  data: { hour: number; occ: number }[]
  color: string
  nowHour?: number
  thresholds: { value: number; label: string }[]
}) {
  const [box, w] = useWidth<HTMLDivElement>()
  const h = 220
  const pad = { l: 38, r: 16, t: 14, b: 26 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const x0 = data[0].hour
  const x1 = data.at(-1)!.hour
  const X = (hr: number) => pad.l + ((hr - x0) / (x1 - x0)) * iw
  const Y = (v: number) => pad.t + (1 - v) * ih
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${X(d.hour)},${Y(d.occ)}`).join('')
  const area = `${line}L${X(x1)},${Y(0)}L${X(x0)},${Y(0)}Z`
  const [hover, setHover] = useState<number | null>(null)
  const hv = hover === null ? null : data[hover]

  return (
    <div ref={box} className="relative">
      <svg
        width={w}
        height={h}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const hr = x0 + ((e.clientX - r.left - pad.l) / iw) * (x1 - x0)
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(hr - x0))))
        }}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Okupansi per jam"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
            <text x={pad.l - 8} y={Y(v) + 4} textAnchor="end" className="fill-ink-3 text-[10.5px] tabular">
              {pct(v)}
            </text>
          </g>
        ))}
        {thresholds.map((t) => (
          <g key={t.label}>
            <line x1={pad.l} x2={w - pad.r} y1={Y(t.value)} y2={Y(t.value)} stroke="var(--ink-3)" strokeWidth={1} opacity={0.6} />
            <text x={w - pad.r} y={Y(t.value) - 5} textAnchor="end" className="fill-ink-2 text-[10.5px] font-semibold">
              {t.label}
            </text>
          </g>
        ))}
        <path d={area} fill={color} opacity={0.1} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d) =>
          d.hour % 2 === 0 ? (
            <text key={d.hour} x={X(d.hour)} y={h - 8} textAnchor="middle" className="fill-ink-3 text-[10.5px] tabular">
              {String(d.hour).padStart(2, '0')}.00
            </text>
          ) : null,
        )}
        {nowHour !== undefined && nowHour >= x0 && nowHour <= x1 && (
          <g>
            <line x1={X(nowHour)} x2={X(nowHour)} y1={pad.t} y2={Y(0)} stroke="var(--ink)" strokeWidth={1} />
          </g>
        )}
        {hv && (
          <g>
            <line x1={X(hv.hour)} x2={X(hv.hour)} y1={pad.t} y2={Y(0)} stroke="var(--ink-2)" strokeWidth={1} />
            <circle cx={X(hv.hour)} cy={Y(hv.occ)} r={5} fill={color} stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {hv && (
        <Tip x={X(hv.hour)} y={Y(hv.occ)} width={w}>
          <div className="text-[15px] font-extrabold tabular">{pct(hv.occ)}</div>
          <div className="text-ink-3">{String(hv.hour).padStart(2, '0')}.00</div>
        </Tip>
      )}
    </div>
  )
}

/** Vertical bars from one baseline, hover per bar, the peak labelled. */
export function Columns({
  data,
  color,
  format,
  label,
}: {
  data: { key: string; value: number }[]
  color: string
  format: (v: number) => string
  label: string
}) {
  const [box, w] = useWidth<HTMLDivElement>()
  const h = 160
  const pad = { l: 8, r: 8, t: 22, b: 24 }
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const max = Math.max(1, ...data.map((d) => d.value))
  const band = iw / data.length
  const bw = Math.min(24, band - 2)
  const peak = data.reduce((a, b, i) => (b.value > data[a].value ? i : a), 0)
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div ref={box} className="relative">
      <svg width={w} height={h} role="img" aria-label={label}>
        <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke="var(--line-strong)" />
        {data.map((d, i) => {
          const bh = (d.value / max) * ih
          const x = pad.l + i * band + (band - bw) / 2
          const y = pad.t + ih - bh
          const r = Math.min(4, bh)
          return (
            <g
              key={d.key}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              tabIndex={0}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            >
              <rect x={pad.l + i * band} y={pad.t} width={band} height={ih} fill="transparent" />
              {bh > 0 && (
                <path
                  d={`M${x},${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${y + bh}H${x}Z`}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {i === peak && d.value > 0 && (
                <text x={x + bw / 2} y={y - 6} textAnchor="middle" className="fill-ink text-[11px] font-bold tabular">
                  {format(d.value)}
                </text>
              )}
              {i % 2 === 0 && (
                <text x={x + bw / 2} y={h - 7} textAnchor="middle" className="fill-ink-3 text-[10.5px] tabular">
                  {d.key}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <Tip x={pad.l + hover * band + band / 2} y={pad.t} width={w}>
          <div className="text-[15px] font-extrabold tabular">{format(data[hover].value)}</div>
          <div className="text-ink-3">{data[hover].key}</div>
        </Tip>
      )}
    </div>
  )
}

/** Horizontal bars with the value at the tip. */
export function HBars({ data, color, format }: { data: { label: string; value: number }[]; color: string; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group" tabIndex={0} title={`${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex justify-between text-[12.5px]">
            <span className="font-semibold">{d.label}</span>
            <span className="font-bold tabular">{format(d.value)}</span>
          </div>
          <div className="h-3 rounded-r-[4px] bg-surface-2">
            <div
              className="h-full rounded-r-[4px] transition-[width] duration-700 group-hover:brightness-110"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Two series side by side per category, legend on top, values labelled at the tips. */
export function PairedBars({
  data,
  colors,
  names,
  format,
}: {
  data: { label: string; a: number; b: number }[]
  colors: { a: string; b: string }
  names: { a: string; b: string }
  format: (v: number) => string
}) {
  const max = Math.max(...data.flatMap((d) => [d.a, d.b]), 0.01)
  return (
    <div>
      <div className="mb-3 flex gap-4 text-[12px] font-semibold text-ink-2">
        {(['a', 'b'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px]" style={{ background: colors[k] }} />
            {names[k]}
          </span>
        ))}
      </div>
      <ul className="space-y-3.5">
        {data.map((d) => (
          <li key={d.label}>
            <div className="mb-1.5 text-[12.5px] font-semibold">{d.label}</div>
            {(['a', 'b'] as const).map((k) => (
              <div key={k} className="mb-[2px] flex items-center gap-2" title={`${names[k]}: ${format(d[k])}`}>
                <div className="h-3 flex-1">
                  <div className="h-full rounded-r-[4px]" style={{ width: `${(d[k] / max) * 100}%`, background: colors[k] }} />
                </div>
                <span className="w-10 text-right text-[11.5px] font-bold tabular">{format(d[k])}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Week by hour grid on one sequential hue, light to dark. */
export function Heatmap({
  rows,
  dark,
  format,
}: {
  rows: { label: string; cells: { hour: number; value: number }[] }[]
  dark: boolean
  format: (v: number) => string
}) {
  const [hover, setHover] = useState<string | null>(null)
  // Brand ramp, light to dark. In dark mode the ramp runs the other way so magnitude still reads as "more ink".
  const ramp = dark
    ? ['#12211b', '#123a2c', '#11573f', '#0f7a55', '#16a36f', '#43d99a']
    : ['#eef8f3', '#cdeedd', '#9fdcc0', '#62c39b', '#239d72', '#0b6e4f']
  const step = (v: number) => ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))]
  const hours = rows[0]?.cells.map((c) => c.hour) ?? []
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-[2px] text-[10.5px]">
        <thead>
          <tr>
            <th />
            {hours.map((h) => (
              <th key={h} className="pb-1 font-semibold text-ink-3 tabular">
                {h % 2 === 0 ? String(h).padStart(2, '0') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <th className="pr-2 text-left font-semibold text-ink-2">{r.label}</th>
              {r.cells.map((c) => {
                const key = `${r.label}-${c.hour}`
                return (
                  <td
                    key={c.hour}
                    tabIndex={0}
                    onPointerEnter={() => setHover(key)}
                    onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(key)}
                    onBlur={() => setHover(null)}
                    className={clsx('relative h-7 min-w-5 rounded-[4px] outline-none', hover === key && 'ring-2 ring-ink')}
                    style={{ background: step(c.value) }}
                    aria-label={`${r.label} ${c.hour}.00 ${format(c.value)}`}
                  >
                    {hover === key && (
                      <span className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-lg border border-line bg-surface px-2 py-1 text-[11.5px] font-bold whitespace-nowrap shadow-float">
                        {format(c.value)} · {String(c.hour).padStart(2, '0')}.00
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center gap-1.5 text-[10.5px] text-ink-3">
        <span>0%</span>
        {ramp.map((c) => (
          <span key={c} className="h-2.5 w-6 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>100%</span>
      </div>
    </div>
  )
}
