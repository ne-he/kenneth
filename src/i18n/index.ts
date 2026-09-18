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

export type { Dict }
