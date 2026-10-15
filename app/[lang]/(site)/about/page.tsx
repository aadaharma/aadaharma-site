import { hasCv } from '@/lib/cv'
import { CV_PATH, getStrings, type Lang } from '@/lib/i18n'
import { pageMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/about'>) {
  return pageMetadata((await params).lang as Lang, 'about')
}

export default async function AboutPage({ params }: PageProps<'/[lang]/about'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).about
  return (
    <section className="container about-page">
      {/* Aada in her own red and white embroidery hoop, cut out of a photo of it */}
      <img className="about-page__portrait" src="/img/portrait-hoop.webp" alt={t.portraitAlt} width={778} height={970} />
      <div className="about-page__story">
        <h1>{t.title}</h1>
        <p className="lead">{t.lead}</p>
        {t.paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {hasCv() && (
          <a className="button about-page__cv" href={CV_PATH} download>
            <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
              <path d="M9 2V12M4.5 8L9 12.5 13.5 8M3 16H15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t.cv} <small>PDF</small>
          </a>
        )}
      </div>
    </section>
  )
}
