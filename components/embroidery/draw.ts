// Drawing patterns on a canvas: the linen, its grid and the stitches. Used by the editor,
// the template previews and the PNG download.
import type { Motif } from '@/lib/embroidery/motif'
import { endpoints, type Key } from '@/lib/embroidery/stitches'

export type Fabric = { fabric: string; grid: string; gridStrong: string; hole: string }

// The linen stays off-white in dark mode too, so the thread colours look true
export const LINEN: Fabric = {
  fabric: '#fcf9f2',
  grid: 'rgb(120 90 60 / 0.15)',
  gridStrong: 'rgb(120 90 60 / 0.36)',
  hole: 'rgb(110 80 50 / 0.26)',
}

// Stitches as thread: each one a little shorter than its grid line, so the holes show.
// `size` is the cell size in pixels and (ox, oy) where grid point (0,0) is.
export function drawStitches(
  ctx: CanvasRenderingContext2D,
  stitches: Iterable<readonly [Key, string]>,
  size: number,
  ox: number,
  oy: number,
) {
  const byColour = new Map<string, Key[]>()
  for (const [k, colour] of stitches) {
    const list = byColour.get(colour)
    if (list) list.push(k)
    else byColour.set(colour, [k])
  }
  const inset = size * 0.1
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(1.2, size * 0.15)
  for (const [colour, keys] of byColour) {
    ctx.strokeStyle = colour
    ctx.beginPath()
    for (const k of keys) {
      const [p, q] = endpoints(k)
      const x0 = ox + p.x * size, y0 = oy + p.y * size, x1 = ox + q.x * size, y1 = oy + q.y * size
      const length = Math.hypot(x1 - x0, y1 - y0)
      const ix = ((x1 - x0) / length) * inset, iy = ((y1 - y0) / length) * inset
      ctx.moveTo(x0 + ix, y0 + iy)
      ctx.lineTo(x1 - ix, y1 - iy)
    }
    ctx.stroke()
  }
}

// The linen for cells x0..x1 × y0..y1: every tenth grid line stronger, and the holes
// where stitches go through once the cells are big enough to show them
export function drawFabric(
  ctx: CanvasRenderingContext2D,
  size: number,
  ox: number,
  oy: number,
  [x0, y0, x1, y1]: [number, number, number, number],
  fabric: Fabric,
) {
  ctx.fillStyle = fabric.fabric
  ctx.fillRect(ox + x0 * size, oy + y0 * size, (x1 - x0) * size, (y1 - y0) * size)
  if (size >= 5) {
    const thin = new Path2D()
    const strong = new Path2D()
    for (let x = x0; x <= x1; x++) {
      const path = x % 10 === 0 ? strong : thin
      const X = Math.round(ox + x * size) + 0.5
      path.moveTo(X, oy + y0 * size)
      path.lineTo(X, oy + y1 * size)
    }
    for (let y = y0; y <= y1; y++) {
      const path = y % 10 === 0 ? strong : thin
      const Y = Math.round(oy + y * size) + 0.5
      path.moveTo(ox + x0 * size, Y)
      path.lineTo(ox + x1 * size, Y)
    }
    ctx.lineWidth = 1
    ctx.strokeStyle = fabric.grid
    ctx.stroke(thin)
    ctx.strokeStyle = fabric.gridStrong
    ctx.stroke(strong)
  }
  if (size >= 16) {
    const r = Math.min(2.2, size * 0.07)
    ctx.fillStyle = fabric.hole
    ctx.beginPath()
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        ctx.moveTo(ox + x * size + r, oy + y * size)
        ctx.arc(ox + x * size, oy + y * size, r, 0, 2 * Math.PI)
      }
    }
    ctx.fill()
  }
}

// A template's small picture: the motif centred on a bit of linen, in the given colour
// or, without one, in its own colours
export function drawPreview(canvas: HTMLCanvasElement, motif: Motif, colour?: string) {
  const dpr = window.devicePixelRatio || 1
  const w = canvas.clientWidth || canvas.width
  const h = canvas.clientHeight || canvas.height
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = LINEN.fabric
  ctx.fillRect(0, 0, w, h)
  const pad = 8
  const size = Math.min((w - 2 * pad) / motif.width, (h - 2 * pad) / motif.height)
  const ox = (w - motif.width * size) / 2
  const oy = (h - motif.height * size) / 2
  drawStitches(ctx, colour ? [...motif.stitches.keys()].map((k) => [k, colour] as const) : motif.stitches, size, ox, oy)
}

// The whole pattern as a PNG, with a one-cell margin of linen around it
export function patternPng(width: number, height: number, stitches: Iterable<readonly [Key, string]>): Promise<Blob> {
  const size = Math.max(6, Math.min(24, Math.floor(4800 / Math.max(width, height))))
  const canvas = document.createElement('canvas')
  canvas.width = (width + 2) * size
  canvas.height = (height + 2) * size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = LINEN.fabric
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  drawFabric(ctx, size, size, size, [0, 0, width, height], LINEN)
  drawStitches(ctx, stitches, size, size, size)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG failed'))), 'image/png'))
}
