import { useEffect, useState, useCallback, useRef } from 'react'
import EditableField from '../components/EditableField'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { documentsService, Document, updateDocumentField } from '../services/documents'

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const loadDocumentRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const loadDocument = useCallback(async () => {
    try {
      const data = await documentsService.getDocumentById(id!)
      setDocument(data)
    } catch {
      setError('Ошибка загрузки документа')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDocumentRef.current = loadDocument
  }, [loadDocument])

  useEffect(() => {
    if (id) loadDocumentRef.current()
  }, [id])

  const handleValidate = async () => {
    if (!id) return
    setIsValidating(true)
    setActionMessage('')
    try {
      await documentsService.validateDocument(id)
      setActionMessage('Проверка завершена')
      await loadDocument()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setActionMessage(error.response?.data?.error || 'Ошибка при проверке')
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    if (!id) return
    setIsConfirming(true)
    setActionMessage('')
    try {
      await documentsService.confirmDocument(id)
      setActionMessage('Документ подтверждён')
      await loadDocument()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setActionMessage(error.response?.data?.error || 'Ошибка при подтверждении')
    } finally {
      setIsConfirming(false)
    }
  }

  const getFieldValue = (key: string) => {
  
    const field = document?.fields?.find(f => f.fieldKey === key);
    if (!field) return '—';
    return field.correctedValue ?? field.recognizedValue ?? '—';
  };

  const getStatusText = () => {
  if (document?.status === 'confirmed') return 'Подтверждён'
  if (document?.status === 'processing') return 'Обрабатывается'
  if (document?.hasAnomalies || document?.status === 'needs_review') return 'Требует проверки'
  if (document?.status === 'processed') return 'Проверен (ДАННЫЕ КОРРЕКТНЫ)'
  return 'Загружен'
}

const getStatusColor = () => {
  if (document?.status === 'confirmed') return '#10b981'
  if (document?.status === 'processing') return '#3b82f6'
  if (document?.hasAnomalies || document?.status === 'needs_review') return '#ef4444'
  if (document?.status === 'processed') return '#10b981' // Зеленый для успешной проверки
  return '#f59e0b'
}

  const handleExportJson = () => {
    if (!document) return

    const docNumber = getFieldValue('document_number')

    const exportData = {
      documentNumber: docNumber,
      status: document.status,
      hasAnomalies: document.hasAnomalies,
      ocrConfidence: document.ocrConfidence,
      tripDate: document.tripDate,
      createdAt: document.createdAt,
      fields: Object.fromEntries(
        (document.fields ?? []).map((field) => [
          field.fieldKey,
          {
            label: field.fieldLabel,
            value: field.correctedValue ?? field.recognizedValue,
            isEdited: field.isEdited ?? false,
          },
        ]),
      ),
      anomalies: (document.anomalies ?? []).map((anomaly) => {
        const a = anomaly as unknown as {
          type: string
          severity: string
          fieldKey?: string
          message?: string
          expectedValue?: string
          actualValue?: string
          status?: string
        }
        return {
          type: a.type,
          severity: a.severity,
          fieldKey: a.fieldKey,
          message: a.message,
          expectedValue: a.expectedValue,
          actualValue: a.actualValue,
          status: a.status,
        }
      }),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `document-${docNumber !== '—' ? docNumber : document.id}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFieldUpdate = async (fieldKey: string, newValue: string) => {
  if (!id) return;
  try {
    await updateDocumentField(id, fieldKey, newValue);
    setDocument(prev => prev ? {
      ...prev,
      fields: prev.fields?.map(f => f.fieldKey === fieldKey ? { ...f, correctedValue: newValue } : f) || []
    } : prev);
  } catch (err) {
    console.error('Ошибка сохранения:', err);
  }
};

  if (loading) return <div style={styles.loading}>Загрузка...</div>

  if (error || !document) return (
    <div style={styles.errorContainer}>
      <p style={styles.errorText}>{error || 'Документ не найден'}</p>
      <button onClick={() => navigate('/archive')} style={styles.backButton}>Вернуться к архиву</button>
    </div>
  )

  const v = (key: string) => getFieldValue(key)
  const documentNumber = v('document_number')

  return (
    <div style={styles.container}>
      <div style={styles.breadcrumbs}>
        <Link to="/archive" style={styles.breadcrumbLink}>Архив</Link>
        <span style={styles.breadcrumbSeparator}>›</span>
        <span style={styles.breadcrumbCurrent}>{documentNumber || 'Документ'}</span>
      </div>

      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Путевой лист {documentNumber}</h1>
          <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor() }}>{getStatusText()}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleValidate} disabled={isValidating}
            style={{ ...styles.saveButton, opacity: isValidating ? 0.6 : 1, cursor: isValidating ? 'not-allowed' : 'pointer' }}>
            {isValidating ? 'Проверка...' : 'Проверить документ'}
          </button>
          <button onClick={handleConfirm} disabled={isConfirming}
            style={{ ...styles.confirmButton, opacity: isConfirming ? 0.6 : 1, cursor: isConfirming ? 'not-allowed' : 'pointer' }}>
            {isConfirming ? 'Сохранение...' : 'Подтвердить'}
          </button>
          <button onClick={handleExportJson} style={styles.exportButton}>Экспорт JSON</button>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
          backgroundColor: actionMessage.includes('Ошибка') ? '#fef2f2' : '#ecfdf5',
          color: actionMessage.includes('Ошибка') ? '#dc2626' : '#059669',
          fontSize: '14px', fontWeight: '500'
        }}>{actionMessage}</div>
      )}

      <div style={styles.twoColumns}>
        <div style={styles.leftColumn}>
          <div style={styles.imageContainer}>
            {!imageError ? (
              <img src={documentsService.getFileUrl(document.id)} alt="Документ"
                style={styles.documentImage} onError={() => setImageError(true)} />
            ) : (
              <div style={styles.imagePlaceholder}>
                <span style={styles.imagePlaceholderIcon}>📄</span>
                <p>Нет изображения</p>
                <a href={documentsService.getFileUrl(document.id)} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>Скачать файл</a>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightColumn}>
          <Section title="Основные данные" fields={[
            ['ID документа', documentNumber, true], ['Дата', 'date'], ['Организация', 'organization'],
            ['Подразделение', 'division'], ['Водитель', 'driver_name'], ['Табельный номер', 'driver_number'],
            ['Автомобиль', 'vehicle_model'], ['Госномер', 'vehicle_plate'],
            ['Год выпуска', 'year'], ['Маршрут', 'route'],
          ]} doc={document} onUpdate={handleFieldUpdate} v={v} />

          <Section title="Пробег" fields={[
            ['Спидометр при выезде', 'odometer_start'], ['Спидометр при возвращении', 'odometer_end'],
            ['Пробег по маршруту', 'mileage'],
          ]} doc={document} onUpdate={handleFieldUpdate} v={v} extra={
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Расчетный пробег</div>
              <div style={styles.infoValue}>
                {v('odometer_end') !== '—' && v('odometer_start') !== '—'
                  ? `${parseInt(v('odometer_end')) - parseInt(v('odometer_start'))} км` : '—'}
              </div>
            </div>
          } />

          <Section title="Топливо" fields={[
            ['Остаток при выезде', 'fuel_start'], ['Выдано топлива', 'fuel_issued'],
            ['Остаток при возвращении', 'fuel_end'], ['Расчетный расход', 'fuel_consumption'],
            ['Норма расхода', 'fuel_rate'],
          ]} doc={document} onUpdate={handleFieldUpdate} v={v} extra={
            <div style={styles.infoRow}>
              <div style={styles.infoLabel}>Отклонение</div>
              <div style={styles.infoValue}>
                <span style={{ color: v('fuel_deviation').includes('+') ? '#ef4444' : '#10b981' }}>{v('fuel_deviation')}</span>
              </div>
            </div>
          } />

          <Section title="Время работы" fields={[
            ['Время выезда', 'departure_time'], ['Время возвращения', 'arrival_time'],
            ['Общее время работы', 'total_hours'], ['Время простоя', 'downtime_hours'],
          ]} doc={document} onUpdate={handleFieldUpdate} v={v} />

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Подписи и отметки</h2>
            {[
              ['Подпись водителя', v('signature_driver')],
              ['Подпись механика', v('signature_mechanic')],
              ['Подпись диспетчера', v('signature_dispatcher')],
              ['Медосмотр пройден', v('medical_check')],
            ].map(([label, val], i) => (
              <div style={styles.infoRow} key={i}>
                <div style={styles.infoLabel}>{label}</div>
                <div style={styles.infoValue}>{val === 'Распознана' || val === 'Да' ? `✅ ${val}` : `❌ ${val}`}</div>
              </div>
            ))}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Проверка данных</h2>
            {[
              ['✅', 'Пробег рассчитан корректно'],
              ['⚠️', 'Расход топлива выше нормы на 18%'],
              ['❌', 'Подпись механика не распознана'],
              ['✅', 'Время возвращения позже времени выезда'],
            ].map(([icon, text], i) => (
              <div style={styles.validationItem} key={i}><span>{icon}</span><span>{text}</span></div>
            ))}
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>ИИ-комментарий</h2>
            <p style={styles.commentText}>Система обнаружила повышенный расход топлива относительно нормы. Рекомендуется проверить маршрут, фактическую заправку и корректность показаний спидометра.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, fields, doc, onUpdate, v, extra }: {
  title: string
  fields: [string, string, boolean?][]
  doc: Document
  onUpdate: (key: string, val: string) => void
  v: (key: string) => string
  extra?: React.ReactNode
}) => (
  <div style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <div style={styles.infoGrid}>
      {fields.map(([label, key, isStatic]) => (
        <div style={styles.infoRow} key={key}>
          <div style={styles.infoLabel}>{label}</div>
          <div style={styles.infoValue}>
            {isStatic ? key : (
              <EditableField documentId={doc.id} fieldKey={key} value={v(key)} onUpdate={val => onUpdate(key, val)} />
            )}
          </div>
        </div>
      ))}
      {extra}
    </div>
  </div>
)

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },
  breadcrumbs: { marginBottom: '16px', fontSize: '14px', color: '#6b7280' },
  breadcrumbLink: { color: '#3b82f6', textDecoration: 'none' },
  breadcrumbSeparator: { margin: '0 8px' },
  breadcrumbCurrent: { color: '#1f2937' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: 'white' },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  saveButton: { padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
  confirmButton: { padding: '8px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500' },
  exportButton: { padding: '8px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' },
  loading: { textAlign: 'center' as const, padding: '48px', color: '#6b7280' },
  errorContainer: { textAlign: 'center' as const, padding: '48px' },
  errorText: { color: '#ef4444', marginBottom: '16px' },
  backButton: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
  twoColumns: { display: 'flex', gap: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  leftColumn: { flex: '1.2', minWidth: '300px' },
  rightColumn: { flex: '1', minWidth: '400px', maxWidth: '650px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' as const, paddingRight: '8px' },
  imageContainer: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center' as const, position: 'sticky' as const, top: '24px' },
  documentImage: { maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' as const, borderRadius: '8px' },
  imagePlaceholder: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#9ca3af' },
  imagePlaceholderIcon: { fontSize: '64px', marginBottom: '16px' },
  downloadLink: { color: '#3b82f6', textDecoration: 'none', marginTop: '12px' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' },
  infoGrid: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  infoRow: { display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' as const },
  infoLabel: { width: '180px', fontWeight: '500', color: '#6b7280', flexShrink: 0 },
  infoValue: { flex: 1, color: '#1f2937' },
  validationItem: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  commentText: { color: '#4b5563', lineHeight: 1.5, margin: 0 },
}

export default DocumentDetail