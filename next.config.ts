import type { NextConfig } from 'next'

// The Karelian Embroidery Designer is its own repo (aadaharma/karelianembroiderymaker)
// and its own Vercel project. It's served under aadaharma.com from there.
const EMBROIDERY_APP_PATH = '/karelianembroiderymaker'
const EMBROIDERY_APP_ORIGIN = 'https://karelianembroiderymaker.vercel.app'

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: `${EMBROIDERY_APP_PATH}/`, destination: `${EMBROIDERY_APP_ORIGIN}/` },
        { source: `${EMBROIDERY_APP_PATH}/:path+`, destination: `${EMBROIDERY_APP_ORIGIN}/:path+` },
      ],
    }
  },
  // Pages live at /patterns/ etc., as they did on GitHub Pages
  trailingSlash: true,
  // app/global-not-found.tsx: the root layout is under app/[lang], see that file
  experimental: { globalNotFound: true },
  // Don't pick up lockfiles from folders above the repo
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
