import { AppFrame, StitchDivider } from '@/components/decorations'
import { getStrings, pageUrl, type Lang } from '@/lib/i18n'
import { knitMockup } from '@/lib/knit-art'
import { pageMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/knitting'>) {
  return pageMetadata((await params).lang as Lang, 'knitting')
}

export default async function KnittingPage({ params }: PageProps<'/[lang]/knitting'>) {
  const lang = (await params).lang as Lang
  const strings = getStrings(lang)
  const t = strings.knitting

  return (
    <>
      <section className="hero container">
        <div className="hero__text">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p className="lead">{t.lead}</p>
        </div>
        <AppFrame url="aadaharma.com/knitting" svg={knitMockup(strings.home.knittingCard.mockupAlt)} />
      </section>

      <StitchDivider />

      <section className="container section made" aria-labelledby="plans-title">
        <figure className="reveal">
          <img className="photo knit-photo" src="/img/sock.webp" alt={t.photoAlt} width={900} height={900} loading="lazy" />
          <figcaption>{t.photoCaption}</figcaption>
        </figure>
        <div className="prose reveal">
          <h2 id="plans-title">{t.plansTitle}</h2>
          <ul className="stitch-list">
            {t.plans.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <a href={pageUrl(lang, 'patterns')}>{t.meanwhile} →</a>
          </p>
        </div>
      </section>
    </>
  )
}
