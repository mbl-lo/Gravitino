import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
})

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

export const uploadDocuments = (files: File[], metadata: { documentType: string; division: string; tripDate: string }) => {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const userStr = localStorage.getItem('auth_user')
  const user = userStr ? JSON.parse(userStr) : {}
  formData.append('uploadedById', user.id)
  formData.append('documentType', metadata.documentType)
  formData.append('division', metadata.division)
  
  if (metadata.tripDate) {
    formData.append('tripDate', metadata.tripDate)
  }
  
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, 
  })
}

// --- ОЧЕРЕДЬ ОБРАБОТКИ (QueuePage) ---

export interface QueueDocument {
  id: string
  name: string
  size: number
  status: 'uploaded' | 'processing' | 'needs_review' | 'confirmed' | 'error'
  progress: number
  added: string
}

export const getQueue = () => {
  return api.get<QueueDocument[]>('/documents')
}

export const removeFromQueue = (id: string) => {
  return api.delete(`/documents/${encodeURIComponent(id)}`)
}

export const clearCompleted = () => {
  return api.delete('/documents/completed')
}

export const runOcr = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/run-ocr`)
}

export const validateDocument = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/validate`)
}

export const confirmDocument = (documentId: string) => {
  return api.post(`/documents/${encodeURIComponent(documentId)}/confirm`)
}

// --- ДАШБОРД (DashboardPage) ---

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

export interface RecentDocument {
  id: string
  name: string
  date: string
  status: 'waiting' | 'processing' | 'completed' | 'error'
}

export interface DailyStats {
  day: string
  count: number
}

export const getDashboardStats = () => {
  return api.get<DashboardStats>('/dashboard/stats')
}

export const getDashboardTrends = () => {
  return api.get('/dashboard/trends')
}

export const getRecentDocuments = (limit: number = 5) => {
  return api.get<RecentDocument[]>(`/dashboard/recent?limit=${limit}`)
}

export const getDailyStats = () => {
  return api.get<DailyStats[]>('/dashboard/daily')
}

// --- АНОМАЛИИ ---

export const getAnomalies = () => {
  return api.get('/documents/anomalies/all')
}

// ============================================================
// ОБУЧАЮЩИЕ ДАННЫЕ (TrainingPage)
// ============================================================

export interface TrainingStats {
  labeledFields: number
  modelAccuracy: number
  needsLabeling: number
  lastTraining: string
}

export interface LabeledField {
  id: string
  documentId: string
  fieldType: string
  ocrValue: string
  correctValue: string
  confidence: number
  difficulty: 'easy' | 'medium' | 'hard'
  labeledAt: string
  labeledBy: string
}

export interface TrainingDocument {
  id: string
  name: string
  fields: LabeledField[]
  totalFields: number
  labeledFields: number
}

export const getTrainingStats = () => api.get<TrainingStats>('/documents/training/statistics')

export const getTrainingDocuments = () => api.get<TrainingDocument[]>('/documents/training/documents')

export const getTrainingDocument = (documentId: string) =>
  api.get<TrainingDocument>(`/documents/training/documents/${encodeURIComponent(documentId)}`)

export const saveLabeledField = (field: Omit<LabeledField, 'id' | 'labeledAt' | 'labeledBy'>) => {
  return api.post<LabeledField>('/training/fields', field)
}

export const confirmTraining = (documentId: string) =>
  api.post(`/documents/training/documents/${encodeURIComponent(documentId)}/confirm-labeling`)

export const addToTrainingSet = (documentId: string) =>
  api.post(`/documents/training/documents/${encodeURIComponent(documentId)}/add-to-training-set`)

export const startTraining = () => {
  return api.post('/training/start')
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

export const getSystemSettings = () => {
  return api.get<SystemSettings>('/settings')
}

export const updateSystemSettings = (settings: SystemSettings) => {
  return api.post('/settings', settings)
}

export const getUsers = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return api.get<any[]>('/users')
}

export const rejectAnomaly = (anomalyId: string) => {
  const userStr = localStorage.getItem('auth_user')
  const user = userStr ? JSON.parse(userStr) : {}
  return api.patch(`/anomalies/${anomalyId}/reject`, { userId: user.id })
}

export default api