import { notFound } from 'next/navigation'
import '@/src/styles/main.css'
import { SiteDocument } from '@/components/SiteDocument'
import { isLang, LANGS } from '@/lib/i18n'

export { viewport } from '@/lib/metadata'

export const generateStaticParams = () => LANGS.map((lang) => ({ lang }))

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params
  if (!isLang(lang)) notFound()
  return <SiteDocument lang={lang}>{children}</SiteDocument>
}
