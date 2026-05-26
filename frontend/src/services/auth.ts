import api from './api'
import { LoginRequest, LoginResponse, User } from './types'

// Сервис для работы с авторизацией
export const authService = {
  // Вход в систему
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      // В реальном проекте будет так:
      // const response = await api.post<LoginResponse>('/auth/login', credentials)
      // return response.data
      
      // Временная заглушка (для тестирования, пока нет бэкенда)
      // Удалить когда появится реальное API
      console.log('API call to /auth/login:', credentials)
      
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Проверка для mock-данных
      if (credentials.email === 'demo@company.ru' && credentials.password === '123456') {
        return {
          success: true,
          token: 'mock_jwt_token_' + Date.now(),
          user: {
            id: 1,
            email: credentials.email,
            name: 'Иван Иванов',
            role: 'admin',
            company: 'Транспортная компания',
          },
        }
      }
      
      throw new Error('Неверный email или пароль')
    } catch (error) {
      console.error('Login API error:', error)
      throw error
    }
  },

  // Выход из системы
  async logout(): Promise<void> {
    try {
      // Опционально: отправить запрос на сервер для инвалидации токена
      // await api.post('/auth/logout')
      
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    } catch (error) {
      console.error('Logout API error:', error)
    }
  },

  // Получение текущего пользователя
  async getCurrentUser(): Promise<User | null> {
    try {
      // В реальном проекте:
      // const response = await api.get<User>('/auth/me')
      // return response.data
      
      const storedUser = localStorage.getItem('auth_user')
      return storedUser ? JSON.parse(storedUser) : null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Обновление токена
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

// Простая заглушка для других API сервисов (будем добавлять позже)
export const waybillsService = {
  async getAll() {
    const response = await api.get('/waybills')
    return response.data
  },
  
  async getById(id: number) {
    const response = await api.get(`/waybills/${id}`)
    return response.data
  },
  
  async create(data: any) {
    const response = await api.post('/waybills', data)
    return response.data
  },
  
  async update(id: number, data: any) {
    const response = await api.put(`/waybills/${id}`, data)
    return response.data
  },
  
  async delete(id: number) {
    const response = await api.delete(`/waybills/${id}`)
    return response.data
  },
}