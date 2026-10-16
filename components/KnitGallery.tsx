'use client'

import { useRef, useState } from 'react'
import type { Lang, Strings } from '@/lib/i18n'
import type { KnitPhoto } from '@/lib/knits'

// Photos of Aada's knits, side by side in a strip that snaps to one photo at a time:
// swipe on a phone, or use the arrows and dots.
export function KnitGallery({ lang, t, photos }: { lang: Lang; t: Strings['patterns']['gallery']; photos: KnitPhoto[] }) {
  const strip = useRef<HTMLUListElement>(null)
  const [current, setCurrent] = useState(0)

  const go = (i: number) => {
    const el = strip.current
    if (!el) return
    const n = (i + photos.length) % photos.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = strip.current
    if (el) setCurrent(Math.round(el.scrollLeft / el.clientWidth))
  }

  const label = (i: number) => t.photo.replace('{n}', String(i + 1)).replace('{total}', String(photos.length))

  return (
    <section className="knit-gallery" aria-roledescription="carousel" aria-label={t.label}>
      <ul className="knit-gallery__strip" ref={strip} onScroll={onScroll} tabIndex={0}>
        {photos.map((p, i) => (
          <li key={p.src} aria-roledescription="slide" aria-label={label(i)}>
            <img
              src={p.src}
              alt={p.alt[lang]}
              style={p.focus ? { objectPosition: p.focus } : undefined}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </li>
        ))}
      </ul>
      {photos.length > 1 && (
        <div className="knit-gallery__controls">
          <button type="button" className="knit-gallery__arrow" onClick={() => go(current - 1)} aria-label={t.previous}>
            ‹
          </button>
          <span className="knit-gallery__dots">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                aria-label={label(i)}
                aria-current={i === current}
                onClick={() => go(i)}
              />
            ))}
          </span>
          <button type="button" className="knit-gallery__arrow" onClick={() => go(current + 1)} aria-label={t.next}>
            ›
          </button>
        </div>
      )}
    </section>
  )
}
