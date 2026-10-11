import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../lib/api'

export interface User {
  id: number
  email: string
  full_name?: string
  name?: string
  role: string
}

interface AuthCtx {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const res = await api.get('/profile')
      if (res.data?.user) {
        setUser(res.data.user)
        localStorage.setItem('cc_user', JSON.stringify(res.data.user))
      }
    } catch {}
  }

  useEffect(() => {
    const saved = localStorage.getItem('cc_user')
    if (saved && localStorage.getItem('cc_token')) {
      try {
        const parsed = JSON.parse(saved)
        parsed.name = parsed.name || parsed.full_name
        setUser(parsed)
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('cc_token', data.token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const register = async (email: string, password: string, full_name: string) => {
    const { data } = await api.post('/auth/register', { email, password, full_name })
    localStorage.setItem('cc_token', data.token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
