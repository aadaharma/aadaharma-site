'use server'

import { del } from '@vercel/blob'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { patterns } from '@/lib/db/schema'
import { blobFiles, formToFields, getPatternById, validate, type FieldErrors, type PatternFields } from '@/lib/admin/patterns'
import {
  adminConfigured, checkPassword, clearFailures, endSession, recordFailure, requireAdmin, startSession,
  tooManyFailures,
} from '@/lib/admin/session'

export type LoginState = { error?: string }

export async function login(_: LoginState, form: FormData): Promise<LoginState> {
  if (!adminConfigured()) return { error: 'The admin password hasn’t been set up yet.' }
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (tooManyFailures(ip)) return { error: 'Too many wrong passwords. Try again in 15 minutes.' }
  if (!checkPassword(String(form.get('password') ?? ''))) {
    recordFailure(ip)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { error: 'Wrong password.' }
  }
  clearFailures(ip)
  await startSession()
  redirect('/admin/')
}

export async function logout() {
  await endSession()
  redirect('/admin/login/')
}

// The pages are built ahead of time, so after a change every page under app/[lang]
// (library, pattern pages, home) is rebuilt on its next visit
const refreshSite = () => revalidatePath('/[lang]', 'layout')

export type SaveState = { values?: PatternFields; errors?: FieldErrors; error?: string }

export async function savePattern(_: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin()
  const id = Number(form.get('id')) || null
  const values = formToFields(form)
  const result = validate(values)
  if ('errors' in result) return { values, errors: result.errors, error: 'Some fields need fixing.' }

  let savedId = id
  try {
    if (id) {
      await db().update(patterns).set(result.row).where(eq(patterns.id, id))
    } else {
      const [row] = await db().insert(patterns).values(result.row).returning({ id: patterns.id })
      savedId = row.id
    }
  } catch (error) {
    // 23505: another pattern in the same language already has this address
    const code = (error as { cause?: { code?: string }; code?: string }).cause?.code ?? (error as { code?: string }).code
    if (code === '23505') {
      return {
        values,
        errors: { slug: 'Another pattern in this language already uses this address.' },
        error: 'Some fields need fixing.',
      }
    }
    console.error(error)
    return { values, error: 'Saving failed. Try again in a moment.' }
  }
  refreshSite()
  redirect(`/admin/${savedId}/?saved=1`)
}

export async function deletePattern(id: number) {
  await requireAdmin()
  const row = await getPatternById(id)
  if (row) {
    await db().delete(patterns).where(eq(patterns.id, id))
    // The photos and PDF go too, so they can't be found by their old addresses
    const files = blobFiles(row)
    if (files.length && process.env.BLOB_READ_WRITE_TOKEN) await del(files).catch(console.error)
    refreshSite()
  }
  redirect('/admin/?deleted=1')
}
