'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/session'
import { db } from '@/lib/db'
import { templates } from '@/lib/db/schema'
import { motifFrom, motifFromJson, motifToJson, TEMPLATE_MAX } from '@/lib/embroidery/motif'
import { isCategory } from '@/lib/embroidery/motifs'

export type TemplateFields = { nameEn: string; nameFi: string; category: string; published: boolean }
export type TemplateSaveState = {
  values?: TemplateFields
  errors?: Partial<Record<keyof TemplateFields | 'motif', string>>
  error?: string
}

// The designer is built ahead of time, so it's rebuilt on its next visit after a change
const refreshDesigner = () => revalidatePath('/[lang]/karelianembroiderymaker', 'page')

export async function saveTemplate(_: TemplateSaveState, form: FormData): Promise<TemplateSaveState> {
  await requireAdmin()
  const id = Number(form.get('id')) || null
  const text = (name: string) => String(form.get(name) ?? '').trim()
  const values: TemplateFields = {
    nameEn: text('nameEn'),
    nameFi: text('nameFi'),
    category: text('category'),
    published: form.get('published') === 'on',
  }
  // The drawing, trimmed to its stitches
  let motif = null
  try {
    const drawn = motifFromJson(JSON.parse(String(form.get('motif') ?? 'null')), TEMPLATE_MAX)
    motif = drawn && motifFrom(drawn.stitches)
  } catch {}

  const errors: TemplateSaveState['errors'] = {}
  if (!values.nameEn) errors.nameEn = 'The template needs an English name.'
  if (!values.nameFi) errors.nameFi = 'The template needs a Finnish name.'
  if (!isCategory(values.category)) errors.category = 'Choose a category.'
  if (!motif) errors.motif = 'Draw the motif on the grid first.'
  if (Object.keys(errors).length) return { values, errors, error: 'Some things need fixing.' }

  const { width, height, stitches } = motifToJson(motif!)
  const row = { nameEn: values.nameEn, nameFi: values.nameFi, category: values.category, width, height, stitches, published: values.published }
  let savedId = id
  try {
    if (id) await db().update(templates).set(row).where(eq(templates.id, id))
    else [{ id: savedId }] = await db().insert(templates).values(row).returning({ id: templates.id })
  } catch (error) {
    console.error(error)
    return { values, error: 'Saving failed. Try again in a moment.' }
  }
  refreshDesigner()
  redirect(`/admin/templates/${savedId}/?saved=1`)
}

export async function deleteTemplate(form: FormData) {
  await requireAdmin()
  const id = Number(form.get('id'))
  if (id) await db().delete(templates).where(eq(templates.id, id))
  refreshDesigner()
  redirect('/admin/templates/?deleted=1')
}
