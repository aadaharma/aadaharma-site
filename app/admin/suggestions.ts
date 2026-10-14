import 'server-only'
import { listAllPatterns } from '@/lib/admin/patterns'
import { hasDatabase } from '@/lib/db'

// Values already used for the library's filters, offered as suggestions so new
// patterns spell them the same way
export async function suggestions() {
  const rows = hasDatabase() ? await listAllPatterns() : []
  const values = (key: 'craft' | 'difficulty' | 'yarnWeight') =>
    [...new Set(rows.map((r) => r[key]).filter((v): v is string => !!v))].sort()
  return { craft: values('craft'), difficulty: values('difficulty'), yarnWeight: values('yarnWeight') }
}
export type Suggestions = Awaited<ReturnType<typeof suggestions>>
