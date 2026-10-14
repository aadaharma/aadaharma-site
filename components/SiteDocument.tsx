import type { ReactNode } from 'react'
import { getStrings, type Lang } from '@/lib/i18n'
import { Footer } from './Footer'
import { Header } from './Header'
import { Reveal } from './Reveal'
import { themeScript } from './ThemeToggle'

// The page document: <html>, the theme script and fonts. Used by app/[lang]/layout.tsx
// (for the site pages and the embroidery designer) and the 404 page.
export function Document({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    // The theme script adds a class and data-theme to <html> before React hydrates
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/fonts/YesevaOne-Regular.woff" as="font" type="font/woff" crossOrigin="" />
        <link rel="preload" href="/fonts/WorkSans-Regular.woff" as="font" type="font/woff" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  )
}

// The site's header and footer around a page's content (app/[lang]/(site)/layout.tsx)
export function SiteChrome({ lang, children }: { lang: Lang; children: ReactNode }) {
  const t = getStrings(lang)
  return (
    <>
      <Header
        lang={lang}
        t={{ siteName: t.siteName, skip: t.skip, nav: t.nav, langSwitch: t.langSwitch, theme: t.theme }}
      />
      <main id="main">{children}</main>
      <Footer t={t.footer} />
      <Reveal />
    </>
  )
}

// A whole site page, for the 404 page, which has no layout around it
export function SiteDocument({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    <Document lang={lang}>
      <SiteChrome lang={lang}>{children}</SiteChrome>
    </Document>
  )
}
