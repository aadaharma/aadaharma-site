'use client'

import { useActionState } from 'react'
import { login } from '@/app/admin/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {})
  return (
    <form action={action} className="admin-form">
      {/* Lets password managers know which login this is */}
      <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
      </div>
      {state.error && (
        <p className="admin-notice admin-notice--error" role="alert">
          {state.error}
        </p>
      )}
      <div>
        <button type="submit" className="button" disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </div>
    </form>
  )
}
