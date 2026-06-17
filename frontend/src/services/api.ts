import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',  // Прокси на localhost:3000
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,  // Для cookies если нужны
})

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Обрабатываем ошибки
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/'
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
 */
export const uploadDocuments = (files: File[]) => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const userStr = localStorage.getItem('auth_user')
  const user = userStr ? JSON.parse(userStr) : {}
  formData.append('uploadedById', user.id)

  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, 
  })
}

// --- ОЧЕРЕДЬ ОБРАБОТКИ (QueuePage) ---

/** Тип документа в очереди */
// services/api.ts

export interface QueueDocument {
  id: string
  name: string
  size: number
  status: 'uploaded' | 'processing' | 'needs_review' | 'confirmed' | 'error'  // ← обновлено
  progress: number
  added: string
}

/**
 * Получение текущей очереди обработки
 */
export const getQueue = () => {
  return api.get<QueueDocument[]>('/documents')
}

/**
 * Удаление документа из очереди
 * @param id - идентификатор документа
 */
export const removeFromQueue = (id: string) => {
  return api.delete(`/documents/${encodeURIComponent(id)}`)
}

/**
 * Очистка всех завершённых документов из очереди
 */
export const clearCompleted = () => {
  return api.delete('/documents/completed')
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
// --- АНОМАЛИИ ---
export const getAnomalies = () => {
  return api.get('/documents/anomalies/all')
}

// --- ЗАПУСК РАСПОЗНАВАНИЯ (OCR) ---
export const runOcr = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/run-ocr`)
}

// --- ПРОВЕРИТЬ ДОКУМЕНТ (валидация) ---
export const validateDocument = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/validate`)
}

// --- ПОДТВЕРДИТЬ ДОКУМЕНТ ---
export const confirmDocument = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/confirm`)
}

// --- НАСТРОЙКИ СИСТЕМЫ ---

export interface SystemSettings {
  maxFuelDeviation: number
  maxWorkingHours: number
  checkOdometerConsistency: boolean
  autoDetectAnomalies: boolean
  enabledFields: Record<string, boolean>
  ocrMode: string
  minConfidence: number
  autoManualReview: boolean
  auditLog: boolean
  dataRetentionMonths: number
  enable2FA: boolean
}

/** Получить текущие настройки системы */
export const getSystemSettings = () => {
  return api.get<SystemSettings>('/settings')
}

/** Сохранить измененные настройки */
export const updateSystemSettings = (settings: SystemSettings) => {
  return api.post('/settings', settings)
}

/** Получить список всех пользователей системы */
export const getUsers = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return api.get<any[]>('/users')
}

export default api