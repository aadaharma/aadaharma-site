// The Karelian Embroidery Designer's pattern model. A pattern is a set of stitches on a
// lattice of grid points; every stitch joins two neighbouring points:
//   h:x,y  horizontal, from point (x,y) to (x+1,y)
//   v:x,y  vertical, from (x,y) to (x,y+1)
//   d:x,y  diagonal \ across cell (x,y), from (x,y) to (x+1,y+1)
//   a:x,y  diagonal / across cell (x,y), from (x+1,y) to (x,y+1)
// So the right edge of one cell and the left edge of the next are the same stitch.
// Stitches are kept in a Map from key to colour.

export type Kind = 'h' | 'v' | 'd' | 'a'
export type Key = `${Kind}:${number},${number}`
export type Stitches = Map<Key, string>
export type Point = { x: number; y: number }

export const key = (kind: Kind, x: number, y: number): Key => `${kind}:${x},${y}`

export function parseKey(k: Key): { kind: Kind; x: number; y: number } {
  const [kind, rest] = k.split(':') as [Kind, string]
  const [x, y] = rest.split(',').map(Number)
  return { kind, x, y }
}

// The two grid points a stitch joins
export function endpoints(k: Key): [Point, Point] {
  const { kind, x, y } = parseKey(k)
  switch (kind) {
    case 'h':
      return [{ x, y }, { x: x + 1, y }]
    case 'v':
      return [{ x, y }, { x, y: y + 1 }]
    case 'd':
      return [{ x, y }, { x: x + 1, y: y + 1 }]
    case 'a':
      return [{ x: x + 1, y }, { x, y: y + 1 }]
  }
}

// The stitch joining two neighbouring grid points (including diagonal neighbours),
// or null if they aren't neighbours
export function stitchBetween(p: Point, q: Point): Key | null {
  const dx = q.x - p.x
  const dy = q.y - p.y
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (dx === 0 && dy === 0)) return null
  const x = Math.min(p.x, q.x)
  const y = Math.min(p.y, q.y)
  if (dy === 0) return key('h', x, p.y)
  if (dx === 0) return key('v', p.x, y)
  return key(dx === dy ? 'd' : 'a', x, y)
}

// Grid points from a to b, each a neighbour of the last (an 8-connected line), so a
// fast drag that skips points still draws a continuous line
export function pointsBetween(a: Point, b: Point): Point[] {
  const points = [a]
  let { x, y } = a
  while (x !== b.x || y !== b.y) {
    const dx = b.x - x
    const dy = b.y - y
    // Step diagonally while that keeps us closest to the straight line, else straight
    const stepX = Math.sign(dx)
    const stepY = Math.sign(dy)
    if (Math.abs(dx) > 2 * Math.abs(dy)) x += stepX
    else if (Math.abs(dy) > 2 * Math.abs(dx)) y += stepY
    else {
      x += stepX
      y += stepY
    }
    points.push({ x, y })
  }
  return points
}

// Stitches along the line from a to b
export function stitchesAlong(a: Point, b: Point): Key[] {
  const points = pointsBetween(a, b)
  return points.slice(1).map((p, i) => stitchBetween(points[i], p)!)
}

// Nearest grid point to a position given in cells (e.g. pixels / cell size)
export const nearestPoint = (x: number, y: number): Point => ({ x: Math.round(x), y: Math.round(y) })

// The cell a position (in cells) falls in
export const cellAt = (x: number, y: number): Point => ({ x: Math.floor(x), y: Math.floor(y) })

// Whether a stitch lies inside a grid of the given size (in cells)
export function inGrid(k: Key, width: number, height: number) {
  return endpoints(k).every((p) => p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height)
}
