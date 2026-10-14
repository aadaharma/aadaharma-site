// Copies the built-in templates (lib/embroidery/motifs.ts) into the database as published
// templates. Only runs when there are no templates yet, so it can't make duplicates.
//
//   npx vercel env pull .env.local     # DATABASE_URL
//   npm run db:migrate
//   npm run seed:templates
import { db } from '../lib/db'
import { templates } from '../lib/db/schema'
import { BUILT_IN_TEMPLATES } from '../lib/embroidery/motifs'

process.loadEnvFile?.('.env.local')

const existing = await db().select({ id: templates.id }).from(templates).limit(1)
if (existing.length) {
  console.log('There are templates already; nothing was added.')
} else {
  await db()
    .insert(templates)
    .values(
      BUILT_IN_TEMPLATES.map((t) => ({
        nameEn: t.name.en,
        nameFi: t.name.fi,
        category: t.category,
        width: t.motif.width,
        height: t.motif.height,
        stitches: t.motif.stitches,
        published: true,
      })),
    )
  console.log(`Added ${BUILT_IN_TEMPLATES.length} templates.`)
}
