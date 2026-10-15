'use client'

import { useEffect, useRef } from 'react'
import { onThemeChange, rgb } from '@/lib/dither'

// The home page's hero photo: a small grey photo (public/img/hero-knitting.png, made from
// public/img/ditherthis.jpg) Atkinson-dithered into the palette's dark, middle and light
// colours (--dith-dark, --dith-mid, --dith-light), drawn at its own size and shown twice as big
const SRC = '/img/hero-knitting.png'
const WIDTH = 220
const HEIGHT = 210

const lum = ([r, g, b]: number[]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255

function draw(canvas: HTMLCanvasElement, grey: Float32Array) {
  const { width: w, height: h } = canvas
  const cols = ['--dith-dark', '--dith-mid', '--dith-light'].map(rgb)
  const lo = lum(cols[0]), hi = lum(cols[2])
  // Each colour stands for its own lightness, so the middle colour sits where it really is in the tones
  const levels = cols.map((c) => Math.min(1, Math.max(0, (lum(c) - lo) / (hi - lo || 1))))
  const v = grey.slice()
  const ctx = canvas.getContext('2d')!
  const out = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      let k = 0
      for (let j = 1; j < 3; j++) if (Math.abs(levels[j] - v[i]) < Math.abs(levels[k] - v[i])) k = j
      // Atkinson: pass on 6/8 of the error, to the next two dots and three below, and one two rows down
      const e = (v[i] - levels[k]) / 8
      for (const [dx, dy] of [[1, 0], [2, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) {
        const xx = x + dx, yy = y + dy
        if (xx >= 0 && xx < w && yy < h) v[yy * w + xx] += e
      }
      out.data.set([...cols[k], 255], i * 4)
    }
  }
  ctx.putImageData(out, 0, 0)
}

export function HeroDither({ alt }: { alt: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let grey: Float32Array | null = null
    const redraw = () => grey && canvas.current && draw(canvas.current, grey)
    const img = new Image()
    img.onload = () => {
      const scratch = document.createElement('canvas')
      scratch.width = WIDTH
      scratch.height = HEIGHT
      const ctx = scratch.getContext('2d')!
      ctx.drawImage(img, 0, 0, WIDTH, HEIGHT)
      const d = ctx.getImageData(0, 0, WIDTH, HEIGHT).data
      grey = new Float32Array(WIDTH * HEIGHT)
      for (let i = 0; i < grey.length; i++) grey[i] = d[i * 4] / 255
      redraw()
    }
    img.src = SRC
    return onThemeChange(redraw)
  }, [])

  return <canvas ref={canvas} className="hero-dither" width={WIDTH} height={HEIGHT} role="img" aria-label={alt} />
}
