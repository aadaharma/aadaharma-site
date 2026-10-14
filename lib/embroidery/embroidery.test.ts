import assert from 'node:assert/strict'
import { test } from 'node:test'
import { motifFrom, motifFromJson, motifToJson, placeMotif, TEMPLATE_MAX } from './motif'
import { BUILT_IN_TEMPLATES, isCategory } from './motifs'
import { Pattern } from './pattern'
import {
  bounds, clearRegion, extract, mirrorHorizontal, mirrorVertical, recolourRegion, regionBetween, rework, rotateClockwise, translate,
} from './regions'
import { SHAPES } from './shapes'
import {
  endpoints, key, penStep, pointsBetween, stitchBetween, stitchesAlong, stitchesNear, type Key, type Stitches,
} from './stitches'

const RED = '#bd0603'
const of = (...keys: Key[]): Stitches => new Map(keys.map((k) => [k, RED]))
const keys = (s: Stitches) => [...s.keys()].sort()

test('a stitch joins the two points it was made from', () => {
  for (const [p, q] of [
    [{ x: 2, y: 3 }, { x: 3, y: 3 }],
    [{ x: 2, y: 3 }, { x: 2, y: 4 }],
    [{ x: 2, y: 3 }, { x: 3, y: 4 }],
    [{ x: 3, y: 3 }, { x: 2, y: 4 }],
  ]) {
    const k = stitchBetween(p, q)!
    assert.deepEqual(new Set(endpoints(k).map((e) => `${e.x},${e.y}`)), new Set([`${p.x},${p.y}`, `${q.x},${q.y}`]))
    // The same stitch whichever way it's drawn
    assert.equal(stitchBetween(q, p), k)
  }
  assert.equal(stitchBetween({ x: 0, y: 0 }, { x: 2, y: 0 }), null)
  assert.equal(stitchBetween({ x: 0, y: 0 }, { x: 0, y: 0 }), null)
})

test('shared cell edges are one stitch', () => {
  assert.deepEqual(SHAPES['line-right'](4, 5), SHAPES['line-left'](5, 5))
  assert.deepEqual(SHAPES['line-bottom'](4, 5), SHAPES['line-top'](4, 6))
})

test('a fast drag still draws a continuous line', () => {
  for (const [a, b] of [
    [{ x: 0, y: 0 }, { x: 5, y: 0 }],
    [{ x: 0, y: 0 }, { x: 4, y: 4 }],
    [{ x: 0, y: 0 }, { x: -3, y: 2 }],
    [{ x: 1, y: 7 }, { x: 6, y: 2 }],
    [{ x: 0, y: 0 }, { x: 7, y: 2 }],
  ]) {
    const points = pointsBetween(a, b)
    assert.deepEqual(points[0], a)
    assert.deepEqual(points.at(-1), b)
    // Each point is a neighbour of the one before
    for (let i = 1; i < points.length; i++) assert.ok(stitchBetween(points[i - 1], points[i]))
  }
  assert.deepEqual(stitchesAlong({ x: 0, y: 0 }, { x: 3, y: 3 }), [key('d', 0, 0), key('d', 1, 1), key('d', 2, 2)])
  assert.deepEqual(stitchesAlong({ x: 2, y: 2 }, { x: 2, y: 2 }), [])
})

test('undo and redo take back whole steps', () => {
  const p = new Pattern(10, 10)
  p.begin()
  for (const k of stitchesAlong({ x: 0, y: 0 }, { x: 4, y: 0 })) p.set(k, RED)
  p.end()
  p.set(key('v', 0, 0), RED)
  assert.equal(p.stitches.size, 5)
  p.undo()
  assert.equal(p.stitches.size, 4)
  p.undo()
  assert.equal(p.stitches.size, 0)
  assert.equal(p.canUndo, false)
  p.redo()
  assert.equal(p.stitches.size, 4)
  // A new edit drops what could have been redone
  p.set(key('h', 5, 5), RED)
  assert.equal(p.canRedo, false)
})

