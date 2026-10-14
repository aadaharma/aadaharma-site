import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { adminConfigured, isAdmin, MIN_PASSWORD_LENGTH } from '@/lib/admin/session'

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin/')
  return (
    <div className="admin-login">
      <h1>Log in</h1>
      {adminConfigured() ? (
        <LoginForm />
      ) : (
        <p className="admin-notice admin-notice--error">
          The admin isn’t set up yet. Add <code>ADMIN_PASSWORD</code> (at least {MIN_PASSWORD_LENGTH} characters)
          and <code>ADMIN_SESSION_SECRET</code> (at least 32 characters) to the Vercel project’s environment
          variables, then redeploy.
        </p>
      )}
    </div>
  )
}
