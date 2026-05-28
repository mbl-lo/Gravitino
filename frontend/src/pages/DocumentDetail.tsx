import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsService, Document} from '../services/documents'

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [runningOcr, setRunningOcr] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      loadDocument()
    }
  }, [id])

  const loadDocument = async () => {
    try {
      const data = await documentsService.getDocumentById(id!)
      setDocument(data)
    } catch (err) {
      setError('Ошибка загрузки документа')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunOcr = async () => {
    try {
      setRunningOcr(true)
      await documentsService.runOcr(id!)
      await loadDocument()
    } catch (err) {
      console.error('Ошибка OCR:', err)
    } finally {
      setRunningOcr(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded': return 'Загружен'
      case 'processing': return 'Обрабатывается'
      case 'processed': return 'Обработан'
      case 'failed': return 'Ошибка'
      default: return status
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#eab308'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return <div style={styles.loading}>Загрузка...</div>
  }

  if (error || !document) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error || 'Документ не найден'}</p>
        <button onClick={() => navigate('/archive')} style={styles.backButton}>
          Вернуться к архиву
        </button>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/archive')} style={styles.backButton}>
          ← Назад
        </button>
        <h1 style={styles.title}>Путевой лист</h1>
        <span style={{ ...styles.statusBadge, backgroundColor: document.hasAnomalies ? '#ef4444' : '#10b981' }}>
          {document.hasAnomalies ? 'Есть аномалии' : 'Норма'}
        </span>
      </div>

      <div style={styles.content}>
        {/* Информация о документе */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Информация о документе</h2>
          <div style={styles.infoGrid}>
            <div><strong>ID:</strong> {document.id}</div>
            <div><strong>Название файла:</strong> {document.originalFileName}</div>
            <div><strong>Статус:</strong> {getStatusText(document.status)}</div>
            <div><strong>OCR статус:</strong> {document.ocrStatus}</div>
            <div><strong>Дата загрузки:</strong> {new Date(document.createdAt).toLocaleString('ru-RU')}</div>
            <div><strong>Размер файла:</strong> {formatFileSize(document.fileSize)}</div>
            <div><strong>Тип файла:</strong> {document.fileMimeType}</div>
            {document.ocrConfidence && (
              <div><strong>Точность OCR:</strong> {(document.ocrConfidence * 100).toFixed(1)}%</div>
            )}
          </div>
        </div>

        {/* Файл документа */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📎 Файл документа</h2>
          <a 
            href={documentsService.getFileUrl(document.id)} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={styles.fileLink}
          >
            📄 Открыть файл {document.originalFileName}
          </a>
        </div>

        {/* ДИНАМИЧЕСКИЙ ВЫВОД ПОЛЕЙ OCR */}
        {document.fields && document.fields.length > 0 ? (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📄 Распознанные данные</h2>
            <div style={styles.infoGrid}>
              {document.fields.map(field => (
                <div key={field.fieldKey}>
                  <strong>{field.fieldLabel}:</strong> {field.recognizedValue}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔍 Распознавание</h2>
            <p style={{ color: '#6b7280' }}>
              {document.ocrStatus === 'pending' && 'Документ ожидает распознавания'}
              {document.ocrStatus === 'processing' && 'Распознавание выполняется...'}
              {document.ocrStatus === 'error' && 'Ошибка при распознавании'}
            </p>
            {document.ocrStatus !== 'completed' && (
              <button onClick={handleRunOcr} disabled={runningOcr} style={styles.runOcrButton}>
                {runningOcr ? 'Запуск...' : '🚀 Запустить распознавание'}
              </button>
            )}
          </div>
        )}

        {/* Аномалии */}
        {document.anomalies && document.anomalies.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.anomaliesTitle}>⚠️ Аномалии</h2>
            {document.anomalies.map((anomaly, index) => (
              <div key={index} style={{ ...styles.anomalyCard, borderLeftColor: getSeverityColor(anomaly.severity) }}>
                <div><strong>{anomaly.type}</strong></div>
                <div style={styles.anomalySeverity}>Серьёзность: {anomaly.severity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' as const },
  backButton: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0, flex: 1 },
  statusBadge: { display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: 'white' },
  loading: { textAlign: 'center' as const, padding: '48px', color: '#6b7280' },
  errorContainer: { textAlign: 'center' as const, padding: '48px' },
  errorText: { color: '#ef4444', marginBottom: '16px' },
  content: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' },
  fileLink: { color: '#3b82f6', textDecoration: 'none', display: 'inline-block', padding: '8px 0' },
  runOcrButton: { marginTop: '16px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  anomaliesTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#f59e0b', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' },
  anomalyCard: { padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '8px', borderLeft: '4px solid' },
  anomalySeverity: { fontSize: '12px', color: '#6b7280', marginTop: '4px' },
}

export default DocumentDetail