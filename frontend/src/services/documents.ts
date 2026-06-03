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
  async getDocumentsList(): Promise<Document[]> {
    const response = await api.get('/documents');
    return response.data;
  },

  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  async runOcr(id: string): Promise<any> {
    const response = await api.post(`/documents/${id}/run-ocr`);
    return response.data;
  },

  async getOcrResult(id: string): Promise<any> {
    try {
      const response = await api.get(`/documents/${id}/ocr`);
      return response.data;
    } catch (error) {
      console.error('Ошибка получения OCR результата:', error);
      return null;
    }
  },

  getFileUrl(id: string): string {
    return `/api/documents/${id}/file`;
  },
};

// Обновить поле документа
export const updateDocumentField = async (id: string, fieldKey: string, value: string) => {
  const response = await api.patch(`/documents/${id}/fields/${fieldKey}`, { value });
  return response.data;
};