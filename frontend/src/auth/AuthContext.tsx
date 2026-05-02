import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type AuthCredentials,
  type User,
} from '../api/auth'
import {
  clearStoredAuthToken,
  getStoredAuthToken,
  storeAuthToken,
} from './tokenStorage'
import { AuthContext, type AuthContextValue } from './authState'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => getStoredAuthToken())
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(token))

  const logout = useCallback(() => {
    clearStoredAuthToken()
    setToken(null)
    setUser(null)
    setIsCheckingAuth(false)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
        }
      })
      .catch(() => {
        if (isMounted) {
          logout()
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingAuth(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [logout, token])

  const login = useCallback(async (credentials: AuthCredentials) => {
    const authToken = await loginUser(credentials)
    storeAuthToken(authToken.access_token)
    setToken(authToken.access_token)
  }, [])

  const register = useCallback(async (credentials: AuthCredentials) => {
    await registerUser(credentials)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isCheckingAuth,
      login,
      register,
      logout,
    }),
    [isCheckingAuth, login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
