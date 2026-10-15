import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@/src/styles/main.css'
import '@/src/styles/admin.css'
import { Star } from '@/components/decorations'
import { themeScript } from '@/components/ThemeToggle'
import { isAdmin } from '@/lib/admin/session'
import { logout } from './actions'

export { viewport } from '@/lib/metadata'

export const metadata: Metadata = {
  title: 'Admin — aadaharma.com',
  robots: { index: false, follow: false },
}

// The admin has its own root layout: English only, no site navigation. It's left out of
// proxy.ts, so /admin/ isn't treated as an English site page.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const loggedIn = await isAdmin()
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <header className="site-header">
          <div className="site-header__inner">
            <a className="brand" href="/admin/">
              <Star size={28} />
              <span>Admin</span>
            </a>
            <nav className="site-nav" aria-label="Admin">
              <ul>
                {loggedIn && (
                  <>
                    <li>
                      <a href="/admin/">Patterns</a>
                    </li>
                    <li>
                      <a href="/admin/templates/">Templates</a>
                    </li>
                  </>
                )}
                <li>
                  <a href="/">View site</a>
                </li>
                {loggedIn && (
                  <li>
                    <form action={logout}>
                      <button type="submit" className="pill">
                        Log out
                      </button>
                    </form>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </header>
        <main id="main" className="container admin">
          {children}
        </main>
      </body>
    </html>
  )
}
