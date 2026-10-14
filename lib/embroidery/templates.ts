// Reading templates for the designer and the admin
import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db, hasDatabase } from '../db'
import { templates, type TemplateRow } from '../db/schema'
import { BUILT_IN_TEMPLATES, CATEGORIES, isCategory, type TemplateJson } from './motifs'

export const rowToTemplate = (row: TemplateRow): TemplateJson => ({
  id: String(row.id),
  name: { en: row.nameEn, fi: row.nameFi },
  category: isCategory(row.category) ? row.category : CATEGORIES[0].id,
  motif: { width: row.width, height: row.height, stitches: row.stitches },
})

// Published templates, for the designer. Without a database, the built-in ones.
export async function publishedTemplates(): Promise<TemplateJson[]> {
  if (!hasDatabase()) return BUILT_IN_TEMPLATES
  const rows = await db().select().from(templates).where(eq(templates.published, true)).orderBy(asc(templates.nameEn))
  return rows.map(rowToTemplate)
}

// All templates, drafts included, for the admin
export const allTemplates = () => db().select().from(templates).orderBy(asc(templates.category), asc(templates.nameEn))

export async function getTemplateRow(id: number) {
  const [row] = await db().select().from(templates).where(eq(templates.id, id))
  return row as TemplateRow | undefined
}
