import { notFound } from 'next/navigation'
import '@/src/styles/main.css'
import { Document } from '@/components/SiteDocument'
import { isLang, LANGS } from '@/lib/i18n'

export { viewport } from '@/lib/metadata'

export const generateStaticParams = () => LANGS.map((lang) => ({ lang }))

// The site pages are in (site), with the header and footer; the embroidery designer
// (karelianembroiderymaker) fills the screen with its own bar instead
export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <Document lang={lang}>{children}</Document>
}
