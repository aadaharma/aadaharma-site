'use client'

import { useEffect, useRef } from 'react'
import { borderDots, type Border } from '@/lib/embroidery/border'

// The dithered page background and the page border, drawn as dots on one 3 px grid so they
// look like the same cloth. Colours come from the palette (--linen, --tint-1, --tint-2 and
// --border-ink), so both follow the theme. Styled in src/styles/base.css.
const PX = 3

// Ordered dithering: an 8 × 8 Bayer matrix of thresholds between 0 and 1
const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21],
].map((row) => row.map((q) => (q + 0.5) / 64))

// Smooth value noise, so the wash isn't perfectly even
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
const noise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
  return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v
}

// A palette colour as [r, g, b]. color-mix() colours come back as color(srgb 0–1 values).
function rgb(name: string): number[] {
  const probe = document.createElement('i')
  probe.style.color = `var(${name})`
  document.body.append(probe)
  const c = getComputedStyle(probe).color
  probe.remove()
  const m = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).map(Number)
  return (c.startsWith('color(') ? m.map((v) => Math.round(v * 255)) : m).slice(0, 3)
}

// The border: each stitch 3 dots long where the border has its full width, 2 where it's narrower
function drawBorder(el: HTMLElement, canvas: HTMLCanvasElement, border: Border) {
  if (!el.offsetWidth) {
    canvas.width = canvas.height = 0
    canvas.style.width = canvas.style.height = '0'
    return
  }
  const { w, h: tile, dots } = borderDots(border, el.offsetWidth >= 128 ? 3 : 2)
  const h = Math.floor(el.offsetHeight / PX)
  canvas.width = w
  canvas.height = h
  canvas.style.width = `${w * PX}px`
  canvas.style.height = `${h * PX}px`
  const ctx = canvas.getContext('2d')!
  const out = ctx.createImageData(w, h)
  const ink = [...rgb('--border-ink'), 255]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) if (dots[(y % tile) * w + x]) out.data.set(ink, (y * w + x) * 4)
  }
  ctx.putImageData(out, 0, 0)
}

// The background: a wash from the page colour into the two tints, denser down the window and
// towards the sides. Where the border shows, it sits on a plain strip of page colour and the
// dots start just inside it, fading in.
function drawBackground(canvas: HTMLCanvasElement, borderSpan: number) {
  const w = Math.ceil(innerWidth / PX), h = Math.ceil(innerHeight / PX)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const out = ctx.createImageData(w, h)
  const cols = ['--linen', '--tint-1', '--tint-2'].map((name) => [...rgb(name), 255])
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
  const trim = borderSpan ? (1.5 * rem + borderSpan) / PX : 0
  const fadeIn = (3 * rem) / PX
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = Math.min(x, w - 1 - x) - trim
      let k = 0
      if (edge >= 0) {
        let f = 0.06 + 0.42 * (y / h) ** 1.6 + 1.6 * Math.abs(x / w - 0.5) ** 2.2 + (noise(x / 24, y / 24) - 0.5) * 0.12
        if (trim) f *= Math.min(1, edge / fadeIn)
        f = Math.min(1, Math.max(0, f)) * 2 // 0..2 across the three colours
        const t = BAYER[y % 8][x % 8]
        k = f < 1 ? (f > t ? 1 : 0) : f - 1 > t ? 2 : 1
      }
      out.data.set(cols[k], (y * w + x) * 4)
    }
  }
  ctx.putImageData(out, 0, 0)
}

export function PageDecoration({ border }: { border: Border | null }) {
  const background = useRef<HTMLCanvasElement>(null)
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sides = [left.current, right.current].filter((el): el is HTMLDivElement => !!el)
    const draw = () => {
      if (border) for (const el of sides) drawBorder(el, el.firstElementChild as HTMLCanvasElement, border)
      const span = sides[0]?.offsetWidth ? Math.max(sides[0].offsetWidth, (sides[0].firstElementChild as HTMLElement).offsetWidth) : 0
      if (background.current) drawBackground(background.current, span)
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    const later = () => {
      clearTimeout(timer)
      timer = setTimeout(draw, 120)
    }
    draw()
    // Redraw when the window changes size, the page gets taller (fonts, images, another page)
    // or the theme changes
    addEventListener('resize', later)
    const grows = new ResizeObserver(later)
    grows.observe(document.body)
    const themes = new MutationObserver(draw)
    themes.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const scheme = matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', draw)
    return () => {
      clearTimeout(timer)
      removeEventListener('resize', later)
      grows.disconnect()
      themes.disconnect()
      scheme.removeEventListener('change', draw)
    }
  }, [border])

  return (
    <>
      <canvas ref={background} className="page-dither" aria-hidden="true" />
      {border && (
        <>
          <div ref={left} className="page-border page-border--left" aria-hidden="true">
            <canvas />
          </div>
          <div ref={right} className="page-border page-border--right" aria-hidden="true">
            <canvas />
          </div>
        </>
      )}
    </>
  )
}
