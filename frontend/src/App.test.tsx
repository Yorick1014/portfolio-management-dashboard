import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { getCurrentUser } from './api/auth'

vi.mock('./api/auth', () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUser: vi.fn(),
}))

describe('App auth routing', () => {
  beforeEach(() => {
    cleanup()
    localStorage.clear()
    window.history.pushState({}, '', '/')
    vi.restoreAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      username: 'demo',
    })
  })

  test('redirects unauthenticated dashboard visitors to login', async () => {
    window.history.pushState({}, '', '/dashboard')

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /sign in to your portfolio/i }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })

  test('renders registration form with password confirmation', async () => {
    window.history.pushState({}, '', '/register')

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  test('shows the professional sidebar layout to authenticated users', async () => {
    localStorage.setItem('portfolio_token', 'test-token')

    render(<App />)

    expect(
      await screen.findByRole('heading', { name: /portfolio overview/i }),
    ).toBeInTheDocument()
    const primaryNav = screen.getByRole('navigation', { name: 'Primary' })
    expect(primaryNav).toBeInTheDocument()
    expect(within(primaryNav).getByRole('link', { name: /^dashboard$/i })).toHaveAttribute(
      'href',
      '/dashboard',
    )
    expect(
      within(primaryNav).getByRole('link', { name: /^investments$/i }),
    ).toHaveAttribute('href', '/investments')
    expect(
      within(primaryNav).getByRole('link', { name: /^transactions$/i }),
    ).toHaveAttribute('href', '/transactions')
    expect(screen.getAllByText(/account: demo/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^pm$/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /logout/i })).toHaveLength(1)
    expect(
      screen.getAllByRole('switch', { name: /theme mode/i })[0],
    ).toHaveAccessibleName(/theme mode/i)
    expect(screen.getByRole('button', { name: '1D' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1M' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument()
  })

  test('theme toggle switches between dark and light modes', async () => {
    const user = userEvent.setup()
    localStorage.setItem('portfolio_token', 'test-token')

    render(<App />)

    const appShell = await screen.findByTestId('app-shell')
    expect(appShell).toHaveAttribute('data-theme', 'dark')

    await user.click(screen.getAllByRole('switch', { name: /theme mode/i })[0])

    expect(appShell).toHaveAttribute('data-theme', 'light')
    expect(
      screen.getAllByRole('switch', { name: /theme mode/i })[0],
    ).toHaveAttribute('aria-checked', 'true')
  })
})
