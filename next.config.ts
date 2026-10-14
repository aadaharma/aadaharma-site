import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Pages live at /patterns/ etc., as they did on GitHub Pages
  trailingSlash: true,
  experimental: {
    // app/global-not-found.tsx: the root layout is under app/[lang], see that file
    globalNotFound: true,
    // A template drawn over a whole page (200 × 400 cells) can be several hundred kB when
    // saved; 4 MB stays under Vercel's 4.5 MB request limit
    serverActions: { bodySizeLimit: '4mb' },
  },
  // Don't pick up lockfiles from folders above the repo
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
