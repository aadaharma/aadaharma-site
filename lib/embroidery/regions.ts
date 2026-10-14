// Working with parts of a pattern: what a selection holds, moving, mirroring and
// rotating it. A region is a rectangle of cells; a stitch is in it if both its
// ends are on or inside the rectangle's border.
import { endpoints, stitchBetween, type Key, type Point, type Stitches } from './stitches'

export type Region = { x: number; y: number; width: number; height: number }

// The region spanned by two corner cells, in either order
export function regionBetween(a: Point, b: Point): Region {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return { x, y, width: Math.abs(a.x - b.x) + 1, height: Math.abs(a.y - b.y) + 1 }
}

export function inRegion(k: Key, r: Region) {
  return endpoints(k).every((p) => p.x >= r.x && p.y >= r.y && p.x <= r.x + r.width && p.y <= r.y + r.height)
}

// The stitches inside a region, moved so the region's corner is (0,0)
export function extract(stitches: Stitches, r: Region): Stitches {
  const out: Stitches = new Map()
  for (const [k, colour] of stitches) if (inRegion(k, r)) out.set(movePoints(k, (p) => ({ x: p.x - r.x, y: p.y - r.y })), colour)
  return out
}

// A stitch with both its ends moved by fn. Moving, mirroring and rotating all keep
// neighbouring points neighbours, so the result is always a stitch.
export function movePoints(k: Key, fn: (p: Point) => Point): Key {
  const [p, q] = endpoints(k)
  return stitchBetween(fn(p), fn(q))!
}

export function transform(stitches: Stitches, fn: (p: Point) => Point): Stitches {
  const out: Stitches = new Map()
  for (const [k, colour] of stitches) out.set(movePoints(k, fn), colour)
  return out
}

export const translate = (stitches: Stitches, dx: number, dy: number) =>
  transform(stitches, (p) => ({ x: p.x + dx, y: p.y + dy }))

// Mirroring and rotating work on a piece whose corner is (0,0), like extract() returns
export const mirrorHorizontal = (stitches: Stitches, width: number) =>
  transform(stitches, (p) => ({ x: width - p.x, y: p.y }))

export const mirrorVertical = (stitches: Stitches, height: number) =>
  transform(stitches, (p) => ({ x: p.x, y: height - p.y }))

// A quarter turn clockwise; the piece becomes height wide and width tall
export const rotateClockwise = (stitches: Stitches, height: number) =>
  transform(stitches, (p) => ({ x: height - p.y, y: p.x }))

// The smallest region holding all the stitches, or null if there are none
export function bounds(stitches: Stitches): Region | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const k of stitches.keys()) {
    for (const p of endpoints(k)) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
  }
  if (minX === Infinity) return null
  // A region is counted in cells; a lone vertical or horizontal line still takes one
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) }
}
