import type { Metadata, Viewport } from 'next'
import { designerUrl, getStrings, LANGS, pageUrl, SITE_URL, type Lang, type Page } from './i18n'

const OG_IMAGE = '/img/bookmark.webp'

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6ece0' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1410' },
  ],
}

type Meta = { title: string; description: string; path: string | null; alternates?: Record<string, string> }

function build({ title, description, path, alternates }: Meta): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: path ? { canonical: path, languages: alternates } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [OG_IMAGE],
      ...(path ? { url: path } : {}),
    },
  }
}

// A site page, with links to the same page in both languages
export function pageMetadata(lang: Lang, page: Page): Metadata {
  const t = getStrings(lang)[page]
  return build({
    title: t.metaTitle,
    description: t.description,
    path: pageUrl(lang, page),
    alternates: Object.fromEntries(LANGS.map((l) => [l, pageUrl(l, page)])),
  })
}

export function designerMetadata(lang: Lang): Metadata {
  const t = getStrings(lang).designer
  return build({
    title: t.metaTitle,
    description: t.description,
    path: designerUrl(lang),
    alternates: Object.fromEntries(LANGS.map((l) => [l, designerUrl(l)])),
  })
}

// A pattern exists in one language only, so it has no alternates
export function patternMetadata(lang: Lang, pattern: { title: string; summary?: string; url: string }): Metadata {
  return build({
    title: `${pattern.title} — ${getStrings(lang).siteName}`,
    description: pattern.summary ?? '',
    path: pattern.url,
  })
}

export function notFoundMetadata(): Metadata {
  const t = getStrings('en').notfound
  return build({ title: t.metaTitle, description: t.description, path: null })
}
