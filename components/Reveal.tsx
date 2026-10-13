'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Fade sections in as they scroll into view (the .reveal styles are in components.css)
export function Reveal() {
  const pathname = usePathname()

  useEffect(() => {
    const revealables = document.querySelectorAll('.reveal:not(.is-visible)')
    if (!('IntersectionObserver' in window)) {
      revealables.forEach((el) => el.classList.add('is-visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    revealables.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])

  return null
}
