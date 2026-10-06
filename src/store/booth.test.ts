import { describe, expect, it } from 'vitest'
import { answerId, combine, isSession, newSession, toCsv, type BoothResponse } from './booth'

const base: BoothResponse = {
  id: 'a1',
  at: Date.UTC(2026, 10, 7, 7, 0),
  lastTime: 'minggu',
  lostMin: '15-30',
  tolerance: 'mungkin',
  features: ['okupansi', 'gerbang'],
  payPriority: 'tergantung',
  like: 'Simpel',
  wish: '',
  question: '',
  idea: '',
  contact: '',
}

describe('booth CSV export', () => {
  it('writes a header and one row per response', () => {
    const lines = toCsv([base, { ...base, id: 'a2' }]).split('\n')
    expect(lines[0]).toBe('id,at,lastTime,lostMin,tolerance,features,payPriority,like,wish,question,idea,contact')
    expect(lines).toHaveLength(3)
  })

  it('quotes commas, quotes and line breaks so spreadsheets do not split cells', () => {
    const csv = toCsv([{ ...base, like: 'Bagus, "rapi"\nbanget' }])
    expect(csv).toContain('"Bagus, ""rapi""\nbanget"')
  })

  it('quotes a lone carriage return too', () => {
    expect(toCsv([{ ...base, like: 'a\rb' }])).toContain('"a\rb"')
  })

  it('keeps free text that looks like a formula as plain text', () => {
    const row = toCsv([{ ...base, like: '- cepat', wish: '=1+1', idea: '@kenneth', contact: '+62812' }]).split('\n')[1]
    expect(row).toContain(",'- cepat,'=1+1,,'@kenneth,'+62812")
    expect(row).toContain(',15-30,')
  })

  it('joins multi-select answers and writes timestamps as ISO', () => {
    const row = toCsv([base]).split('\n')[1]
    expect(row).toContain('okupansi; gerbang')
    expect(row).toContain('2026-11-07T07:00:00.000Z')
  })
})

describe('booth sessions', () => {
  const mine = { ...base, id: 'm1', at: base.at + 60_000, contact: '@pengunjung' }
  const theirs = { ...base, id: 't1', at: base.at + 120_000 }

  it('shows this phone and the other phones together, newest first', () => {
    expect(combine([mine], [theirs]).map((r) => r.id)).toEqual(['t1', 'm1'])
  })

  it('counts an answer once when the session sends it back, and keeps its contact', () => {
    const echoed = { ...mine, contact: '' }
    const all = combine([mine], [echoed, theirs])
    expect(all).toHaveLength(2)
    expect(all.find((r) => r.id === 'm1')?.contact).toBe('@pengunjung')
  })

  it('makes session keys that cannot be guessed and fit the rules', () => {
    const a = newSession()
    expect(isSession(a)).toBe(true)
    expect(a).not.toBe(newSession())
    expect(isSession('booth')).toBe(false)
    expect(isSession('a/b' + a.slice(3))).toBe(false)
  })

  it('gives answers ids that do not collide between phones', () => {
    const ids = new Set(Array.from({ length: 500 }, answerId))
    expect(ids.size).toBe(500)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9-]{1,40}$/)
  })
})