test('undo restores recoloured and erased stitches', () => {
  const p = new Pattern(10, 10)
  p.set(key('h', 0, 0), RED)
  p.edit(() => {
    p.set(key('h', 0, 0), '#000000')
    p.set(key('h', 0, 0), undefined)
  })
  assert.equal(p.stitches.size, 0)
  p.undo()
  assert.equal(p.stitches.get(key('h', 0, 0)), RED)
})

test('stitches outside the grid are not drawn', () => {
  const p = new Pattern(3, 3)
  p.set(key('h', 3, 0), RED)
  p.set(key('v', 3, 0), RED) // the grid's right border is inside
  assert.deepEqual(keys(p.stitches), [key('v', 3, 0)])
  p.resize(2, 2)
  assert.equal(p.stitches.size, 0)
})

test('a selection holds the stitches inside it, moved to the corner', () => {
  const all = of(key('h', 2, 2), key('v', 4, 2), key('d', 3, 3), key('h', 9, 9))
  const r = regionBetween({ x: 3, y: 3 }, { x: 2, y: 2 }) // corners in either order
  assert.deepEqual(r, { x: 2, y: 2, width: 2, height: 2 })
  assert.deepEqual(keys(extract(all, r)), [key('d', 1, 1), key('h', 0, 0), key('v', 2, 0)].sort())
})

test('mirroring flips diagonals, and twice gives the original', () => {
  const piece = of(key('d', 0, 0), key('h', 0, 0), key('v', 2, 1))
  const flipped = mirrorHorizontal(piece, 2)
  assert.deepEqual(keys(flipped), [key('a', 1, 0), key('h', 1, 0), key('v', 0, 1)].sort())
  assert.deepEqual(keys(mirrorHorizontal(flipped, 2)), keys(piece))
  assert.deepEqual(keys(mirrorVertical(mirrorVertical(piece, 2), 2)), keys(piece))
})

test('four quarter turns give the original', () => {
  const piece = of(key('d', 0, 0), key('h', 1, 0), key('v', 2, 1), key('a', 1, 2))
  let s = piece
  let [w, h] = [2, 3]
  for (let i = 0; i < 4; i++) {
    s = rotateClockwise(s, h)
    ;[w, h] = [h, w]
  }
  assert.deepEqual(keys(s), keys(piece))
  // A horizontal line turns vertical
  assert.deepEqual(keys(rotateClockwise(of(key('h', 0, 0)), 1)), [key('v', 1, 0)])
})

test('a motif survives saving and is trimmed to its stitches', () => {
  const motif = motifFrom(translate(of(key('d', 0, 0), key('h', 1, 2)), 5, 4))!
  assert.deepEqual({ w: motif.width, h: motif.height }, { w: 2, h: 2 })
  assert.deepEqual(bounds(motif.stitches), { x: 0, y: 0, width: 2, height: 2 })
  const back = motifFromJson(JSON.parse(JSON.stringify(motifToJson(motif))))!
  assert.deepEqual(keys(back.stitches), keys(motif.stitches))
})

test('broken motif JSON is refused', () => {
  assert.equal(motifFromJson(null), null)
  assert.equal(motifFromJson({ width: 2, height: 2, stitches: { red: ['h:0,0'] } }), null)
  assert.equal(motifFromJson({ width: 2, height: 2, stitches: { [RED]: ['x:0,0'] } }), null)
  assert.equal(motifFromJson({ width: 2, height: 2, stitches: { [RED]: ['h:5,0'] } }), null)
  assert.equal(motifFromJson({ width: 0, height: 2, stitches: {} }), null)
})

test('placing a motif is one undo step and can recolour it', () => {
  const p = new Pattern(20, 20)
  const motif = motifFrom(of(key('d', 0, 0), key('a', 0, 0)))!
  placeMotif(p, motif, 3, 4, '#000000')
  assert.deepEqual(keys(p.stitches), [key('a', 3, 4), key('d', 3, 4)])
  assert.equal(p.stitches.get(key('d', 3, 4)), '#000000')
  p.undo()
  assert.equal(p.stitches.size, 0)
})

