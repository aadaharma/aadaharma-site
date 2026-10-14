import { notFound } from 'next/navigation'
import { PatternArticle } from '@/components/PatternArticle'
import { LANGS, type Lang } from '@/lib/i18n'
import { patternMetadata } from '@/lib/metadata'
import { getPattern, listPatterns } from '@/lib/patterns'

// Patterns added after the build are rendered on their first visit
export const dynamicParams = true

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const lang = LANGS.find((l) => l === params.lang)
  return (await listPatterns()).filter((p) => p.lang === lang).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/[lang]/patterns/[slug]'>) {
  const { lang, slug } = await params
  const pattern = await getPattern(lang as Lang, slug)
  return pattern ? patternMetadata(lang as Lang, pattern) : {}
}

export default async function PatternPage({ params }: PageProps<'/[lang]/patterns/[slug]'>) {
  const { lang: langParam, slug } = await params
  const lang = langParam as Lang
  const pattern = await getPattern(lang, slug)
  if (!pattern) notFound()
  return <PatternArticle lang={lang} pattern={pattern} />
}
