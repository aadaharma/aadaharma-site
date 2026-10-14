import { notFound } from 'next/navigation'
import { PatternForm } from '@/components/admin/PatternForm'
import { getPatternById, rowToFields } from '@/lib/admin/patterns'
import { requireAdmin } from '@/lib/admin/session'
import { patternUrl } from '@/lib/i18n'
import { suggestions } from '../suggestions'

export default async function EditPatternPage({ params, searchParams }: PageProps<'/admin/[id]'>) {
  await requireAdmin()
  const id = Number((await params).id)
  const row = Number.isInteger(id) ? await getPatternById(id) : undefined
  if (!row) notFound()
  const { saved } = await searchParams

  return (
    <>
      <p className="crumbs">
        <a href="/admin/">← All patterns</a>
      </p>
      <div className="admin-title">
        <h1>{row.title}</h1>
        <p className="admin-title__links">
          <a href={`/admin/${id}/preview/`}>Preview</a>
          {!row.draft && <a href={patternUrl(row.language, row.slug)}>View on site</a>}
        </p>
      </div>
      {saved && (
        <p className="admin-notice" role="status">
          Saved. {row.draft ? 'It’s a draft, so it isn’t on the site yet.' : 'The site is updated.'}
        </p>
      )}
      <PatternForm id={id} initial={rowToFields(row)} suggestions={await suggestions()} />
    </>
  )
}
