import '@/src/styles/main.css'
import { NotFoundContent } from '@/components/NotFoundContent'
import { SiteDocument } from '@/components/SiteDocument'
import { notFoundMetadata } from '@/lib/metadata'

export { viewport } from '@/lib/metadata'
export const metadata = notFoundMetadata()

// The 404 page for addresses that match no route. The root layout sits under app/[lang],
// so Next.js needs this file to render the page around it.
export default function GlobalNotFound() {
  return (
    <SiteDocument lang="en">
      <NotFoundContent />
    </SiteDocument>
  )
}
