import type { Strings } from '@/lib/i18n'

export function Footer({ t }: { t: Strings['footer'] }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <h2 className="site-footer__title">{t.contactTitle}</h2>
          <ul className="contact-list">
            <li>
              {t.email}: <a href="mailto:aada.harma@protonmail.com">aada.harma@protonmail.com</a>
            </li>
            <li>
              {t.github}: <a href="https://github.com/aadaharma">github.com/aadaharma</a>
            </li>
          </ul>
        </div>
        <p className="site-footer__made">© {new Date().getFullYear()} Aada Härmä</p>
      </div>
    </footer>
  )
}
