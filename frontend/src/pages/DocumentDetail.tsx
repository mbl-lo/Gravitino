import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  AimOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  RightOutlined,
  SaveOutlined,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
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
  const [editedFields, setEditedFields] = useState<Record<string, string>>({})

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
      const updatePromises = Object.entries(editedFields).map(([fieldKey, value]) =>
        updateDocumentField(id, fieldKey, value)
      );
      
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      await documentsService.validateDocument(id)
      setActionMessage('Изменения успешно сохранены, документ перепроверен')
      setEditedFields({});
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
    if (editedFields[key] !== undefined) return editedFields[key];
    
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
  if (document?.status === 'confirmed') return '#16a34a'
  if (document?.status === 'processing') return '#2563eb'
  if (document?.hasAnomalies || document?.status === 'needs_review') return '#F59E0B'
  if (document?.status === 'processed') return '#16a34a' // Зеленый для успешной проверки
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

  if (loading) return <div style={styles.loading}>Загрузка...</div>

  if (error || !document) return (
    <div style={styles.errorContainer}>
      <p style={styles.errorText}>{error || 'Документ не найден'}</p>
      <button onClick={() => navigate('/archive')} style={styles.backButton}>Вернуться к архиву</button>
    </div>
  )

  const v = (key: string) => getFieldValue(key)
  const documentNumber = v('document_number')
  const calculatedMileage =
    v('odometer_end') !== '—' && v('odometer_start') !== '—'
      ? `${parseInt(v('odometer_end')) - parseInt(v('odometer_start'))} км`
      : '—'

  return (
    <div style={styles.container}>
      <div style={styles.breadcrumbs}>
        <Link to="/archive" style={styles.breadcrumbLink}>Архив</Link>
        <RightOutlined style={styles.breadcrumbSeparator} />
        <span style={styles.breadcrumbCurrent}>{documentNumber || 'Документ'}</span>
      </div>

      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Путевой лист {documentNumber}</h1>
          <span style={{ ...styles.statusBadge, color: getStatusColor() }}>{getStatusText()}</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleValidate} disabled={isValidating || isConfirming}
            style={{ ...styles.saveButton, opacity: (isValidating || isConfirming) ? 0.6 : 1, cursor: (isValidating || isConfirming) ? 'not-allowed' : 'pointer' }}>
            <SaveOutlined style={styles.buttonIcon} />
            {isValidating ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button onClick={handleConfirm} disabled={isConfirming || isValidating}
            style={{ ...styles.confirmButton, opacity: (isConfirming || isValidating) ? 0.6 : 1, cursor: (isConfirming || isValidating) ? 'not-allowed' : 'pointer' }}>
            <CheckCircleOutlined style={styles.buttonIcon} />
            {isConfirming ? 'Сохранение...' : 'Подтвердить данные'}
          </button>
          <button onClick={handleExportJson} style={styles.exportButton}>
            <FileTextOutlined style={styles.buttonIcon} />
            Экспорт JSON
          </button>
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
                <span style={styles.imagePlaceholderIcon}><FileTextOutlined /></span>
                <p>Нет изображения</p>
                <a href={documentsService.getFileUrl(document.id)} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>Скачать файл</a>
              </div>
            )}
          </div>
        </div>

        <div style={styles.rightColumn}>
          <Section title="Основные данные" titleIcon={<AimOutlined style={styles.sectionTitleIcon} />} fields={[
            ['ID документа', documentNumber, true], ['Дата', 'date'], ['Организация', 'organization'],
            ['Подразделение', 'division'], ['Водитель', 'driver_name'], ['Табельный номер', 'driver_number'],
            ['Автомобиль', 'vehicle_model'], ['Госномер', 'vehicle_plate'],
            ['Маршрут', 'route'],
          ]} doc={document} onChangeField={(key, value) => setEditedFields(prev => ({ ...prev, [key]: value }))} v={v} />

          <Section title="Пробег" fields={[
            ['Спидометр при выезде', 'odometer_start'], ['Спидометр при возвращении', 'odometer_end'],
            ['Расчетный пробег', calculatedMileage, true],
            ['Пробег по маршруту', 'mileage'],
          ]} doc={document} onChangeField={(key, value) => setEditedFields(prev => ({ ...prev, [key]: value }))} v={v} />

          <Section title="Топливо" fields={[
            ['Остаток при выезде', 'fuel_start'], ['Выдано топлива', 'fuel_issued'],
            ['Остаток при возвращении', 'fuel_end'], ['Расчетный расход', 'fuel_consumption'],
            ['Норма расхода', 'fuel_rate'],
            ['Отклонение', 'fuel_deviation'],
          ]} doc={document} onChangeField={(key, value) => setEditedFields(prev => ({ ...prev, [key]: value }))} v={v} />

          <Section title="Время работы" fields={[
            ['Время выезда', 'departure_time'], ['Время возвращения', 'arrival_time'],
            ['Общее время работы', 'total_hours'], ['Время простоя', 'downtime_hours'],
          ]} doc={document} onChangeField={(key, value) => setEditedFields(prev => ({ ...prev, [key]: value }))} v={v} />

          <div style={styles.section}>
            <h3 style={styles.signatureTitle}>Подписи и отметки</h3>
            <div style={styles.signatureList}>
              {[
                ['Подпись водителя', v('signature_driver'), true],
                ['Подпись механика', v('signature_mechanic'), true],
                ['Подпись диспетчера', v('signature_dispatcher'), true],
                ['Медосмотр пройден', v('medical_check'), false],
              ].map(([label, val, isDisabled], i) => {
                const borderColor = val === 'Распознана' ? '#16A34A' : val === 'Не распознана' ? '#DC2626' : '#E5E7EB'
                return (
                  <div style={styles.signatureRow} key={i}>
                    <label style={styles.signatureLabel}>{label}</label>
                    <input
                      type="text"
                      disabled={Boolean(isDisabled)}
                      value={String(val)}
                      readOnly
                      style={{
                        ...styles.signatureInput,
                        borderColor,
                        ...(isDisabled ? styles.signatureInputDisabled : {}),
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={styles.validationSection}>
            <h2 style={styles.sectionTitle}>Проверка данных</h2>
            {[
              ['success', 'Пробег рассчитан корректно'],
              ['danger', 'Расход топлива выше нормы на 18%'],
              ['warning', 'Подпись механика не распознана'],
              ['success', 'Время возвращения позже времени выезда'],
            ].map(([type, text], i) => (
              <div style={styles.validationItem} key={i}>
                <span style={{
                  ...styles.validationIcon,
                  ...(type === 'success' ? styles.successText : type === 'danger' ? styles.dangerText : styles.warningText),
                }}>
                  {type === 'success' ? <CheckCircleOutlined /> : type === 'danger' ? <WarningOutlined /> : <ExclamationCircleOutlined />}
                </span>
                <span style={{
                  ...styles.validationText,
                  ...(type === 'success' ? styles.successText : type === 'danger' ? styles.dangerText : styles.warningText),
                }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={styles.aiCommentSection}>
            <h3 style={styles.aiCommentTitle}>
              <StarOutlined style={styles.aiCommentIcon} />
              ИИ-комментарий
            </h3>
            <p style={styles.commentText}>Система обнаружила повышенный расход топлива относительно нормы. Рекомендуется проверить маршрут, фактическую заправку и корректность показаний спидометра.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const getFieldConfidence = (doc: Document, key: string) => {
  const confidence = doc.fields?.find(field => field.fieldKey === key)?.confidence
  if (typeof confidence !== 'number') return null
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
}

const getFieldBorderColor = (key: string, isStatic?: boolean) => {
  if (isStatic || ['date', 'organization', 'division', 'driver_name', 'driver_number', 'vehicle_model', 'vehicle_plate', 'route'].includes(key)) return '#E5E7EB'
  if (['fuel_consumption', 'fuel_deviation'].includes(key)) return '#DC2626'
  if (['mileage', 'fuel_start', 'fuel_end', 'arrival_time', 'downtime_hours'].includes(key)) return '#F59E0B'
  if (['odometer_start', 'odometer_end', 'fuel_issued', 'departure_time'].includes(key)) return '#16A34A'
  return '#E5E7EB'
}

const Section = ({ title, titleIcon, fields, doc, onChangeField, v }: {
  title: string
  titleIcon?: React.ReactNode
  fields: [string, string, boolean?][]
  doc: Document
  onChangeField: (key: string, val: string) => void
  v: (key: string) => string
}) => (
  <div style={styles.formSection}>
    <h3 style={styles.formSectionTitle}>
      {titleIcon}
      {title}
    </h3>
    <div style={styles.formRows}>
      {fields.map(([label, key, isStatic]) => {
        const value = isStatic ? key : v(key)
        const confidence = !isStatic && title !== 'Основные данные' ? getFieldConfidence(doc, key) : null
        return (
          <div key={`${label}-${key}`}>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>{label}</label>
              <input
                type="text"
                disabled={Boolean(isStatic)}
                value={value === '—' ? '' : value}
                readOnly={Boolean(isStatic)}
                onChange={(event) => {
                  if (!isStatic) {
                    onChangeField(key, event.target.value)
                  }
                }}
                style={{
                  ...styles.formInput,
                  borderColor: getFieldBorderColor(key, isStatic),
                  ...(isStatic ? styles.formInputDisabled : {}),
                }}
              />
            </div>
            {confidence !== null && (
              <div style={styles.confidenceText}>Уверенность: {confidence}%</div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)

const styles = {
  container: { padding: '24px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const, boxSizing: 'border-box' as const },
  breadcrumbs: { marginBottom: '16px', fontSize: '14px', lineHeight: '20px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px' },
  breadcrumbLink: { color: '#6b7280', textDecoration: 'none' },
  breadcrumbSeparator: { width: '16px', height: '16px', fontSize: '16px', color: '#6b7280' },
  breadcrumbCurrent: { color: '#101828', fontWeight: '500' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  titleSection: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const },
  title: { fontSize: '24px', lineHeight: '32px', fontWeight: '700', margin: 0, color: '#101828' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#fffbeb', borderRadius: '9999px', fontSize: '14px', lineHeight: '20px', fontWeight: '500' },
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' as const },
  saveButton: { padding: '8px 16px', backgroundColor: 'white', color: '#101828', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'border-color 0.15s ease' },
  confirmButton: { padding: '8px 16px', backgroundColor: '#16A34A', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.15s ease' },
  exportButton: { padding: '8px 16px', backgroundColor: 'white', color: '#101828', border: '2px solid #E5E7EB', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'border-color 0.15s ease' },
  buttonIcon: { fontSize: '16px' },
  loading: { textAlign: 'center' as const, padding: '48px', color: '#6b7280' },
  errorContainer: { textAlign: 'center' as const, padding: '48px' },
  errorText: { color: '#ef4444', marginBottom: '16px' },
  successText: { color: '#16a34a' },
  warningText: { color: '#F59E0B' },
  dangerText: { color: '#DC2626' },
  errorTextInline: { color: '#ef4444' },
  backButton: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
  twoColumns: { display: 'flex', gap: '32px', flex: 1, minHeight: 0, overflow: 'hidden' },
  leftColumn: { flex: '1', minWidth: '300px', overflowY: 'auto' as const, height: '100%' },
  rightColumn: { flex: '1', minWidth: '300px', overflowY: 'auto' as const, height: '100%', paddingRight: '8px' },
  imageContainer: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center' as const },
  documentImage: { width: '100%', height: 'auto', objectFit: 'contain' as const, borderRadius: '8px', display: 'block' },
  imagePlaceholder: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#9ca3af' },
  imagePlaceholderIcon: { fontSize: '64px', marginBottom: '16px' },
  downloadLink: { color: '#3b82f6', textDecoration: 'none', marginTop: '12px' },
  section: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  formSection: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  formSectionTitle: { fontSize: '18px', lineHeight: '28px', fontWeight: '600', color: '#101828', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  sectionTitleIcon: { fontSize: '20px', color: '#2563EB' },
  formRows: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', alignItems: 'center' },
  formLabel: { fontSize: '14px', lineHeight: '20px', color: '#4b5563' },
  formInput: { gridColumn: 'span 2 / span 2', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', lineHeight: '20px', color: '#101828', backgroundColor: 'white', outline: 'none' },
  formInputDisabled: { backgroundColor: '#f9fafb' },
  confidenceText: { fontSize: '12px', lineHeight: '16px', color: '#6b7280', textAlign: 'right' as const, marginTop: '4px' },
  validationSection: { backgroundColor: '#f9fafb', borderRadius: '20px', padding: '24px', marginBottom: '20px' },
  aiCommentSection: { backgroundColor: '#eff6ff', border: '2px solid #2563EB', borderRadius: '20px', padding: '24px', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', lineHeight: '28px', fontWeight: '600', color: '#101828', margin: '0 0 16px 0' },
  signatureTitle: { fontSize: '18px', lineHeight: '28px', fontWeight: '600', color: '#101828', margin: '0 0 16px 0' },
  signatureList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  signatureRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px', alignItems: 'center' },
  signatureLabel: { fontSize: '14px', lineHeight: '20px', color: '#4b5563' },
  signatureInput: { gridColumn: 'span 2 / span 2', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', lineHeight: '20px', color: '#101828', backgroundColor: 'white', outline: 'none' },
  signatureInputDisabled: { backgroundColor: '#f9fafb' },
  infoGrid: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  infoRow: { display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' as const },
  infoLabel: { width: '180px', fontWeight: '500', color: '#6b7280', flexShrink: 0 },
  infoValue: { flex: 1, color: '#1f2937' },
  validationItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' },
  validationIcon: { width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', marginTop: '2px' },
  validationText: { fontSize: '14px', lineHeight: '20px' },
  aiCommentTitle: { fontSize: '18px', lineHeight: '28px', fontWeight: '600', color: '#101828', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' },
  aiCommentIcon: { fontSize: '20px', color: '#2563EB' },
  commentText: { color: '#374151', fontSize: '14px', lineHeight: '20px', margin: 0 },
}

export default DocumentDetail
