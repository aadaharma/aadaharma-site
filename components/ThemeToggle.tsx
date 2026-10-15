'use client'

import { useEffect, useState } from 'react'
import type { Strings } from '@/lib/i18n'

type Theme = 'auto' | 'light' | 'dark'
const ORDER: Theme[] = ['auto', 'light', 'dark']

// Runs as an inline script in the <head> (see components/SiteDocument.tsx). Dark mode is
// switched off for now: pages are always light (data-theme="light" on <html>) and the toggle
// isn't shown. To bring it back, put the toggle back in the header and the designer, drop
// data-theme from <html>, and read the saved theme here again:
// try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}
export const themeScript = `document.documentElement.classList.add('js')`

// Theme toggle: auto (follow the system) -> light -> dark
export function ThemeToggle({ t }: { t: Strings['theme'] }) {
  const [theme, setTheme] = useState<Theme>('auto')

  useEffect(() => {
    const saved = document.documentElement.dataset.theme
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  const next = () => {
    const value = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    if (value === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = value
    try {
      if (value === 'auto') localStorage.removeItem('theme')
      else localStorage.setItem('theme', value)
    } catch {}
    setTheme(value)
  }

  const name = t[theme]
  return (
    <button type="button" className="pill theme-toggle" aria-label={`${t.label}: ${name}`} onClick={next}>
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" />
      </svg>
      <span>{name}</span>
    </button>
  )
}
