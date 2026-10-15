import { HillsScene, type SceneLink } from '@/components/home/HillsScene'
import { hasCv } from '@/lib/cv'
import { CV_PATH, designerUrl, getStrings, pageUrl, yokeUrl, type Lang } from '@/lib/i18n'
import type { CreatureKey } from '@/lib/home/creatures'
import { pageMetadata } from '@/lib/metadata'

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  return pageMetadata((await params).lang as Lang, 'home')
}

export default async function HomePage({ params }: PageProps<'/[lang]'>) {
  const lang = (await params).lang as Lang
  const t = getStrings(lang).home
  const links: Record<CreatureKey, SceneLink> = {
    embroidery: { href: designerUrl(lang) },
    knitting: { href: yokeUrl(lang) },
    patterns: { href: pageUrl(lang, 'patterns') },
    about: { href: pageUrl(lang, 'about') },
    cv: hasCv() ? { href: CV_PATH, download: true } : null,
  }
  return (
    <>
      <h1 className="visually-hidden">{t.title}</h1>
      <HillsScene label={t.sceneLabel} words={t.creatures} links={links} />
    </>
  )
}
