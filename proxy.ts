import { NextResponse, type NextRequest } from 'next/server'

// English pages have no language prefix (/patterns/), Finnish ones start with /fi/.
// The app keeps both under app/[lang], so English addresses are rewritten to /en/...,
// and /en/... itself redirects to the unprefixed address.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(3) || '/'
    return NextResponse.redirect(url, 308)
  }
  if (pathname === '/fi' || pathname.startsWith('/fi/')) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/en${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Skip Next.js internals, files (fonts, images, favicon) and the admin (app/admin, its own root layout)
  matcher: ['/((?!_next/|api/|admin(?:/|$)|.*\\.[\\w]+$).*)'],
}
