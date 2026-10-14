import { listAllPatterns } from '@/lib/admin/patterns'
import { requireAdmin } from '@/lib/admin/session'
import { hasDatabase } from '@/lib/db'
import { patternUrl } from '@/lib/i18n'

export default async function AdminPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin()
  const { deleted } = await searchParams
  if (!hasDatabase()) {
    return (
      <>
        <h1>Patterns</h1>
        <p className="admin-notice admin-notice--error">
          No database is connected (<code>DATABASE_URL</code> isn’t set), so patterns can’t be edited here.
        </p>
      </>
    )
  }
  const rows = await listAllPatterns()

  return (
    <>
      <div className="admin-title">
        <h1>Patterns</h1>
        <a className="button" href="/admin/new/">
          New pattern
        </a>
      </div>
      {deleted && (
        <p className="admin-notice" role="status">
          The pattern was deleted.
        </p>
      )}
      {rows.length === 0 ? (
        <p>No patterns yet.</p>
      ) : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li key={row.id}>
              {row.coverUrl ? <img src={row.coverUrl} alt="" /> : <span className="admin-list__blank" />}
              <div>
                <a className="admin-list__title" href={`/admin/${row.id}/`}>
                  {row.title}
                </a>
                <p className="admin-list__meta">
                  <span className={row.draft ? 'tag tag--soon' : 'tag tag--ready'}>
                    {row.draft ? 'Draft' : 'Published'}
                  </span>
                  {row.language === 'fi' ? 'Finnish' : 'English'}
                  {row.date && ` · ${row.date}`}
                  {!row.draft && (
                    <>
                      {' · '}
                      <a href={patternUrl(row.language, row.slug)}>View on site</a>
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
