// The page border: a template drawn as an SVG, one line per stitch, for the site to use as
// a CSS mask down the edges of the window (components/PageBorder.tsx)
import type { MotifJson } from './motif'
import { endpoints } from './stitches'

// Each stitch stops a little short of the grid points, so the stitches read as separate,
// like thread on fabric. The drawing keeps its full height, so repeats join up exactly;
// a little room at the sides keeps stitches along the edges from being cut in half.
export function borderSvg({ width, height, stitches }: MotifJson): string {
  const gap = 0.1
  const path = Object.values(stitches)
    .flat()
    .map((k) => {
      const [a, b] = endpoints(k)
      const dx = b.x - a.x, dy = b.y - a.y
      const t = gap / Math.hypot(dx, dy)
      const n = (v: number) => +v.toFixed(2)
      return `M${n(a.x + dx * t)} ${n(a.y + dy * t)}L${n(b.x - dx * t)} ${n(b.y - dy * t)}`
    })
    .join('')
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.3 0 ${width + 0.6} ${height}">` +
    `<path d="${path}" fill="none" stroke="#000" stroke-width="0.3" stroke-linecap="round"/></svg>`
  )
}

// As a CSS url() value
export const borderMask = (motif: MotifJson) => `url("data:image/svg+xml,${encodeURIComponent(borderSvg(motif))}")`
