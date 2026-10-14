import '@/src/styles/designer.css'
import { Designer } from '@/components/embroidery/Designer'
import { publishedTemplates } from '@/lib/embroidery/templates'
import { getStrings, type Lang } from '@/lib/i18n'
import { designerMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/karelianembroiderymaker'>) {
  return designerMetadata((await params).lang as Lang)
}

export default async function DesignerPage({ params }: PageProps<'/[lang]/karelianembroiderymaker'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang)
  // The page is rebuilt when a template is saved in the admin
  const templates = await publishedTemplates()
  return <Designer lang={lang} t={t.designer} theme={t.theme} switchLabel={t.langSwitch} templates={templates} />
}
