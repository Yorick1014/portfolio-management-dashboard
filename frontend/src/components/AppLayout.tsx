import { useMemo, useState, type CSSProperties } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/authState'

const navigationItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Investments', to: '/investments' },
  { label: 'Transactions', to: '/transactions' },
]

export function AppLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const isLightTheme = theme === 'light'

  const themeStyle = useMemo(
    () =>
      ({
        '--app-bg': isLightTheme ? '#F2F4F7' : '#0F1117',
        '--panel-bg': isLightTheme ? '#FFFFFF' : '#151922',
        '--panel-alt': isLightTheme ? '#F7F9FC' : '#11141B',
        '--rail-bg': isLightTheme ? '#E8EDF5' : '#202735',
        '--toolbar-bg': isLightTheme ? '#FFFFFF' : '#11141B',
        '--border': isLightTheme ? '#D9DFEA' : '#2A303A',
        '--border-soft': isLightTheme ? '#E5EAF2' : '#252B35',
        '--text-primary': isLightTheme ? '#111827' : '#FFFFFF',
        '--text-secondary': isLightTheme ? '#334155' : '#DDE3EA',
        '--text-muted': isLightTheme ? '#64748B' : '#8E98A8',
        '--text-subtle': isLightTheme ? '#94A3B8' : '#687284',
        '--hover-bg': isLightTheme ? '#DDE5F0' : '#252D3A',
      }) as CSSProperties,
    [isLightTheme],
  )

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleThemeToggle() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div
      className="min-h-screen bg-(--app-bg) text-(--text-secondary)"
      data-testid="app-shell"
      data-theme={theme}
      style={themeStyle}
    >
      <aside className="fixed inset-y-0 left-0 hidden w-[176px] flex-col bg-(--rail-bg) text-(--text-muted) lg:flex">
        <div className="flex h-[60px] items-center border-b border-(--border) px-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-subtle)">
              Account
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-(--text-primary)">
              Account: {user?.username ?? 'loading'}
            </p>
          </div>
        </div>

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-2">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'rounded-[2px] px-3 py-3 text-xs font-semibold transition',
                  isActive
                    ? 'bg-(--panel-alt) text-[#FF7A1A]'
                    : 'hover:bg-(--hover-bg) hover:text-(--text-primary)',
                ].join(' ')
              }
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="m-2 rounded-[2px] bg-(--panel-alt) px-3 py-3 text-left text-xs font-bold text-(--text-muted) transition hover:text-(--text-primary)"
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      </aside>

      <div className="lg:pl-[176px]">
        <header className="hidden h-[60px] items-center justify-between border-b border-(--border) bg-(--toolbar-bg) px-4 lg:flex">
          <div className="flex items-center gap-4 text-xs text-(--text-muted)">
            <span className="font-semibold text-(--text-primary)">
              Portfolio Management Dashboard
            </span>
            <span className="h-4 w-px bg-(--border)" />
            <span>Terminal View</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch
              isLightTheme={isLightTheme}
              onToggle={handleThemeToggle}
            />
          </div>
        </header>

        <header className="border-b border-(--border) bg-(--toolbar-bg) px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF7A1A]">
                Portfolio Dashboard
              </p>
              <p className="text-sm text-(--text-muted)">
                Account: {user?.username ?? 'loading'}
              </p>
            </div>
            <ThemeSwitch
              isLightTheme={isLightTheme}
              onToggle={handleThemeToggle}
            />
          </div>
          <nav aria-label="Primary mobile" className="mt-4 flex gap-2 overflow-x-auto">
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    'whitespace-nowrap rounded-[2px] px-3 py-2 text-xs font-semibold',
                    isActive
                      ? 'bg-[#FF7A1A] text-white'
                      : 'bg-(--panel-alt) text-(--text-muted)',
                  ].join(' ')
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="min-h-[calc(100vh-60px)] p-3 lg:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function ThemeSwitch({
  isLightTheme,
  onToggle,
}: {
  isLightTheme: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-(--text-muted)">
        Theme mode
      </span>
      <button
        aria-checked={isLightTheme}
        aria-label="Theme mode"
        className={[
          'relative h-6 w-12 rounded-full transition',
          isLightTheme ? 'bg-[#FF7A1A]' : 'bg-[#303642]',
        ].join(' ')}
        onClick={onToggle}
        role="switch"
        type="button"
      >
        <span
          className={[
            'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition',
            isLightTheme ? 'left-7' : 'left-1',
          ].join(' ')}
        />
      </button>
      <span className="w-9 text-xs font-semibold text-(--text-primary)">
        {isLightTheme ? 'Light' : 'Dark'}
      </span>
    </div>
  )
}
