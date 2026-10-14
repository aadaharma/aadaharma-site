import { notFound } from 'next/navigation'
import '@/src/styles/designer.css'
import { TemplateEditor } from '@/components/embroidery/TemplateEditor'
import { requireAdmin } from '@/lib/admin/session'
import { getTemplateRow, rowToTemplate } from '@/lib/embroidery/templates'
import { designerUrl, getStrings } from '@/lib/i18n'

export default async function EditTemplatePage({ params, searchParams }: PageProps<'/admin/templates/[id]'>) {
  await requireAdmin()
  const id = Number((await params).id)
  const row = Number.isInteger(id) ? await getTemplateRow(id) : undefined
  if (!row) notFound()
  const { saved } = await searchParams

  return (
    <>
      <p className="crumbs">
        <a href="/admin/templates/">← All templates</a>
      </p>
      <div className="admin-title">
        <h1>{row.nameEn}</h1>
        {row.published && (
          <p className="admin-title__links">
            <a href={designerUrl('en')}>Open the designer</a>
          </p>
        )}
      </div>
      {saved && (
        <p className="admin-notice" role="status">
          Saved. {row.published ? 'The designer is updated.' : 'It’s a draft, so it isn’t in the designer yet.'}
          {row.pageBorder && ' It’s the page border, so the site pages are updated too.'}
        </p>
      )}
      <TemplateEditor
        id={id}
        initial={{ nameEn: row.nameEn, nameFi: row.nameFi, category: row.category, published: row.published, pageBorder: row.pageBorder }}
        motif={rowToTemplate(row).motif}
        t={getStrings('en').designer}
      />
    </>
  )
}
