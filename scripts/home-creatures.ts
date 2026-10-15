// Takes the home page's creatures from Aada's elämänpuu template in the database and writes
// them to lib/home/creatures.json. Each creature is one thread colour of the drawing plus the
// gold item hanging from its beak (gold pieces belong to the creature they touch). The tree
// itself isn't used: the creatures stand on the hills of public/img/home/ instead.
//
//   npm run home:creatures            # template 21
//   npm run home:creatures -- 25      # another template
import { writeFileSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { templates } from '../lib/db/schema'
import { endpoints, type Key } from '../lib/embroidery/stitches'
import type { Creatures, Point } from '../lib/home/creatures'

process.loadEnvFile?.('.env.local')

const GOLD = '#c08a1e'
// The template's thread colours -> which link the creature is
const CREATURES = {
  embroidery: ['#a90aff', '#af24f0'], // purple bird, a needle on a thread
  knitting: ['#1f3a6b'], // blue bird, a ball of yarn with a needle through
  patterns: ['#03bf54'], // green bird, a book
  about: ['#ffd91a', '#ffda24'], // yellow fox, a sign
  cv: ['#f9b9ee'], // pink bird, a diamond
} as const

const id = Number(process.argv[2] ?? 21)
const [row] = await db().select().from(templates).where(eq(templates.id, id))
if (!row) throw new Error(`No template ${id}`)
const stitches = row.stitches as Record<string, Key[]>

const pointKey = (p: Point) => `${p[0]},${p[1]}`
const pointsOf = (keys: Key[]) =>
  new Set(keys.flatMap((k) => endpoints(k).map(({ x, y }) => pointKey([x, y]))))
const touches = (a: Set<string>, b: Set<string>) => [...a].some((p) => b.has(p))

// The gold pieces: stitches joined where they share a grid point
const gold = stitches[GOLD] ?? []
const parent = new Map<string, string>()
const find = (p: string): string => {
  while (parent.has(p) && parent.get(p) !== p) p = parent.get(p)!
  return p
}
for (const k of gold) {
  const [a, b] = endpoints(k).map(({ x, y }) => find(pointKey([x, y])))
  parent.set(a, b)
}
const pieces = new Map<string, Key[]>()
for (const k of gold) {
  const { x, y } = endpoints(k)[0]
  const root = find(pointKey([x, y]))
  pieces.set(root, [...(pieces.get(root) ?? []), k])
}

const out = {} as Creatures
for (const [name, colours] of Object.entries(CREATURES) as [keyof typeof CREATURES, readonly string[]][]) {
  let body = colours.flatMap((c) => stitches[c] ?? [])
  // A lone stitch of the creature's colour, not joined to the rest of it, belongs to the tree
  body = body.filter((k) => touches(pointsOf([k]), pointsOf(body.filter((o) => o !== k))))
  const bodyPoints = pointsOf(body)
  const item = [...pieces.values()].filter((piece) => touches(pointsOf(piece), bodyPoints)).flat()
  // It swings from where its thread meets the creature: the item's highest point
  const hang = item
    .flatMap((k) => endpoints(k).map(({ x, y }): Point => [x, y]))
    .sort((a, b) => a[1] - b[1] || a[0] - b[0])[0]
  out[name] = { body, item, hang: hang ?? null }
}

writeFileSync('lib/home/creatures.json', JSON.stringify(out) + '\n')
console.log(`Wrote lib/home/creatures.json from template ${id} (${row.nameEn}).`)
