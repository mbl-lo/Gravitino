import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Типы данных
interface User {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Провайдер
interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // При загрузке приложения проверяем localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Функция входа
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Здесь будет реальный API запрос
      // const response = await api.post('/auth/login', { email, password })
      // const { token, user } = response.data
      
      // Временная заглушка для тестирования
      // Удалить после подключения к реальному API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Проверка для демо (удалить позже)
      if (email === 'demo@company.ru' && password === '123456') {
        const mockUser = { id: '1', email, name: 'Пользователь', role: 'user' }
        const mockToken = 'mock_jwt_token_' + Date.now()
        
        setToken(mockToken)
        setUser(mockUser)
        localStorage.setItem('auth_token', mockToken)
        localStorage.setItem('auth_user', JSON.stringify(mockUser))
      } else {
        throw new Error('Неверный email или пароль')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Функция выхода
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    setUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}