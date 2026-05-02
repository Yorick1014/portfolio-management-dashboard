import { createContext, useContext } from 'react'
import type { AuthCredentials, User } from '../api/auth'

export type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isCheckingAuth: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  register: (credentials: AuthCredentials) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
