import axios from 'axios'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { API_URL, clearTokens, getAccessToken, setTokens } from '../lib/api'
import { deleteItem, getItem, setItem } from '../lib/tokenStorage'

interface AuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  userEmail: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAccessToken(), getItem('user_email')]).then(([token, email]) => {
      setIsAuthenticated(!!token)
      setUserEmail(email)
      setLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    const { data } = await axios.post(`${API_URL}/auth/login`, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    await setTokens(data.access_token, data.refresh_token)
    await setItem('user_email', email)
    setUserEmail(email)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await clearTokens()
    await deleteItem('user_email')
    setUserEmail(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
