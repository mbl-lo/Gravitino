import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth'
import { User } from '../services/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        const storedToken = localStorage.getItem('auth_token')
        
        if (storedToken) {
          const currentUser = await authService.getCurrentUser()
          
          if (currentUser) {
            setToken(storedToken)
            setUser(currentUser)
            localStorage.setItem('auth_user', JSON.stringify(currentUser))
          } else {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } finally {
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authService.login({ email, password })
      
      setToken(response.accessToken)
      setUser(response.user)
      
      localStorage.setItem('auth_token', response.accessToken)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      
      console.log('Login successful!', response.user)
    } catch (error: any) {
      console.error('Login error:', error)
      const errorMessage = error.response?.data?.message || 'Ошибка при входе в систему'
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setIsLoading(false)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}