import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ExportOutlined,
  FileImageOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { getQueue, runOcr } from '../services/api'
import { Document, DocumentField } from '../services/documents'
import './QueuePage.css'

type QueueStatus = 'all' | 'uploaded' | 'processing' | 'needs_review' | 'confirmed' | 'error'

type QueueRow = Document & {
  displayStatus: Exclude<QueueStatus, 'all'>
  progress: number
}

type AppliedFilters = {
  fromDate: string
  toDate: string
  driver: string
  vehicle: string
}

const statusTabs: Array<{ value: QueueStatus; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'uploaded', label: 'В очереди' },
  { value: 'processing', label: 'Распознаются' },
  { value: 'needs_review', label: 'Требуют проверки' },
  { value: 'confirmed', label: 'Завершены' },
  { value: 'error', label: 'Ошибки' },
]

const statusMeta: Record<QueueRow['displayStatus'], { label: string; className: string }> = {
  uploaded: { label: 'В очереди', className: 'queue-status-uploaded' },
  processing: { label: 'Распознаётся', className: 'queue-status-processing' },
  needs_review: { label: 'Требует проверки', className: 'queue-status-review' },
  confirmed: { label: 'Готово', className: 'queue-status-confirmed' },
  error: { label: 'Ошибка OCR', className: 'queue-status-error' },
}

const getDisplayStatus = (doc: Document): QueueRow['displayStatus'] => {
  if (doc.ocrStatus === 'processing' || doc.status === 'processing') return 'processing'
  if (doc.ocrStatus === 'error' || doc.status === 'error') return 'error'
  if (doc.status === 'confirmed' || doc.status === 'processed') return 'confirmed'
  if (doc.status === 'needs_review' || doc.hasAnomalies) return 'needs_review'
  if (doc.ocrStatus === 'completed') return 'confirmed'
  return 'uploaded'
}

const getFieldValue = (fields: DocumentField[] | undefined, key: string) => {
  const field = fields?.find(item => item.fieldKey === key)
  return field?.correctedValue || field?.recognizedValue || '—'
}

const abbreviateName = (fullName: string) => {
  if (fullName === '—') return fullName
  const [lastName, firstName, middleName] = fullName.trim().split(/\s+/)
  if (!firstName) return lastName
  const initials = [firstName, middleName].filter(Boolean).map(part => `${part[0]}.`).join('')
  return `${lastName} ${initials}`
}

const formatDate = (doc: QueueRow) => {
  const recognizedDate = getFieldValue(doc.fields, 'date')
  if (recognizedDate !== '—') return new Date(recognizedDate).toLocaleDateString('ru-RU')
  if (doc.tripDate) return new Date(doc.tripDate).toLocaleDateString('ru-RU')
  if (doc.createdAt) return new Date(doc.createdAt).toLocaleDateString('ru-RU')
  return '—'
}

const formatAccuracy = (confidence: number | null) => {
  if (typeof confidence !== 'number') return null
  return confidence <= 1 ? Math.round(confidence * 100) : Math.round(confidence)
}

