import { AppFrame, Star, StitchDivider } from '@/components/decorations'
import { getStrings, pageUrl, type Lang } from '@/lib/i18n'
import { knitMockup, libraryMockup } from '@/lib/knit-art'
import { pageMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  return pageMetadata((await params).lang as Lang, 'home')
}

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).home

  return (
    <>
      <section className="hero container">
        <div className="hero__text">
          {/* The home page has no eyebrow text; the empty line keeps the hero's spacing */}
          <p className="eyebrow" />
          <h1>{t.title}</h1>
          <p className="lead">{t.lead}</p>
          <a className="button" href={pageUrl(lang, 'embroidery')}>
            {t.cta} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="hero__art" aria-hidden="true">
          <Star size={260} />
        </div>
      </section>

      <StitchDivider />

      <section className="container section" aria-labelledby="projects-title">
        <h2 id="projects-title">{t.projectsTitle}</h2>
        <div className="card-grid">
          <article className="card reveal">
            <div className="card__media">
              <AppFrame url="aadaharma.com/karelianembroiderymaker">
                <img src="/img/designer.webp" alt="" width={500} height={254} loading="lazy" />
              </AppFrame>
            </div>
            <div className="card__body">
              <p className="tag tag--ready">{t.embroideryCard.tag}</p>
              <h3>
                <a className="card__link" href={pageUrl(lang, 'embroidery')}>
                  {t.embroideryCard.title}
                </a>
              </h3>
              <p>{t.embroideryCard.text}</p>
              <p className="card__more" aria-hidden="true">
                {t.embroideryCard.link} →
              </p>
            </div>
          </article>
          <article className="card reveal">
            <div className="card__media">
              <AppFrame url="aadaharma.com/knitting" svg={knitMockup(t.knittingCard.mockupAlt)} />
            </div>
            <div className="card__body">
              <p className="tag tag--soon">{t.knittingCard.tag}</p>
              <h3>
                <a className="card__link" href={pageUrl(lang, 'knitting')}>
                  {t.knittingCard.title}
                </a>
              </h3>
              <p>{t.knittingCard.text}</p>
              <p className="card__more" aria-hidden="true">
                {t.knittingCard.link} →
              </p>
            </div>
          </article>
          <article className="card reveal">
            <div className="card__media">
              <AppFrame url="aadaharma.com/patterns" svg={libraryMockup(t.patternsCard.mockupAlt)} />
            </div>
            <div className="card__body">
              <p className="tag tag--ready">{t.patternsCard.tag}</p>
              <h3>
                <a className="card__link" href={pageUrl(lang, 'patterns')}>
                  {t.patternsCard.title}
                </a>
              </h3>
              <p>{t.patternsCard.text}</p>
              <p className="card__more" aria-hidden="true">
                {t.patternsCard.link} →
              </p>
            </div>
          </article>
        </div>
      </section>

      <section id="about" className="container section about" aria-labelledby="about-title">
        <div className="about__text reveal">
          <h2 id="about-title">{t.about.title}</h2>
          {t.about.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <img
          className="photo about__photo reveal"
          src="/img/portrait.webp"
          alt={t.about.portraitAlt}
          width={776}
          height={776}
          loading="lazy"
        />
      </section>
    </>
  )
}
