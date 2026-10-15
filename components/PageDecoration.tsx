'use client'

import { useEffect, useRef } from 'react'
import { onThemeChange, rgb } from '@/lib/dither'
import { borderDots, type Border } from '@/lib/embroidery/border'

// The page border, drawn as dots on a 3 px grid like cross-stitch on the linen. Its colour
// comes from the palette (--border-ink), so it follows the theme. Styled in src/styles/base.css.
const PX = 3

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

export function PageDecoration({ border }: { border: Border | null }) {
  const left = useRef<HTMLDivElement>(null)
  const right = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sides = [left.current, right.current].filter((el): el is HTMLDivElement => !!el)
    const draw = () => {
      if (border) for (const el of sides) drawBorder(el, el.firstElementChild as HTMLCanvasElement, border)
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
    const stopThemes = onThemeChange(draw)
    return () => {
      clearTimeout(timer)
      removeEventListener('resize', later)
      grows.disconnect()
      stopThemes()
    }
  }, [border])

  if (!border) return null
  return (
    <>
      <div ref={left} className="page-border page-border--left" aria-hidden="true">
        <canvas />
      </div>
      <div ref={right} className="page-border page-border--right" aria-hidden="true">
        <canvas />
      </div>
    </>
  )
}