test('the stitch nearest the pointer is found', () => {
  // Just below the middle of the cell's top edge
  assert.equal(stitchesNear(2.5, 3.1, 0.3)[0], key('h', 2, 3))
  // In the middle of the cell both diagonals cross
  assert.deepEqual(new Set(stitchesNear(2.5, 3.5, 0.1)), new Set([key('d', 2, 3), key('a', 2, 3)]))
  assert.deepEqual(stitchesNear(2.5, 3.25, 0.1), [])
})

test('the pen holds still until the pointer is near the next point', () => {
  const start = penStep(null, 2.2, 2.9, 10, 10)!
  assert.deepEqual(start, { x: 2, y: 3 })
  // Halfway between two points: stay
  assert.equal(penStep(start, 2.5, 3, 10, 10), null)
  // Close to the next point: move
  assert.deepEqual(penStep(start, 2.9, 3, 10, 10), { x: 3, y: 3 })
  // A jump of several points is taken at once
  assert.deepEqual(penStep(start, 6.4, 3, 10, 10), { x: 6, y: 3 })
  // Kept inside the grid
  assert.deepEqual(penStep(null, -3, 12, 10, 10), { x: 0, y: 10 })
})

test('a cancelled drag leaves nothing behind', () => {
  const p = new Pattern(10, 10)
  p.begin()
  p.set(key('h', 0, 0), RED)
  p.cancel()
  assert.equal(p.stitches.size, 0)
  assert.equal(p.canUndo, false)
})

test('selection actions change only the selection, as one step each', () => {
  const p = new Pattern(10, 10)
  p.edit(() => {
    p.set(key('d', 0, 0), RED)
    p.set(key('h', 0, 0), RED)
    p.set(key('h', 8, 8), RED)
  })
  const r = { x: 0, y: 0, width: 2, height: 2 }
  recolourRegion(p, r, '#000000')
  assert.equal(p.stitches.get(key('d', 0, 0)), '#000000')
  assert.equal(p.stitches.get(key('h', 8, 8)), RED)
  rework(p, r, (piece) => mirrorHorizontal(piece, 2), 3, 1)
  assert.deepEqual(keys(p.stitches), [key('a', 4, 1), key('h', 4, 1), key('h', 8, 8)].sort())
  p.undo()
  assert.deepEqual(keys(p.stitches), [key('d', 0, 0), key('h', 0, 0), key('h', 8, 8)].sort())
  clearRegion(p, r)
  assert.deepEqual(keys(p.stitches), [key('h', 8, 8)])
})

test('listeners hear about changes', () => {
  const p = new Pattern(10, 10)
  let calls = 0
  const stop = p.subscribe(() => calls++)
  p.set(key('h', 0, 0), RED)
  p.undo()
  stop()
  p.redo()
  assert.ok(calls >= 2)
  const before = calls
  p.set(key('h', 1, 0), RED)
  assert.equal(calls, before)
})

test('the built-in templates are all valid', () => {
  assert.equal(BUILT_IN_TEMPLATES.length, 10)
  for (const t of BUILT_IN_TEMPLATES) {
    const motif = motifFromJson(t.motif)
    assert.ok(motif, t.id)
    assert.ok(motif.stitches.size > 10, t.id)
    assert.ok(isCategory(t.category), t.id)
  }
})

test('templates can be taller than designs', () => {
  const tall = { width: 200, height: 400, stitches: { [RED]: ['h:0,0', 'v:200,399'] as Key[] } }
  // Too tall for a pattern in the designer, fine as a template
  assert.equal(motifFromJson(tall), null)
  assert.ok(motifFromJson(tall, TEMPLATE_MAX))
  assert.equal(motifFromJson({ ...tall, height: 401 }, TEMPLATE_MAX), null)
  assert.equal(motifFromJson({ ...tall, width: 201 }, TEMPLATE_MAX), null)
})
