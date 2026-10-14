import { AppFrame, Star } from '@/components/decorations'
import { designerUrl, getStrings, type Lang } from '@/lib/i18n'
import { pageMetadata } from '@/lib/metadata'


export async function generateMetadata({ params }: PageProps<'/[lang]/embroidery'>) {
  return pageMetadata((await params).lang as Lang, 'embroidery')
}

export default async function EmbroideryPage({ params }: PageProps<'/[lang]/embroidery'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).embroidery

  return (
    <>
      <section className="hero container">
        <div className="hero__text">
          {/* No eyebrow text; the empty line keeps the hero's spacing */}
          <p className="eyebrow" />
          <h1>{t.title}</h1>
          <p className="lead">{t.lead}</p>
          <a className="button" href={designerUrl(lang)}>
            {t.cta} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <AppFrame url="aadaharma.com/karelianembroiderymaker">
          <img src="/img/designer.webp" alt={t.screenshotAlt} width={500} height={254} fetchPriority="high" />
        </AppFrame>
      </section>


      <section className="container section two-col">
        <div className="panel reveal">
          <h2>{t.featuresTitle}</h2>
          <ul className="stitch-list">
            {t.features.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel reveal">
          <h2>{t.plannedTitle}</h2>
          <ul className="stitch-list">
            {t.planned.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container section made" aria-labelledby="tradition-title">
        <figure className="reveal">
          <img className="photo" src="/img/bookmark.webp" alt={t.photoAlt} width={1200} height={688} loading="lazy" />
        </figure>
        <div className="prose reveal">
          <h2 id="tradition-title">{t.traditionTitle}</h2>
          <p>{t.tradition}</p>
        </div>
      </section>

      <section className="container section closing reveal">
        <Star size={64} />
        <h2>{t.closingTitle}</h2>
        <a className="button" href={designerUrl(lang)}>
          {t.cta} <span aria-hidden="true">↗</span>
        </a>
      </section>
    </>
  )
}
