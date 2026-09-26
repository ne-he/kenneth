import { describe, expect, it } from 'vitest'
import { toCsv, type BoothResponse } from './booth'

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

  it('joins multi-select answers and writes timestamps as ISO', () => {
    const row = toCsv([base]).split('\n')[1]
    expect(row).toContain('okupansi; gerbang')
    expect(row).toContain('2026-11-07T07:00:00.000Z')
  })
})
