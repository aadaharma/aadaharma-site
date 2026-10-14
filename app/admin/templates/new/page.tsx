import '@/src/styles/designer.css'
import { TemplateEditor } from '@/components/embroidery/TemplateEditor'
import { requireAdmin } from '@/lib/admin/session'
import { CATEGORIES } from '@/lib/embroidery/motifs'
import { getStrings } from '@/lib/i18n'

export default async function NewTemplatePage() {
  await requireAdmin()
  return (
    <>
      <p className="crumbs">
        <a href="/admin/templates/">← All templates</a>
      </p>
      <h1>New template</h1>
      <TemplateEditor
        id={null}
        initial={{ nameEn: '', nameFi: '', category: CATEGORIES[0].id, published: false, pageBorder: false }}
        motif={null}
        t={getStrings('en').designer}
      />
    </>
  )
}
