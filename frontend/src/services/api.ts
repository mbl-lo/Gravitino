import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ApiError } from './types'

// Создаём экземпляр axios с базовыми настройками
const api: AxiosInstance = axios.create({
  baseURL: '/api',           // Будет проксироваться через Vite
  timeout: 30000,            // Таймаут 30 секунд
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// 📥 Интерсептор запроса (добавляет токен авторизации)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 📤 Интерсептор ответа (обрабатывает ошибки)
api.interceptors.response.use(
  (response) => {
    // Успешный ответ
    return response
  },
  (error: AxiosError<ApiError>) => {
    // Обработка ошибок
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Не авторизован - очищаем localStorage и перенаправляем на логин
          console.error('Unauthorized: Token expired or invalid')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          window.location.href = '/'
          break
          
        case 403:
          console.error('Forbidden: Insufficient permissions')
          break
          
        case 404:
          console.error('Not found:', error.config?.url)
          break
          
        case 500:
          console.error('Server error:', data?.message || 'Internal server error')
          break
          
        default:
          console.error(`HTTP ${status}:`, data?.message || error.message)
      }
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      console.error('Network error: No response from server', error.request)
    } else {
      // Ошибка при настройке запроса
      console.error('Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api