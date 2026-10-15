// Languages, page addresses and strings. English pages have no prefix (/patterns/),
// Finnish ones live under /fi/. proxy.ts maps the unprefixed English URLs onto app/[lang].
import en from '@/src/i18n/en.json'
import fi from '@/src/i18n/fi.json'

export const LANGS = ['en', 'fi'] as const
export type Lang = (typeof LANGS)[number]
export type Strings = typeof en

export const PAGES = ['home', 'embroidery', 'knitting', 'patterns', 'about'] as const
export type Page = (typeof PAGES)[number]

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aadaharma.com'

const strings: Record<Lang, Strings> = { en, fi }

export const isLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value)
export const getStrings = (lang: Lang) => strings[lang]
export const otherLang = (lang: Lang): Lang => (lang === 'en' ? 'fi' : 'en')

export const pageUrl = (lang: Lang, page: Page) =>
  (lang === 'en' ? '' : `/${lang}`) + (page === 'home' ? '/' : `/${page}/`)

export const patternUrl = (lang: Lang, slug: string) => `${pageUrl(lang, 'patterns')}${slug}/`

// The embroidery designer, which has its own layout (app/[lang]/karelianembroiderymaker)
export const designerUrl = (lang: Lang) => (lang === 'en' ? '' : `/${lang}`) + '/karelianembroiderymaker/'

// The round yoke sweater calculator, under the Knitting page
export const yokeUrl = (lang: Lang) => `${pageUrl(lang, 'knitting')}round-yoke/`

// Aada's CV in each language, linked from the home page and the About page once the PDF is in public/
export const cvPath = (lang: Lang) => `/cv/aada-harma-cv-${lang}.pdf`
