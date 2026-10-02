import { describe, expect, it } from 'vitest'
import { beside, placePins, type Offset, type PinBox } from './declutter'

const pin = (id: string, x: number, y: number, extra: Partial<PinBox> = {}): PinBox => ({
  id,
  x,
  y,
  w: 48,
  h: 24,
  dir: 'e',
  ...extra,
})

/** Screen box of a placed label. */
const box = (p: PinBox, [dx, dy]: Offset) => ({
  l: p.x + dx - p.w / 2,
  r: p.x + dx + p.w / 2,
  t: p.y + dy - p.h / 2,
  b: p.y + dy + p.h / 2,
})

const apart = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t

describe('placePins', () => {
  it('keeps a lone pin right on its point', () => {
    expect(placePins([pin('a', 100, 100)]).get('a')).toEqual([0, 0])
  })

  it('leaves pins that are far apart on their points', () => {
    const out = placePins([pin('a', 100, 100), pin('b', 300, 100)])
    expect(out.get('a')).toEqual([0, 0])
    expect(out.get('b')).toEqual([0, 0])
  })

  it('moves stacked pins beside their points, preferred side first, so no label hides the other place', () => {
    const a = pin('a', 100, 100, { dir: 'n' })
    const b = pin('b', 104, 110, { dir: 's' })
    const out = placePins([a, b])
    expect(out.get('a')).toEqual(beside('n', 48, 24, 3))
    expect(out.get('b')).toEqual(beside('s', 48, 24, 3))
    const ba = box(a, out.get('a')!)
    const bb = box(b, out.get('b')!)
    expect(apart(ba, bb)).toBe(true)
    expect(b.y < ba.t || b.y > ba.b).toBe(true)
    expect(a.y < bb.t || a.y > bb.b).toBe(true)
  })

  it('pulls three places a few pixels apart into labels that do not touch', () => {
    const pins = [pin('cp', 218, 226, { dir: 'sw' }), pin('neo', 212, 212, { dir: 'nw' }), pin('mta', 223, 232, { dir: 'se' })]
    const out = placePins(pins)
    for (let i = 0; i < pins.length; i++) {
      for (let j = i + 1; j < pins.length; j++) {
        expect(apart(box(pins[i], out.get(pins[i].id)!), box(pins[j], out.get(pins[j].id)!))).toBe(true)
      }
    }
  })

  it('keeps labels off another place even when that place is only a dot', () => {
    const out = placePins([pin('dot', 100, 100, { w: 0, h: 0 }), pin('a', 104, 100)])
    expect(out.get('dot')).toEqual([0, 0])
    expect(out.get('a')).not.toEqual([0, 0])
  })

  it('keeps a fixed chip where it is and moves labels off it', () => {
    const out = placePins([pin('gate', 100, 100, { fixed: [0, 0] }), pin('b', 100, 104)])
    expect(out.get('gate')).toEqual([0, 0])
    expect(out.get('b')).not.toEqual([0, 0])
  })

  it('lifts a pin that must not cover its point above it, or to another side when a chip is there', () => {
    const sel = { onPoint: false, dir: 'n' as const, gap: 8 }
    expect(placePins([pin('sel', 100, 100, sel)]).get('sel')).toEqual(beside('n', 48, 24, 8))
    const out = placePins([pin('gate', 100, 76, { fixed: [0, 0] }), pin('sel', 100, 100, sel)])
    expect(out.get('sel')).not.toEqual(beside('n', 48, 24, 8))
    expect(out.get('sel')).not.toEqual([0, 0])
  })

  it('still places a pin when every side is taken', () => {
    const ring = [-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => pin(`r${i}${j}`, 100 + i * 52, 100 + j * 28)))
    const out = placePins([...ring, pin('late', 100, 100)])
    expect(out.get('late')).toHaveLength(2)
  })
})

describe('beside', () => {
  it('leaves the gap between the point and the near edge of the label', () => {
    expect(beside('e', 48, 24, 3)).toEqual([27, 0])
    expect(beside('n', 48, 24, 3)).toEqual([0, -15])
    expect(beside('sw', 48, 24, 3)).toEqual([-12, 15])
  })
})
