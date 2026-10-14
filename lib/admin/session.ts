// Admin login. There's one admin and one password, ADMIN_PASSWORD, set in the Vercel project.
// Logging in sets a cookie holding its expiry time, signed with a key made from
// ADMIN_SESSION_SECRET and the password, so changing either one logs everyone out.
// Every admin page, server action and the upload route checks the cookie on the server.
import 'server-only'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'admin_session'
const MAX_AGE = 30 * 24 * 60 * 60 // seconds

// Shorter values are treated as not set, so a weak password can't be used by mistake
export const MIN_PASSWORD_LENGTH = 20
const MIN_SECRET_LENGTH = 32

function config() {
  const password = process.env.ADMIN_PASSWORD ?? ''
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (password.length < MIN_PASSWORD_LENGTH || secret.length < MIN_SECRET_LENGTH) return null
  return { password, secret }
}

export const adminConfigured = () => !!config()

// Compares hashes, so the time taken doesn't reveal how much of the input matched
const sha256 = (value: string) => createHash('sha256').update(value).digest()
const same = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b))

function sign(value: string, { password, secret }: { password: string; secret: string }) {
  const key = createHmac('sha256', secret).update(password).digest()
  return createHmac('sha256', key).update(value).digest('base64url')
}

export function checkPassword(input: string) {
  const c = config()
  return !!c && same(input, c.password)
}

export async function startSession() {
  const c = config()
  if (!c) throw new Error('Admin login is not set up')
  const expires = String(Date.now() + MAX_AGE * 1000)
  ;(await cookies()).set(COOKIE, `${expires}.${sign(expires, c)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function endSession() {
  ;(await cookies()).delete(COOKIE)
}

export async function isAdmin() {
  const c = config()
  const value = (await cookies()).get(COOKIE)?.value
  if (!c || !value) return false
  const [expires, signature] = value.split('.')
  if (!expires || !signature || !same(signature, sign(expires, c))) return false
  return Number(expires) > Date.now()
}

// For admin pages and actions: sends anyone not logged in to the login page
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login/')
}

// Wrong passwords: after 5 tries from one address, that address has to wait 15 minutes.
// Kept in memory, so it counts per server instance; with a 20+ character random password
// it's only there to slow guessing down, not what keeps the admin safe.
const MAX_FAILURES = 5
const WINDOW = 15 * 60 * 1000
const failures = new Map<string, { count: number; until: number }>()

export function tooManyFailures(ip: string) {
  const entry = failures.get(ip)
  if (entry && entry.until < Date.now()) failures.delete(ip)
  return (failures.get(ip)?.count ?? 0) >= MAX_FAILURES
}

export function recordFailure(ip: string) {
  const entry = failures.get(ip)
  failures.set(ip, { count: (entry?.count ?? 0) + 1, until: Date.now() + WINDOW })
  // Old entries are dropped now and then so the map doesn't grow forever
  if (failures.size > 1000) for (const [key, e] of failures) if (e.until < Date.now()) failures.delete(key)
}

export const clearFailures = (ip: string) => failures.delete(ip)
