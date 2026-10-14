import { TemplateThumb } from '@/components/embroidery/TemplateThumb'
import { requireAdmin } from '@/lib/admin/session'
import { hasDatabase } from '@/lib/db'
import { CATEGORIES } from '@/lib/embroidery/motifs'
import { allTemplates, rowToTemplate } from '@/lib/embroidery/templates'
import { designerUrl } from '@/lib/i18n'

export default async function TemplatesPage({ searchParams }: PageProps<'/admin/templates'>) {
  await requireAdmin()
  const { deleted } = await searchParams
  if (!hasDatabase()) {
    return (
      <>
        <h1>Templates</h1>
        <p className="admin-notice admin-notice--error">
          No database is connected (<code>DATABASE_URL</code> isn’t set), so templates can’t be edited here.
        </p>
      </>
    )
  }
  const rows = await allTemplates()

  return (
    <>
      <div className="admin-title">
        <h1>Templates</h1>
        <a className="button" href="/admin/templates/new/">
          New template
        </a>
      </div>
      <p className="note">
        Motifs for the <a href={designerUrl('en')}>embroidery designer</a>. Published ones are in its template library.
      </p>
      {deleted && (
        <p className="admin-notice" role="status">
          The template was deleted.
        </p>
      )}
      {rows.length === 0 && <p>No templates yet.</p>}
      {CATEGORIES.map((category) => {
        const list = rows.filter((r) => r.category === category.id)
        if (!list.length) return null
        return (
          <section key={category.id} className="admin-templates">
            <h2>
              {category.en} <small lang="fi">{category.fi}</small>
            </h2>
            <ul className="admin-list">
              {list.map((row) => (
                <li key={row.id}>
                  <TemplateThumb motif={rowToTemplate(row).motif} />
                  <div>
                    <a className="admin-list__title" href={`/admin/templates/${row.id}/`}>
                      {row.nameEn}
                    </a>
                    <p className="admin-list__meta">
                      <span className={row.published ? 'tag tag--ready' : 'tag tag--soon'}>
                        {row.published ? 'Published' : 'Draft'}
                      </span>
                      {row.pageBorder && <span className="tag tag--ready">Page border</span>}
                      <span lang="fi">{row.nameFi}</span> · {row.width} × {row.height}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
