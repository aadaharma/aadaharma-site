import type { ReactNode } from 'react'
import { getStrings, type Lang } from '@/lib/i18n'
import { Footer } from './Footer'
import { Header } from './Header'
import { Reveal } from './Reveal'
import { themeScript } from './ThemeToggle'

// The whole page around the content: used by app/[lang]/layout.tsx and the 404 page
export function SiteDocument({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = getStrings(lang)
  return (
    // The theme script adds a class and data-theme to <html> before React hydrates
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/fonts/YesevaOne-Regular.woff" as="font" type="font/woff" crossOrigin="" />
        <link rel="preload" href="/fonts/WorkSans-Regular.woff" as="font" type="font/woff" crossOrigin="" />
      </head>
      <body>
        <Header
          lang={lang}
          t={{ siteName: t.siteName, skip: t.skip, nav: t.nav, langSwitch: t.langSwitch, theme: t.theme }}
        />
        <main id="main">{children}</main>
        <Footer t={t.footer} />
        <Reveal />
      </body>
    </html>
  )
}
