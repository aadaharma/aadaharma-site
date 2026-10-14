import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import type { Key } from '../embroidery/stitches'

// One row per knitting pattern. The address is /patterns/<slug>/ (or /fi/patterns/<slug>/),
// so a slug is unique within its language. Cover and PDF are Vercel Blob URLs.
export const patterns = pgTable(
  'patterns',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull(),
    language: text('language', { enum: ['en', 'fi'] }).notNull().default('en'),
    title: text('title').notNull(),
    summary: text('summary'),
    craft: text('craft'),
    difficulty: text('difficulty'),
    yarnWeight: text('yarn_weight'),
    sizes: text('sizes'),
    yarn: text('yarn'),
    needles: text('needles'),
    gauge: text('gauge'),
    notions: text('notions'),
    coverUrl: text('cover_url'),
    coverAlt: text('cover_alt'),
    pdfUrl: text('pdf_url'),
    bodyMd: text('body_md').notNull().default(''),
    date: date('date'),
    draft: boolean('draft').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex('patterns_language_slug').on(table.language, table.slug)],
)

export type PatternRow = typeof patterns.$inferSelect
export type NewPatternRow = typeof patterns.$inferInsert

// Templates (motifs) for the embroidery designer, drawn in the admin. The stitches are
// stitch keys grouped by colour, as in lib/embroidery/motif.ts (MotifJson).
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameFi: text('name_fi').notNull(),
  category: text('category').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  stitches: jsonb('stitches').$type<Record<string, Key[]>>().notNull(),
  published: boolean('published').notNull().default(false),
  // The one template drawn down the edges of every page (see components/PageBorder.tsx)
  pageBorder: boolean('page_border').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type TemplateRow = typeof templates.$inferSelect
export type NewTemplateRow = typeof templates.$inferInsert
