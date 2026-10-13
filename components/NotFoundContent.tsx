import { getStrings } from '@/lib/i18n'
import { Star } from './decorations'

// 404 text, in English with a line in Finnish, as on GitHub Pages
export function NotFoundContent() {
  const t = getStrings('en').notfound
  return (
    <section className="container section closing">
      <Star size={96} />
      <h1>{t.title}</h1>
      <p>{t.text}</p>
      <p>
        <a className="button" href="/">
          {t.back}
        </a>
      </p>
      <p lang="fi">
        {t.fiText} <a href="/fi/">{t.fiBack}</a>
      </p>
    </section>
  )
}
