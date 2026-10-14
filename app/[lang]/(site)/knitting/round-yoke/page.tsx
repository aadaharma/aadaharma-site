import '@/src/styles/calculator.css'
import { YokeCalculator } from '@/components/knitting/YokeCalculator'
import { getStrings, pageUrl, type Lang } from '@/lib/i18n'
import { yokeMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/knitting/round-yoke'>) {
  return yokeMetadata((await params).lang as Lang)
}

// The round yoke sweater calculator; the maths is in lib/knitting/yoke.ts
export default async function RoundYokePage({ params }: PageProps<'/[lang]/knitting/round-yoke'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).yoke
  return (
    <div className="container calc-page">
      <p className="crumbs">
        <a href={pageUrl(lang, 'knitting')}>← {t.back}</a>
      </p>
      <h1>{t.title}</h1>
      <p className="lead">{t.lead}</p>
      <YokeCalculator t={t} lang={lang} />
    </div>
  )
}
