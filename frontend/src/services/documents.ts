import api from './api'

export interface Driver {
  name: string
  employee_number: string
}

export interface Vehicle {
  model: string
  license_plate: string
}

export interface Mileage {
  odometer_start: number
  odometer_end: number
  calculated: number
}

export interface Fuel {
  start_balance: number
  issued: number
  end_balance: number
  deviation_percent: number
}

export interface Anomaly {
  type: string
  severity: string
}

export interface OcrResult {
  document_id: string
  date: string
  organization: string
  driver: Driver
  vehicle: Vehicle
  mileage: Mileage
  fuel: Fuel
  anomalies: Anomaly[]
  ocr_accuracy?: number
}

export interface Document {
  id: string
  uploadedById: string
  driverId: string | null
  vehicleId: string | null
  documentNumber: string | null
  tripDate: string | null
  originalFileUrl: string
  originalFileName: string
  fileMimeType: string
  fileSize: number
  status: string
  ocrStatus: string
  ocrConfidence: number | null
  hasAnomalies: boolean
  confirmedAt: string | null
  confirmedById: string | null
  createdAt: string
  updatedAt: string
}

export const documentsService = {
  // Получить список документов
  async getDocumentsList(): Promise<Document[]> {
    const response = await api.get('/documents')
    return response.data
  },

  // Получить документ по ID
  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`)
    return response.data
  },

  // Получить OCR результат
  async getOcrResult(id: string): Promise<OcrResult | null> {
    try {
      const response = await api.get(`/documents/${id}/ocr`)
      return response.data
    } catch {
      return null
    }
  },

  // Запустить OCR обработку
  async runOcr(id: string): Promise<OcrResult> {
    const response = await api.post(`/documents/${id}/ocr`)
    return response.data
  },

  // Получить ссылку на файл
  getFileUrl(id: string): string {
    return `http://localhost:3000/documents/${id}/file`
  },
}