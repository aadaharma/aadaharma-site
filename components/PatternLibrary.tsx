'use client'

import { useState } from 'react'
import type { Lang, Strings } from '@/lib/i18n'
import type { Facet } from '@/lib/patterns'
import { Star } from './decorations'

export type PatternCard = {
  slug: string
  lang: Lang
  url: string
  title: string
  summary?: string
  craft?: string
  difficulty?: string
  yarnWeight?: string
  cover?: string
  swatch?: string
}

type Props = {
  lang: Lang
  t: Strings['patterns']
  patterns: PatternCard[]
  facets: Facet[]
}

// Pattern library with filters: one choice per group, pressing it again clears it
export function PatternLibrary({ lang, t, patterns, facets }: Props) {
  const [active, setActive] = useState<Partial<Record<Facet['key'], string>>>({})

  if (patterns.length === 0) {
    return (
      <div className="empty">
        <Star size={48} />
        <p>{t.comingSoon}</p>
      </div>
    )
  }

  const matches = (p: PatternCard) =>
    Object.entries(active).every(([key, value]) => p[key as Facet['key']] === value)
  const shown = patterns.filter(matches).length

  const toggle = (key: Facet['key'], value: string) =>
    setActive(({ [key]: current, ...rest }) => (current === value ? rest : { ...rest, [key]: value }))

  return (
    <>
      {facets.length > 0 && (
        <div className="filters" data-filters>
          {facets.map((facet) => (
            <div key={facet.key} className="filter-row" role="group" aria-label={t.filters[facet.key]}>
              <span className="filter-row__label" aria-hidden="true">
                {t.filters[facet.key]}
              </span>
              {facet.values.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip"
                  aria-pressed={active[facet.key] === value}
                  onClick={() => toggle(facet.key, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ))}
          <p className="result-count" aria-live="polite">
            {t.count.replace('{shown}', String(shown)).replace('{total}', String(patterns.length))}
          </p>
        </div>
      )}
      <div className="pattern-grid">
        {patterns.map((p) => (
          <article key={p.url} className="card pattern-card" hidden={!matches(p)}>
            {p.cover ? (
              <img className="pattern-card__cover" src={p.cover} alt="" loading="lazy" />
            ) : (
              <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: p.swatch ?? '' }} />
            )}
            <div className="card__body">
              <ul className="meta-chips">
                {p.craft && <li>{p.craft}</li>}
                {p.difficulty && <li>{p.difficulty}</li>}
                {p.yarnWeight && <li>{p.yarnWeight}</li>}
                {p.lang !== lang && <li lang={lang}>{t.languages[p.lang]}</li>}
              </ul>
              <h3>
                <a className="card__link" href={p.url} hrefLang={p.lang}>
                  <span lang={p.lang}>{p.title}</span>
                </a>
              </h3>
              {p.summary && <p lang={p.lang}>{p.summary}</p>}
              <p className="card__more" aria-hidden="true">
                {t.read} →
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="empty" hidden={shown > 0}>
        {t.noMatches}{' '}
        <button type="button" className="chip" onClick={() => setActive({})}>
          {t.clearFilters}
        </button>
      </p>
    </>
  )
}
