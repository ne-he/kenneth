import { dayDiff, shortDate } from '../lib/time'
import { useApp } from '../store/app'
import en from './en'
import id, { type Dict } from './id'

const DICTS = { id, en }

export function useT(): Dict {
  return DICTS[useApp((s) => s.lang)]
}

export function useLang() {
  return useApp((s) => s.lang)
}

/** Today, tomorrow, or a short date, counted in WIB calendar days from `now`. */
export function useDayLabel() {
  const t = useT()
  const lang = useLang()
  return (ts: number, now: number) => {
    const d = dayDiff(now, ts)
    if (d === 0) return t.common.today
    if (d === 1) return t.common.tomorrow
    return shortDate(ts, lang)
  }
}

export type { Dict }
