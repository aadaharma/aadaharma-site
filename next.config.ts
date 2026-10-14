import type { NextConfig } from 'next'


const nextConfig: NextConfig = {
  // Pages live at /patterns/ etc., as they did on GitHub Pages
  trailingSlash: true,
  // app/global-not-found.tsx: the root layout is under app/[lang], see that file
  experimental: { globalNotFound: true },
  // Don't pick up lockfiles from folders above the repo
  outputFileTracingRoot: import.meta.dirname,
}

export default nextConfig
