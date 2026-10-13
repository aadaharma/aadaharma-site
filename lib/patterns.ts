// The knitting pattern library. Patterns come from the database when DATABASE_URL is set,
// otherwise from Markdown files in content/patterns/ (the old way, kept for local development):
//   content/patterns/<slug>.md      the pattern: frontmatter + Markdown
// Files starting with _ (like _template.md) are skipped. Drafts are listed only in
// development or with SHOW_DRAFTS=1.
import 'server-only'
import { cache } from 'react'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import { Marked } from 'marked'
import { eq } from 'drizzle-orm'
import { db, hasDatabase } from './db'
import { patterns as patternsTable, type PatternRow } from './db/schema'
import { parseFrontmatter } from './frontmatter'
import { parseChart, chartSvg, swatch } from './knit-art'
import { isLang, patternUrl, type Lang } from './i18n'

export const CONTENT_DIR = 'content/patterns'

export type Pattern = {
  slug: string
  lang: Lang
  url: string
  title: string
  summary?: string
  craft?: string
  difficulty?: string
  yarnWeight?: string
  sizes?: string
  yarn?: string
  needles?: string
  gauge?: string
  notions?: string
  cover?: string
  coverAlt?: string
  pdf?: string
  date?: string
  draft: boolean
  body: string
  // Relative image and file links in the body point here (Markdown source only)
  assetBase?: string
  // Knitted swatch drawing for cards without a cover photo
  swatch?: string
}

const showDrafts = () => process.env.NODE_ENV === 'development' || !!process.env.SHOW_DRAFTS

const str = (value: unknown) => (typeof value === 'string' && value !== '' ? value : undefined)

function fromMarkdown(): Pattern[] {
  const dir = join(process.cwd(), CONTENT_DIR)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith('.md') && !file.startsWith('_'))
    .map((file) => {
      const slug = basename(file, '.md')
      const { data, body } = parseFrontmatter(readFileSync(join(dir, file), 'utf8'))
      const lang = typeof data.language === 'string' && isLang(data.language) ? data.language : 'en'
      const assetBase = `/${CONTENT_DIR}/${slug}/`
      const asset = (name: unknown) => (str(name) ? assetBase + name : undefined)
      return {
        slug,
        lang,
        url: patternUrl(lang, slug),
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
        cover: asset(data.cover),
        coverAlt: str(data.coverAlt),
        pdf: asset(data.pdf),
        date: str(data.date),
        draft: data.draft === true,
        body,
        assetBase,
      }
    })
}

function fromRow(row: PatternRow): Pattern {
  const lang = isLang(row.language) ? row.language : 'en'
  return {
    slug: row.slug,
    lang,
    url: patternUrl(lang, row.slug),
    title: row.title,
    summary: row.summary ?? undefined,
    craft: row.craft ?? undefined,
    difficulty: row.difficulty ?? undefined,
    yarnWeight: row.yarnWeight ?? undefined,
    sizes: row.sizes ?? undefined,
    yarn: row.yarn ?? undefined,
    needles: row.needles ?? undefined,
    gauge: row.gauge ?? undefined,
    notions: row.notions ?? undefined,
    cover: row.coverUrl ?? undefined,
    coverAlt: row.coverAlt ?? undefined,
    pdf: row.pdfUrl ?? undefined,
    date: row.date ?? undefined,
    draft: row.draft,
    body: row.bodyMd,
  }
}

async function fromDatabase(): Promise<Pattern[]> {
  const query = db().select().from(patternsTable)
  const rows = await (showDrafts() ? query : query.where(eq(patternsTable.draft, false)))
  return rows.map(fromRow)
}

// All patterns in both languages, newest first, as the library shows them
export const listPatterns = cache(async (): Promise<Pattern[]> => {
  const all = hasDatabase() ? await fromDatabase() : fromMarkdown()
  const list = all
    .filter((p) => showDrafts() || !p.draft)
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title))
  // Cards without a cover photo get a knitted swatch drawing, a different motif per card
  list.forEach((p, i) => {
    if (!p.cover) p.swatch = swatch(i % 4)
  })
  return list
})

export const getPattern = cache(async (lang: Lang, slug: string) =>
  (await listPatterns()).find((p) => p.lang === lang && p.slug === slug),
)

const isRelative = (href: string) => href && !/^([a-z]+:|\/|#)/i.test(href)

// Pattern text is written by Aada (Markdown files or the admin), so its HTML is trusted.
export function renderBody(pattern: Pattern, chartLabel: string) {
  const marked = new Marked({
    walkTokens(token) {
      if (pattern.assetBase && (token.type === 'image' || token.type === 'link') && isRelative(token.href)) {
        token.href = pattern.assetBase + token.href
      }
    },
    renderer: {
      // ```chart blocks are drawn as colourwork charts
      code({ text, lang }) {
        if (lang !== 'chart') return false
        return `<figure class="chart-figure"><div class="chart-wrap">${chartSvg(parseChart(text), chartLabel)}</div></figure>`
      },
    },
  })
  return marked.parse(pattern.body, { async: false })
}

// Filter groups for the library page: every value used by at least one pattern
export type Facet = { key: 'craft' | 'difficulty' | 'yarnWeight'; values: string[] }

export function facets(list: Pattern[]): Facet[] {
  return (['craft', 'difficulty', 'yarnWeight'] as const)
    .map((key) => ({ key, values: [...new Set(list.map((p) => p[key]).filter((v): v is string => !!v))] }))
    .filter((f) => f.values.length > 1)
}
