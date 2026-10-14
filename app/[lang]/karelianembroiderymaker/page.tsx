import '@/src/styles/designer.css'
import { Designer } from '@/components/embroidery/Designer'
import { getStrings, type Lang } from '@/lib/i18n'
import { designerMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]/karelianembroiderymaker'>) {
  return designerMetadata((await params).lang as Lang)
}

export default async function DesignerPage({ params }: PageProps<'/[lang]/karelianembroiderymaker'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang)
  return <Designer lang={lang} t={t.designer} theme={t.theme} switchLabel={t.langSwitch} />
}
