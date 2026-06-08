import api from './api'

export interface DocumentField {
  fieldKey: string
  fieldLabel: string
  recognizedValue: string
  confidence?: number
  correctedValue?: string | null 
  isEdited?: boolean
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
  async getDocumentsList(): Promise<Document[]> {
    const response = await api.get('/documents')
    return response.data
  },

  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`)
    return response.data
  },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async runOcr(id: string): Promise<any> {
    
    const response = await api.post(`/documents/${id}/run-ocr`)
    return response.data
  },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getOcrResult(id: string): Promise<any> {
    try {
      const response = await api.get(`/documents/${id}/ocr`)
      return response.data
    } catch (error) {
      console.error('Ошибка получения OCR результата:', error)
      return null
    }
  },

  getFileUrl(id: string): string {
    return `http://localhost:3000/documents/${id}/file`
  },

  // Проверить документ (валидация)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validateDocument(id: string): Promise<any> {
    const response = await api.post(`/documents/${id}/validate`)
    return response.data
  },

  // Подтвердить документ
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async confirmDocument(id: string): Promise<any> {
    const response = await api.post(`/documents/${id}/confirm`)
    return response.data
  },
}

// Обновить поле документа
export const updateDocumentField = async (id: string, fieldKey: string, value: string) => {
  const response = await api.patch(`/documents/${id}/fields/${fieldKey}`, { value })
  return response.data
}

// Получить список аномалий
export const getAnomalies = async () => {
  const response = await api.get('/anomalies')
  return response.data
}