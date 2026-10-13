import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// DATABASE_URL is set by the Neon integration on Vercel (and in .env.local for development).
// Without it the site reads patterns from content/patterns/ instead (see lib/patterns.ts).
export const hasDatabase = () => !!process.env.DATABASE_URL

let instance: ReturnType<typeof create> | undefined
const create = () => drizzle(neon(process.env.DATABASE_URL!), { schema })

export function db() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not set')
  return (instance ??= create())
}
