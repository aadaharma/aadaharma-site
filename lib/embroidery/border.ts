// The page border: a template redrawn as dots on the same 3 px grid as the dithered page
// background, so the two look like one cloth (components/PageDecoration.tsx draws it)
import type { MotifJson } from './motif'
import { endpoints } from './stitches'

// What the browser needs to draw the border: each stitch as the two grid points it joins
export type Border = { width: number; height: number; stitches: [number, number, number, number][] }

export function borderFromMotif({ width, height, stitches }: MotifJson): Border {
  return {
    width,
    height,
    stitches: Object.values(stitches)
      .flat()
      .map((k) => {
        const [a, b] = endpoints(k)
        return [a.x, a.y, b.x, b.y]
      }),
  }
}

// One repeat of the border as dots, `scale` dots per stitch: a row-major grid, 1 where a
// stitch passes. Stitches share the dots at their grid points, so lines join up. The bottom
// row of grid points is the top row of the next repeat, so it wraps round to the top.
export function borderDots({ width, height, stitches }: Border, scale: number) {
  const w = width * scale + 1, h = height * scale
  const dots = new Uint8Array(w * h)
  for (const [ax, ay, bx, by] of stitches) {
    for (let i = 0; i <= scale; i++) {
      const x = ax * scale + (bx - ax) * i, y = (ay * scale + (by - ay) * i) % h
      dots[y * w + x] = 1
    }
  }
  return { w, h, dots }
}
