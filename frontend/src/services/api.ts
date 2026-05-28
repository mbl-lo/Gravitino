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

// ============================================================
// ЭНДПОИНТЫ ДЛЯ СТРАНИЦ ЗАГРУЗКИ, ОЧЕРЕДИ И ДАШБОРДА
// ============================================================

// --- ЗАГРУЗКА ФАЙЛОВ (UploadPage) ---

/**
 * Загрузка одного или нескольких файлов на сервер
 * @param files - массив File объектов
 * @returns ответ с массивом загруженных файлов
 */
export const uploadDocuments = (files: File[]) => {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('documents', file)
  })
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // увеличенный таймаут для файлов
  })
}

// --- ОЧЕРЕДЬ ОБРАБОТКИ (QueuePage) ---

/** Тип документа в очереди */
export interface QueueDocument {
  id: string
  name: string
  size: string
  status: 'waiting' | 'processing' | 'completed' | 'error'
  progress: number
  added: string
}

/**
 * Получение текущей очереди обработки
 * @returns массив документов в очереди
 */
export const getQueue = () => {
  return api.get<QueueDocument[]>('/queue')
}

/**
 * Удаление документа из очереди
 * @param id - идентификатор документа
 */
export const removeFromQueue = (id: string) => {
  return api.delete(`/queue/${encodeURIComponent(id)}`)
}

/**
 * Очистка всех завершённых документов из очереди
 */
export const clearCompleted = () => {
  return api.delete('/queue/completed')
}

// --- ДАШБОРД (DashboardPage) ---

/** Тип для карточек статистики */
export interface DashboardStats {
  total: number
  processing: number
  completed: number
  errors: number
  percentChange: {
    total: number
    processing: number
    completed: number
    errors: number
  }
}

/** Тип для элемента последних документов */
export interface RecentDocument {
  id: string
  name: string
  date: string
  status: 'waiting' | 'processing' | 'completed' | 'error'
}

/** Тип для данных графика по дням */
export interface DailyStats {
  day: string
  count: number
}

/**
 * Получение общей статистики для дашборда
 */
export const getDashboardStats = () => {
  return api.get<DashboardStats>('/dashboard/stats')
}

/**
 * Получение списка последних документов
 * @param limit - количество документов (по умолчанию 5)
 */
export const getRecentDocuments = (limit: number = 5) => {
  return api.get<RecentDocument[]>(`/dashboard/recent?limit=${limit}`)
}

/**
 * Получение статистики обработки по дням недели
 */
export const getDailyStats = () => {
  return api.get<DailyStats[]>('/dashboard/daily')
}

export default api