const exportDocumentJson = (doc: QueueRow) => {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = `${doc.documentNumber || doc.id}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const QueuePage = () => {
  const [documents, setDocuments] = useState<QueueRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState<QueueStatus>('all')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [queueMessage, setQueueMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [filters, setFilters] = useState<AppliedFilters>({ fromDate: '', toDate: '', driver: '', vehicle: '' })
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ fromDate: '', toDate: '', driver: '', vehicle: '' })
  const fetchQueueRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const fetchQueue = useCallback(async () => {
    try {
      const response = await getQueue()
      const mappedData = (response.data as unknown as Document[]).map((doc) => {
        const displayStatus = getDisplayStatus(doc)
        return {
          ...doc,
          displayStatus,
          progress: displayStatus === 'processing' ? 65 : displayStatus === 'confirmed' ? 100 : 0,
        }
      })

      setDocuments(mappedData)
    } catch (err) {
      console.error('Ошибка загрузки очереди:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueueRef.current = fetchQueue
  }, [fetchQueue])

  useEffect(() => {
    fetchQueueRef.current()
    const interval = setInterval(() => fetchQueueRef.current(), 3000)
    return () => clearInterval(interval)
  }, [])

  const handleRunOcr = async (documentId: string) => {
    if (processingIds.has(documentId)) return
    setQueueMessage(null)
    setProcessingIds(prev => new Set(prev).add(documentId))
    try {
      await runOcr(documentId)
      setQueueMessage({ text: 'OCR запущен для документа', isError: false })
    } catch (err) {
      setQueueMessage({ text: 'Не удалось запустить OCR. Попробуйте еще раз.', isError: true })
      console.error('Ошибка запуска OCR:', err)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(documentId)
        return next
      })
      fetchQueue()
    }
  }

  const handleReset = () => {
    const emptyFilters = { fromDate: '', toDate: '', driver: '', vehicle: '' }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const filteredDocuments = documents.filter(doc => {

    if (appliedFilters.driver.trim()) {
      const driver = getFieldValue(doc.fields, 'driver_name').toLowerCase()
      if (!driver.includes(appliedFilters.driver.trim().toLowerCase())) return false
    }

    if (activeStatus !== 'all' && doc.displayStatus !== activeStatus) return false

    const createdDate = doc.createdAt ? doc.createdAt.slice(0, 10) : ''
    if (appliedFilters.fromDate && createdDate && createdDate < appliedFilters.fromDate) return false
    if (appliedFilters.toDate && createdDate && createdDate > appliedFilters.toDate) return false

    const vehicle = `${getFieldValue(doc.fields, 'vehicle_plate')} ${getFieldValue(doc.fields, 'vehicle_model')}`.toLowerCase()
    if (appliedFilters.vehicle.trim() && !vehicle.includes(appliedFilters.vehicle.trim().toLowerCase())) return false

    return true
  })

  return (
    <div className="queue-page">
      <div className="queue-header">
        <h1>Очередь обработки</h1>
        <p>Мониторинг процесса распознавания документов</p>
      </div>

      <div className="queue-tabs-card">
        <div className="queue-tabs">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              type="button"
              className={`queue-tab ${activeStatus === tab.value ? 'queue-tab-active' : ''}`}
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="queue-filter-card">
        <div className="queue-filters-grid">
          <div className="queue-filter-field">
            <label>Дата от</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={event => setFilters(prev => ({ ...prev, fromDate: event.target.value }))}
            />
          </div>
          <div className="queue-filter-field">
            <label>Дата до</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={event => setFilters(prev => ({ ...prev, toDate: event.target.value }))}
            />
          </div>
          <div className="queue-filter-field">
              <label>Водитель</label>
              <input
                type="text"
                placeholder="ФИО водителя"
                value={filters.driver}
                onChange={event => setFilters(prev => ({ ...prev, driver: event.target.value }))}
              />
            </div>
          <div className="queue-filter-field">
            <label>Автомобиль</label>
            <input
              type="text"
              placeholder="Номер авто"
              value={filters.vehicle}
              onChange={event => setFilters(prev => ({ ...prev, vehicle: event.target.value }))}
            />
          </div>
          <div className="queue-filter-actions">
            <button type="button" className="queue-apply-button" onClick={() => setAppliedFilters(filters)}>
              Применить
            </button>
            <button type="button" className="queue-reset-button" onClick={handleReset}>
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {queueMessage && (
        <div className={`queue-message ${queueMessage.isError ? 'queue-message-error' : 'queue-message-success'}`}>
          {queueMessage.text}
        </div>
      )}

      <div className="queue-table-card">
        <div className="queue-table-scroll">
          <table className="queue-table">
            <thead>
              <tr>
                <th>ID документа</th> 
                <th>Фото/скан</th>
                <th>Водитель</th>
                <th>Автомобиль</th>
                <th>Дата</th>
                <th>Статус OCR</th>
                <th>Точность</th>
                <th>Аномалии</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="queue-state-cell">Загрузка очереди...</td>
                </tr>
              ) : filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="queue-state-cell">Документы не найдены.</td>
                </tr>
              ) : (
                filteredDocuments.map(doc => {
                  const status = statusMeta[doc.displayStatus]
                  const accuracy = formatAccuracy(doc.ocrConfidence)
                  const anomaliesCount = doc.anomalies?.length || (doc.hasAnomalies ? 1 : 0)
                  const documentLabel = doc.documentNumber || getFieldValue(doc.fields, 'document_number') || doc.id
                  const busy = processingIds.has(doc.id)

                  return (
                    <tr key={doc.id}>
                      <td>
                        <Link className="queue-doc-link" to={`/documents/${doc.id}`}>
                          {documentLabel !== '—' ? documentLabel : doc.id}
                        </Link>
                      </td>
                      <td>
                        <div className="queue-scan-thumb">
                          <FileImageOutlined />
                        </div>
                      </td>
                      <td className="queue-primary-cell">{abbreviateName(getFieldValue(doc.fields, 'driver_name'))}</td>
                      <td className="queue-vehicle-cell">{getFieldValue(doc.fields, 'vehicle_plate')}</td>
                      <td className="queue-muted-cell">{formatDate(doc)}</td>
                      <td>
                        <div className="queue-status-cell">
                          <span className={`queue-status-badge ${status.className}`}>{status.label}</span>
                          {doc.displayStatus === 'processing' && (
                            <div className="queue-progress">
                              <div className="queue-progress-fill" style={{ width: `${doc.progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {accuracy === null ? (
                          <span className="queue-dash">—</span>
                        ) : (
                          <span className={`queue-accuracy ${accuracy >= 95 ? 'queue-accuracy-good' : accuracy >= 80 ? 'queue-accuracy-warn' : 'queue-accuracy-bad'}`}>
                            {accuracy}%
                          </span>
                        )}
                      </td>
                      <td>
                        {anomaliesCount > 0 ? (
                          <span className="queue-anomaly-badge">{anomaliesCount}</span>
                        ) : (
                          <span className="queue-dash">—</span>
                        )}
                      </td>
                      <td>
                        <div className="queue-row-actions">
                          <Link className="queue-icon-button" title="Открыть" to={`/documents/${doc.id}`}>
                            <ExportOutlined />
                          </Link>
                          <button
                            type="button"
                            className="queue-icon-button"
                            title="Повторить OCR"
                            onClick={() => handleRunOcr(doc.id)}
                            disabled={busy}
                          >
                            <ReloadOutlined spin={busy} />
                          </button>
                          <button
                            type="button"
                            className="queue-icon-button"
                            title="Экспорт"
                            onClick={() => exportDocumentJson(doc)}
                          >
                            <FileTextOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QueuePage
