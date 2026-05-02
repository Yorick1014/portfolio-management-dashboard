import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/authState'

export function ProtectedRoute() {
  const { isAuthenticated, isCheckingAuth } = useAuth()
  const location = useLocation()

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0F1117] text-white">
        <p className="text-sm font-medium text-[#8E98A8]">Checking session...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
