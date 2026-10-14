import { getStrings, pageUrl, type Lang } from '@/lib/i18n'
import { renderBody, type Pattern } from '@/lib/patterns'
import { PrintButton } from './PrintButton'

const SPECS = ['sizes', 'yarn', 'needles', 'gauge', 'notions'] as const satisfies (keyof Pattern)[]

// A pattern as its page shows it: used by the pattern page and the admin preview
export function PatternArticle({ lang, pattern }: { lang: Lang; pattern: Pattern }) {
  const t = getStrings(lang).pattern
  const eyebrow = [pattern.craft, pattern.difficulty, pattern.yarnWeight].filter(Boolean).join(' · ')

  return (
    <article className="container pattern">
      <div className="pattern-head">
        <div>
          <p className="crumbs no-print">
            <a href={pageUrl(lang, 'patterns')}>← {t.back}</a>
          </p>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{pattern.title}</h1>
          {pattern.summary && <p className="lead">{pattern.summary}</p>}
          <div className="actions no-print">
            <PrintButton label={t.print} />
            {pattern.pdf && (
              <a className="button button--quiet" href={pattern.pdf} download>
                {t.pdf}
              </a>
            )}
          </div>
        </div>
        <table className="spec">
          <tbody>
            {SPECS.filter((key) => pattern[key]).map((key) => (
              <tr key={key}>
                <th scope="row">{t.specs[key]}</th>
                <td>{pattern[key]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pattern.cover && <img className="photo pattern__cover" src={pattern.cover} alt={pattern.coverAlt ?? ''} />}
      <div className="pattern-body prose" dangerouslySetInnerHTML={{ __html: renderBody(pattern, t.chartLabel) }} />
    </article>
  )
}
