'use client'

import { usePathname } from 'next/navigation'
import { otherLang, pageUrl, PAGES, yokeUrl, type Lang, type Page, type Strings } from '@/lib/i18n'
import { Star } from './decorations'

// Which page the address belongs to: /fi/patterns/selbu/ -> pattern, /knitting/ -> knitting
function currentPage(pathname: string): Page | 'pattern' | 'yoke' | null {
  const parts = pathname.split('/').filter(Boolean)
  // English pages are at /en/... inside the app (proxy.ts maps them there), Finnish at /fi/...
  if (parts[0] === 'fi' || parts[0] === 'en') parts.shift()
  if (parts.length === 0) return 'home'
  if (parts[0] === 'patterns' && parts[1]) return 'pattern'
  if (parts[0] === 'knitting' && parts[1] === 'round-yoke') return 'yoke'
  return (PAGES as readonly string[]).includes(parts[0]) && parts.length === 1 ? (parts[0] as Page) : null
}

type Props = {
  lang: Lang
  t: Pick<Strings, 'siteName' | 'skip' | 'nav' | 'langSwitch' | 'theme'>
}

export function Header({ lang, t }: Props) {
  const page = currentPage(usePathname())
  const urls = Object.fromEntries(PAGES.map((p) => [p, pageUrl(lang, p)])) as Record<Page, string>
  // Pattern pages exist in one language only, so the switch goes to the other library;
  // unknown addresses go to the other home page
  const switchUrl =
    page === 'pattern'
      ? pageUrl(otherLang(lang), 'patterns')
      : page === 'yoke'
        ? yokeUrl(otherLang(lang))
        : pageUrl(otherLang(lang), page ?? 'home')
  const current = (...pages: (Page | 'pattern' | 'yoke')[]) =>
    page && pages.includes(page) ? ({ 'aria-current': 'page' } as const) : {}

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href={urls.home}>
            <Star size={28} />
            <span>{t.siteName}</span>
          </a>
          <nav className="site-nav" aria-label={t.nav.label}>
            <ul>
              <li>
                <a href={urls.embroidery} {...current('embroidery')}>
                  {t.nav.embroidery}
                </a>
              </li>
              <li>
                <a href={urls.knitting} {...current('knitting', 'yoke')}>
                  {t.nav.knitting}
                </a>
              </li>
              <li>
                <a href={urls.patterns} {...current('patterns', 'pattern')}>
                  {t.nav.patterns}
                </a>
              </li>
              <li>
                <a href={`${urls.home}#about`}>{t.nav.about}</a>
              </li>
              <li>
                <a className="pill" href={switchUrl} hrefLang={t.langSwitch.lang} lang={t.langSwitch.lang}>
                  <span className="visually-hidden">{t.langSwitch.label}</span>
                  <span aria-hidden="true">{t.langSwitch.short}</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
