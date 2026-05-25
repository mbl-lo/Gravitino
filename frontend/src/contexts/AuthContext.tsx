import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Типы данных
interface User {
  id: string
  email: string
  name: string
  role: string
  company: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// Mock-данные пользователей
const mockUsers = [
  {
    id: '1',
    email: 'demo@company.ru',
    password: '123456',
    name: 'Иван Иванов',
    role: 'admin',
    company: 'Транспортная компания'
  },
  {
    id: '2',
    email: 'user@company.ru',
    password: '123456',
    name: 'Петр Петров',
    role: 'user',
    company: 'Транспортная компания'
  }
]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // При загрузке проверяем localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // Функция входа с mock-данными
  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Ищем пользователя в mock-данных
    const foundUser = mockUsers.find(u => u.email === email && u.password === password)
    
    if (!foundUser) {
      setIsLoading(false)
      throw new Error('Неверный email или пароль')
    }
    
    // Создаем токен (в реальном проекте его дает сервер)
    const mockToken = 'mock_jwt_token_' + Date.now() + '_' + foundUser.id
    
    // Сохраняем данные пользователя (без пароля)
    const userData: User = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
      company: foundUser.company
    }
    
    setToken(mockToken)
    setUser(userData)
    
    // Сохраняем в localStorage
    localStorage.setItem('auth_token', mockToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    
    setIsLoading(false)
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