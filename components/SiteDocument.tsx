import type { ReactNode } from 'react'
import { getStrings, type Lang } from '@/lib/i18n'
import { Footer } from './Footer'
import { Header } from './Header'
import { PageBorder } from './PageBorder'
import { Reveal } from './Reveal'
import { themeScript } from './ThemeToggle'

// The page document: <html>, the theme script and fonts. Used by app/[lang]/layout.tsx
// (for the site pages and the embroidery designer) and the 404 page.
export function Document({ lang, children }: { lang: Lang; children: ReactNode }) {
  return (
    // The head script adds the js class to <html> before React hydrates
    // data-theme="light": dark mode is switched off for now, even if the system is dark
    // data-scroll-behavior: the CSS scrolls smoothly, which Next.js turns off while changing pages
    <html lang={lang} suppressHydrationWarning data-scroll-behavior="smooth" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preload" href="/fonts/YoungSerif-Regular.woff2" as="font" type="font/woff2" crossOrigin="" />
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
      <PageBorder />
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
