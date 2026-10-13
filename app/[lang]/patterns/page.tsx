import { AppFrame, StitchDivider } from '@/components/decorations'
import { PatternLibrary, type PatternCard } from '@/components/PatternLibrary'
import { getStrings, type Lang } from '@/lib/i18n'
import { starPair } from '@/lib/knit-art'
import { pageMetadata } from '@/lib/metadata'
import { facets, listPatterns } from '@/lib/patterns'

export async function generateMetadata({ params }: PageProps<'/[lang]/patterns'>) {
  return pageMetadata((await params).lang as Lang, 'patterns')
}

export default async function PatternsPage({ params }: PageProps<'/[lang]/patterns'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).patterns
  const patterns = await listPatterns()
  // Only what the cards need goes to the browser, not the pattern text
  const cards: PatternCard[] = patterns.map(
    ({ slug, lang, url, title, summary, craft, difficulty, yarnWeight, cover, swatch }) => ({
      slug, lang, url, title, summary, craft, difficulty, yarnWeight, cover, swatch,
    }),
  )

  return (
    <>
      <section className="hero container">
        <div className="hero__text">
          {/* No eyebrow text; the empty line keeps the hero's spacing */}
          <p className="eyebrow" />
          <h1>{t.title}</h1>
          <p className="lead">{t.lead}</p>
        </div>
        <AppFrame url={t.heroCaption} svg={starPair()} />
      </section>

      <StitchDivider />

      <section className="container section" aria-labelledby="library-title">
        <h2 id="library-title" className="visually-hidden">
          {t.listTitle}
        </h2>
        <PatternLibrary lang={lang} t={t} patterns={cards} facets={facets(patterns)} />
      </section>
    </>
  )
}
