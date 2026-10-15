import { Footer } from '@/components/Footer'
import { getStrings, type Lang } from '@/lib/i18n'

// The home page is a picture with no words, so it has no header (and no language switch):
// just the picture and the footer
export default async function HomeLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const t = getStrings((await params).lang as Lang)
  return (
    <>
      <main id="main">{children}</main>
      <Footer t={t.footer} />
    </>
  )
}
