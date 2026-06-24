import api from '../services/api'
import { Document } from '../services/documents'


export const getAuditDocumentHistory = async (documentId: Document['id']) => {
  const response = await api.get(`/audit/document-history?documentId=${documentId}`)
  return response.data
}