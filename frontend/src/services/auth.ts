import api from './api'
import { LoginRequest, LoginResponse, User } from './types'

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('Login attempt:', credentials)
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Проверка для единственного пользователя
      if (credentials.email === 'demo@company.ru' && credentials.password === '123456') {
        const user: User = {
          id: 1,
          email: 'demo@company.ru',
          name: 'Оператор Иванов',
          role: 'admin',
          company: 'Транспортная компания',
        }
        
        return {
          success: true,
          token: 'mock_jwt_token_' + Date.now(),
          user: user,
        }
      }
      
      // Неверные данные
      throw new Error('Неверный email или пароль')
    } catch (error) {
      console.error('Login API error:', error)
      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const storedUser = localStorage.getItem('auth_user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  async refreshToken(): Promise<string | null> {
    try {
      const response = await api.post<{ token: string }>('/auth/refresh')
      const newToken = response.data.token
      localStorage.setItem('auth_token', newToken)
      return newToken
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  },
}