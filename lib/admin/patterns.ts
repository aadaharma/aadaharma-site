// Reading and checking patterns for the admin. Unlike lib/patterns.ts, this always
// includes drafts and works on database rows.
import 'server-only'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { patterns, type NewPatternRow, type PatternRow } from '../db/schema'
import { slugify } from './slug'

export const listAllPatterns = () =>
  db().select().from(patterns).orderBy(desc(patterns.date), asc(patterns.title))

export async function getPatternById(id: number) {
  const [row] = await db().select().from(patterns).where(eq(patterns.id, id))
  return row as PatternRow | undefined
}

// The text fields of the form, as typed. Everything is a string so a form with
// mistakes can be shown again exactly as it was.
export const FIELDS = [
  'title', 'slug', 'language', 'summary', 'craft', 'difficulty', 'yarnWeight', 'sizes', 'yarn',
  'needles', 'gauge', 'notions', 'coverUrl', 'coverAlt', 'pdfUrl', 'bodyMd', 'date',
] as const
export type PatternFields = Record<(typeof FIELDS)[number], string> & { published: boolean }

export const emptyFields = (): PatternFields => ({
  ...(Object.fromEntries(FIELDS.map((f) => [f, ''])) as Record<(typeof FIELDS)[number], string>),
  language: 'en',
  date: new Date().toISOString().slice(0, 10),
  published: false,
})

export function rowToFields(row: PatternRow): PatternFields {
  const fields = emptyFields()
  for (const f of FIELDS) fields[f] = row[f] ?? ''
  fields.published = !row.draft
  return fields
}

export function formToFields(form: FormData): PatternFields {
  const fields = emptyFields()
  for (const f of FIELDS) {
    const value = form.get(f)
    fields[f] = typeof value === 'string' ? value.trim() : ''
  }
  fields.published = form.get('published') === 'on'
  return fields
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

// Files must be ones uploaded to the site's Blob store
export const isBlobUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

export type FieldErrors = Partial<Record<keyof PatternFields, string>>

// Checks the form and turns it into a database row, or says what's wrong
export function validate(fields: PatternFields): { row: NewPatternRow } | { errors: FieldErrors } {
  const errors: FieldErrors = {}
  const slug = fields.slug || slugify(fields.title)
  if (!fields.title) errors.title = 'The pattern needs a name.'
  if (fields.title && !SLUG.test(slug))
    errors.slug = 'Use only lowercase letters a–z, numbers and dashes, e.g. selbu-mittens.'
  if (fields.language !== 'en' && fields.language !== 'fi') errors.language = 'Choose English or Finnish.'
  if (fields.date && (!DATE.test(fields.date) || isNaN(Date.parse(fields.date))))
    errors.date = 'Use a date like 2026-10-14.'
  if (fields.coverUrl && !isBlobUrl(fields.coverUrl)) errors.coverUrl = 'Upload the photo again.'
  if (fields.pdfUrl && !isBlobUrl(fields.pdfUrl)) errors.pdfUrl = 'Upload the PDF again.'
  if (fields.coverUrl && !fields.coverAlt) errors.coverAlt = 'Describe the photo for people who can’t see it.'
  if (Object.keys(errors).length) return { errors }

  const orNull = (value: string) => value || null
  return {
    row: {
      slug,
      language: fields.language as 'en' | 'fi',
      title: fields.title,
      summary: orNull(fields.summary),
      craft: orNull(fields.craft),
      difficulty: orNull(fields.difficulty),
      yarnWeight: orNull(fields.yarnWeight),
      sizes: orNull(fields.sizes),
      yarn: orNull(fields.yarn),
      needles: orNull(fields.needles),
      gauge: orNull(fields.gauge),
      notions: orNull(fields.notions),
      coverUrl: orNull(fields.coverUrl),
      coverAlt: orNull(fields.coverAlt),
      pdfUrl: orNull(fields.pdfUrl),
      bodyMd: fields.bodyMd,
      date: orNull(fields.date),
      draft: !fields.published,
    },
  }
}

// Blob files a pattern uses: its cover, PDF and photos in the text
export function blobFiles(row: PatternRow) {
  const inBody = [...row.bodyMd.matchAll(/\]\((https:\/\/[^)\s]+)\)/g)].map((m) => m[1])
  return [...new Set([row.coverUrl, row.pdfUrl, ...inBody])].filter((u): u is string => !!u && isBlobUrl(u))
}
