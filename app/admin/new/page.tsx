import { PatternForm } from '@/components/admin/PatternForm'
import { emptyFields } from '@/lib/admin/patterns'
import { requireAdmin } from '@/lib/admin/session'
import { suggestions } from '../suggestions'

export default async function NewPatternPage() {
  await requireAdmin()
  return (
    <>
      <p className="crumbs">
        <a href="/admin/">← All patterns</a>
      </p>
      <h1>New pattern</h1>
      <PatternForm id={null} initial={emptyFields()} suggestions={await suggestions()} />
    </>
  )
}
