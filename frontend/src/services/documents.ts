import api from './api'

export interface DocumentField {
  fieldKey: string
  fieldLabel: string
  recognizedValue: string
  confidence?: number
}

export interface Anomaly {
  type: string
  severity: string
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
  fields?: DocumentField[]
  anomalies?: Anomaly[]
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
  async runOcr(id: string): Promise<OcrResult> {
    const response = await api.post(`/documents/${id}/run-ocr`)
    return response.data
  },

  // Получить ссылку на файл
  getFileUrl(id: string): string {
    return `http://localhost:3000/documents/${id}/file`
  },
}