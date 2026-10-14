import { SiteChrome } from '@/components/SiteDocument'
import type { Lang } from '@/lib/i18n'

export default async function SiteLayout({ children, params }: LayoutProps<'/[lang]'>) {
  return <SiteChrome lang={(await params).lang as Lang}>{children}</SiteChrome>
}
