import { notFound } from 'next/navigation'
import { PatternArticle } from '@/components/PatternArticle'
import { getPatternById } from '@/lib/admin/patterns'
import { requireAdmin } from '@/lib/admin/session'
import { fromRow } from '@/lib/patterns'

// The pattern as it looks on the site, drafts included
export default async function PreviewPage({ params }: PageProps<'/admin/[id]/preview'>) {
  await requireAdmin()
  const id = Number((await params).id)
  const row = Number.isInteger(id) ? await getPatternById(id) : undefined
  if (!row) notFound()
  const pattern = fromRow(row)

  return (
    <>
      <p className="admin-notice admin-preview-bar no-print">
        Preview{pattern.draft && ' of a draft'}. <a href={`/admin/${id}/`}>Back to editing</a>
      </p>
      <PatternArticle lang={pattern.lang} pattern={pattern} />
    </>
  )
}
