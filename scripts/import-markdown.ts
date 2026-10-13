// Copies the Markdown patterns in content/patterns/ into the database, and their photos
// and PDFs (content/patterns/<slug>/) into Vercel Blob. Safe to run again: a pattern
// with the same language and slug is updated, not duplicated.
//
//   npx vercel env pull .env.local     # DATABASE_URL and BLOB_READ_WRITE_TOKEN
//   npm run db:migrate
//   npm run import:patterns
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { put } from '@vercel/blob'
import { db } from '../lib/db'
import { patterns, type NewPatternRow } from '../lib/db/schema'
import { parseFrontmatter } from '../lib/frontmatter'

process.loadEnvFile?.('.env.local')

const DIR = join(process.cwd(), 'content/patterns')
const str = (value: unknown) => (typeof value === 'string' && value !== '' ? value : null)

// Uploads one file from the pattern's folder and returns its public URL
async function upload(slug: string, name: string | null) {
  if (!name) return null
  const path = join(DIR, slug, name)
  if (!existsSync(path)) {
    console.warn(`  ${slug}: ${name} not found, skipped`)
    return null
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  const blob = await put(`patterns/${slug}/${name}`, readFileSync(path), { access: 'public', allowOverwrite: true })
  return blob.url
}

// Relative links to files in the pattern's folder are uploaded and pointed at Blob
async function uploadBodyFiles(slug: string, body: string) {
  let out = body
  for (const [, name] of body.matchAll(/\]\((?!(?:[a-z]+:|\/|#))([^)\s]+)\)/gi)) {
    const url = await upload(slug, name)
    if (url) out = out.replaceAll(`](${name})`, `](${url})`)
  }
  return out
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'))
for (const file of files) {
  const slug = basename(file, '.md')
  const { data, body } = parseFrontmatter(readFileSync(join(DIR, file), 'utf8'))
  const row: NewPatternRow = {
    slug,
    language: data.language === 'fi' ? 'fi' : 'en',
    title: str(data.title) ?? slug,
    summary: str(data.summary),
    craft: str(data.craft),
    difficulty: str(data.difficulty),
    yarnWeight: str(data.yarnWeight),
    sizes: str(data.sizes),
    yarn: str(data.yarn),
    needles: str(data.needles),
    gauge: str(data.gauge),
    notions: str(data.notions),
    coverUrl: await upload(slug, str(data.cover)),
    coverAlt: str(data.coverAlt),
    pdfUrl: await upload(slug, str(data.pdf)),
    bodyMd: await uploadBodyFiles(slug, body),
    date: str(data.date),
    draft: data.draft === true,
  }
  await db()
    .insert(patterns)
    .values(row)
    .onConflictDoUpdate({ target: [patterns.language, patterns.slug], set: { ...row, updatedAt: new Date() } })
  console.log(`${row.draft ? 'draft    ' : 'published'}  /${row.language === 'fi' ? 'fi/' : ''}patterns/${slug}/`)
}
console.log(`Imported ${files.length} pattern(s).`)
