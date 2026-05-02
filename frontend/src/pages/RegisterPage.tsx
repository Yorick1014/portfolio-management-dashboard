import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authState'
import { getErrorMessage } from '../utils/errorMessage'
import { applyDocumentTheme, getStoredTheme, getThemeStyle } from '../utils/theme'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const theme = getStoredTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    applyDocumentTheme(theme)
  }, [theme])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords must match.')
      return
    }

    setIsSubmitting(true)

    try {
      await register({ username, password })
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
      })
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Unable to create account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-(--app-bg) px-6 py-12 text-(--text-secondary)"
      data-testid="auth-shell"
      data-theme={theme}
      style={getThemeStyle(theme)}
    >
      <section className="w-full max-w-md rounded-[2px] border border-(--border-soft) bg-(--panel-bg) p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF7A1A]">
          Portfolio Dashboard
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-(--text-primary)">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-(--text-muted)">
          Register with a username and password to start tracking holdings.
        </p>

        <div className="mt-8 space-y-4">
          {error ? (
            <p className="rounded-[2px] bg-[#E34855]/10 px-4 py-3 text-sm text-[#E34855]">
              {error}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              autoComplete="username"
              label="Username"
              onChange={setUsername}
              value={username}
            />
            <FormField
              autoComplete="new-password"
              label="Password"
              onChange={setPassword}
              type="password"
              value={password}
            />
            <FormField
              autoComplete="new-password"
              label="Confirm password"
              onChange={setConfirmPassword}
              type="password"
              value={confirmPassword}
            />
            <button
              className="w-full rounded-[2px] bg-[#FF7A1A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ff8f3d] disabled:cursor-not-allowed disabled:bg-[#687284]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-(--text-muted)">
          Already registered?{' '}
          <Link className="font-semibold text-[#FF7A1A]" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  )
}

function FormField({
  autoComplete,
  label,
  onChange,
  type = 'text',
  value,
}: {
  autoComplete: string
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
      {label}
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-[2px] bg-(--panel-alt) px-4 py-3 text-(--text-primary) outline-none transition placeholder:text-(--text-subtle) focus:ring-1 focus:ring-[#FF7A1A]"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  )
}
