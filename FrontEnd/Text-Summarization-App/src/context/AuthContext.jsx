// FrontEnd/src/components/Auth/AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import { authService } from '../../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there's a token in local storage
    const token = localStorage.getItem('token')
    if (token) {
      authService.getMe()
        .then(userData => {
          setUser(userData)
          setIsAuthenticated(true)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    setLoading(true)
    try {
      const { token, user } = await authService.login(credentials)
      localStorage.setItem('token', token)
      setUser(user)
      setIsAuthenticated(true)
      return user
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const { token, user } = await authService.register(userData)
      localStorage.setItem('token', token)
      setUser(user)
      setIsAuthenticated(true)
      return user
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}