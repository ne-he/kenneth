import { describe, expect, it } from 'vitest'
import { around, beside, hang, placeLabels, type Dot, type Label } from './declutter'

/** A venue label that hangs to the right of its dot, the way the map draws them. */
const label = (id: string, x: number, y: number, extra: Partial<Label> = {}): Label => ({
  id,
  x,
  y,
  w: 48,
  h: 22,
  spots: hang(48, 11),
  ...extra,
})

const dot = (id: string, x: number, y: number): Dot => ({ id, x, y, r: 6 })

describe('placeLabels', () => {
  it('shows a lone label at its spot', () => {
    expect(placeLabels([label('a', 100, 100)], [dot('a', 100, 100)]).get('a')).toEqual([13, 0])
  })

  it('shows labels that have room, however many', () => {
    const out = placeLabels([label('a', 100, 100), label('b', 100, 200)], [dot('a', 100, 100), dot('b', 100, 200)])
    expect(out.get('a')).toEqual([13, 0])
    expect(out.get('b')).toEqual([13, 0])
  })

  it('hangs a label left of its dot when the right side would cover another place', () => {
    const out = placeLabels([label('a', 100, 100)], [dot('a', 100, 100), dot('b', 130, 100)])
    expect(out.get('a')).toEqual([-13, 0])
  })

  it('drops the lower-priority label when both sides are taken, so that place stays a dot', () => {
    const out = placeLabels([label('first', 100, 100), label('later', 125, 112)], [dot('first', 100, 100), dot('later', 125, 112)])
    expect(out.get('first')).toEqual([-13, 0])
    expect(out.get('later')).toBeNull()
  })

  it('drops a label that would cover another place on both sides', () => {
    const out = placeLabels([label('a', 100, 100)], [dot('a', 100, 100), dot('b', 130, 100), dot('c', 70, 100)])
    expect(out.get('a')).toBeNull()
  })

  it('drops a label that would cover you-are-here', () => {
    const out = placeLabels([label('a', 100, 100)], [dot('a', 100, 100), { id: 'origin', x: 100, y: 100, r: 9 }])
    expect(out.get('a')).toBeNull()
  })

  it('moves a label it must keep to the next free spot round its point', () => {
    const spots = around(120, 32, 10)
    const gate = label('gate', 100, 70, { w: 40, spots: [[0, 0]], keep: true })
    const out = placeLabels([gate, label('sel', 100, 100, { w: 120, h: 32, spots, keep: true })], [dot('sel', 100, 100)])
    expect(out.get('gate')).toEqual([0, 0])
    expect(out.get('sel')).not.toEqual(spots[0])
    expect(out.get('sel')).not.toBeNull()
  })

  it('still places a label it must keep when every spot is taken', () => {
    const wall = label('wall', 100, 100, { w: 600, h: 600, spots: [[0, 0]], keep: true })
    const out = placeLabels([wall, label('sel', 100, 100, { spots: around(48, 22, 10), keep: true })], [])
    expect(out.get('sel')).toHaveLength(2)
  })
})

describe('hang', () => {
  it('puts the dot the inset in from either end of the pill', () => {
    expect(hang(48, 11)).toEqual([
      [13, 0],
      [-13, 0],
    ])
  })
})

describe('beside', () => {
  it('leaves the gap between the point and the near edge of the label', () => {
    expect(beside('e', 48, 24, 3)).toEqual([27, 0])
    expect(beside('n', 48, 24, 3)).toEqual([0, -15])
    expect(beside('sw', 48, 24, 3)).toEqual([-12, 15])
  })
})
