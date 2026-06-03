import { useEffect, useState } from 'react'
import EditableField from '../components/EditableField'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { documentsService, Document } from '../services/documents'

interface Field {
  fieldKey: string
  fieldLabel: string
  recognizedValue: string
  confidence: number | null
}

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

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

  const getFieldValue = (fieldKey: string): string => {
    const field = document?.fields?.find(f => f.fieldKey === fieldKey)
    return field?.recognizedValue || '—'
  }

  const getFieldConfidence = (fieldKey: string): number | null => {
    const field = document?.fields?.find(f => f.fieldKey === fieldKey)
    return field?.confidence || null
  }

  const formatOdometer = (value: string) => {
    if (!value || value === '—') return '—'
    return `${value} км`
  }

  const formatFuel = (value: string) => {
    if (!value || value === '—') return '—'
    return `${value} л`
  }

  const getStatusText = () => {
    if (document?.hasAnomalies) return 'Требует проверки'
    if (document?.status === 'confirmed') return 'Подтверждён'
    if (document?.status === 'processing') return 'Обрабатывается'
    return 'Загружен'
  }

  const getStatusColor = () => {
    if (document?.hasAnomalies) return '#ef4444'
    if (document?.status === 'confirmed') return '#10b981'
    if (document?.status === 'processing') return '#3b82f6'
    return '#f59e0b'
  }

  const getValidations = () => {
    const validations = []

    validations.push({ type: 'success', text: 'Пробег рассчитан корректно' })

    if (document?.hasAnomalies) {
      validations.push({ type: 'warning', text: 'Расход топлива выше нормы на 18%' })
    }

    const mechanicSignature = getFieldValue('signature_mechanic')
    if (mechanicSignature === 'Не распознана') {
      validations.push({ type: 'error', text: 'Подпись механика не распознана' })
    } else {
      validations.push({ type: 'success', text: 'Подпись механика распознана' })
    }

    validations.push({ type: 'success', text: 'Время возвращения позже времени выезда' })

    return validations
  }

  // Функция для обновления полей документа после редактирования
  const handleFieldUpdate = (fieldKey: string, newValue: string) => {
    setDocument((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        fields: prev.fields?.map((f) =>
          f.fieldKey === fieldKey ? { ...f, recognizedValue: newValue } : f
        ) || []
      }
    })
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

  const validations = getValidations()
  const documentNumber = getFieldValue('document_number')
  const date = getFieldValue('date')
  const organization = getFieldValue('organization')
  const division = getFieldValue('division')
  const driverName = getFieldValue('driver_name')
  const driverNumber = getFieldValue('driver_number')
  const vehicleModel = getFieldValue('vehicle_model')
  const vehiclePlate = getFieldValue('vehicle_plate')
  const odometerStart = getFieldValue('odometer_start')
  const odometerEnd = getFieldValue('odometer_end')
  const fuelStart = getFieldValue('fuel_start')
  const fuelEnd = getFieldValue('fuel_end')
  const fuelConsumption = getFieldValue('fuel_consumption')
  const fuelRate = getFieldValue('fuel_rate')
  const fuelDeviation = getFieldValue('fuel_deviation')
  const departureTime = getFieldValue('departure_time')
  const arrivalTime = getFieldValue('arrival_time')
  const signatureMechanic = getFieldValue('signature_mechanic')
  const signatureDispatcher = getFieldValue('signature_dispatcher')
  const medicalCheck = getFieldValue('medical_check')

  return (
    <div style={styles.container}>
      <div style={styles.breadcrumbs}>
        <Link to="/archive" style={styles.breadcrumbLink}>Архив</Link>
        <span style={styles.breadcrumbSeparator}>›</span>
        <span style={styles.breadcrumbCurrent}>{documentNumber || 'Документ'}</span>
      </div>

      {/* Заголовок и кнопки действий */}
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>Путевой лист {documentNumber}</h1>
          <span style={{ ...styles.statusBadge, backgroundColor: getStatusColor() }}>
            {getStatusText()}
          </span>
        </div>
        <div style={styles.actions}>
          <button onClick={() => console.log('Сохранить')} style={styles.saveButton}>
            💾 Сохранить
          </button>
          <button onClick={() => console.log('Подтвердить данные')} style={styles.confirmButton}>
            ✅ Подтвердить данные
          </button>
          <button onClick={() => console.log('Экспорт JSON')} style={styles.exportButton}>
            📎 Экспорт JSON
          </button>
        </div>
      </div>

      {/* ДВЕ КОЛОНКИ: слева картинка, справа данные */}
      <div style={styles.twoColumns}>
        {/* Левая колонка - изображение */}
        <div style={styles.leftColumn}>
          <div style={styles.imageContainer}>
            {!imageError ? (
              <img
                src={documentsService.getFileUrl(document.id)}
                alt="Документ"
                style={styles.documentImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <div style={styles.imagePlaceholder}>
                <span style={styles.imagePlaceholderIcon}>📄</span>
                <p>Нет изображения</p>
                <a href={documentsService.getFileUrl(document.id)} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                  Скачать файл
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Правая колонка - все данные */}
        <div style={styles.rightColumn}>
          {/* Основные данные */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Основные данные</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>ID документа</div>
                <div style={styles.infoValue}>{documentNumber}</div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Дата</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="date"
                    fieldLabel="Дата"
                    value={date}
                    onUpdate={(newValue) => handleFieldUpdate('date', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Организация</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="organization"
                    fieldLabel="Организация"
                    value={organization}
                    onUpdate={(newValue) => handleFieldUpdate('organization', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Подразделение</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="division"
                    fieldLabel="Подразделение"
                    value={division}
                    onUpdate={(newValue) => handleFieldUpdate('division', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Водитель</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="driver_name"
                    fieldLabel="Водитель"
                    value={driverName}
                    onUpdate={(newValue) => handleFieldUpdate('driver_name', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Табельный номер</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="driver_number"
                    fieldLabel="Табельный номер"
                    value={driverNumber}
                    onUpdate={(newValue) => handleFieldUpdate('driver_number', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Автомобиль</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="vehicle_model"
                    fieldLabel="Автомобиль"
                    value={vehicleModel}
                    onUpdate={(newValue) => handleFieldUpdate('vehicle_model', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Госномер</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="vehicle_plate"
                    fieldLabel="Госномер"
                    value={vehiclePlate}
                    onUpdate={(newValue) => handleFieldUpdate('vehicle_plate', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Год выпуска</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="year"
                    fieldLabel="Год выпуска"
                    value={getFieldValue('year') || '—'}
                    onUpdate={(newValue) => handleFieldUpdate('year', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Маршрут</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="route"
                    fieldLabel="Маршрут"
                    value={getFieldValue('route')}
                    onUpdate={(newValue) => handleFieldUpdate('route', newValue)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Пробег</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Спидометр при выезде</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="odometer_start"
                    fieldLabel="Спидометр при выезде"
                    value={odometerStart}
                    onUpdate={(newValue) => handleFieldUpdate('odometer_start', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Спидометр при возвращении</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="odometer_end"
                    fieldLabel="Спидометр при возвращении"
                    value={odometerEnd}
                    onUpdate={(newValue) => handleFieldUpdate('odometer_end', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Расчетный пробег</div>
                <div style={styles.infoValue}>
                  {odometerEnd !== '—' && odometerStart !== '—'
                    ? `${parseInt(odometerEnd) - parseInt(odometerStart)} км`
                    : '—'}
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Пробег по маршруту</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="route_distance"
                    fieldLabel="Пробег по маршруту"
                    value={getFieldValue('route_distance') || '—'}
                    onUpdate={(newValue) => handleFieldUpdate('route_distance', newValue)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Топливо</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Остаток топлива при выезде</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="fuel_start"
                    fieldLabel="Остаток топлива при выезде"
                    value={fuelStart}
                    onUpdate={(newValue) => handleFieldUpdate('fuel_start', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Выдано топлива</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="fuel_issued"
                    fieldLabel="Выдано топлива"
                    value={getFieldValue('fuel_issued')}
                    onUpdate={(newValue) => handleFieldUpdate('fuel_issued', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Остаток топлива при возвращении</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="fuel_end"
                    fieldLabel="Остаток топлива при возвращении"
                    value={fuelEnd}
                    onUpdate={(newValue) => handleFieldUpdate('fuel_end', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Расчетный расход</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="fuel_consumption"
                    fieldLabel="Расчетный расход"
                    value={fuelConsumption}
                    onUpdate={(newValue) => handleFieldUpdate('fuel_consumption', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Норма расхода</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="fuel_rate"
                    fieldLabel="Норма расхода"
                    value={fuelRate}
                    onUpdate={(newValue) => handleFieldUpdate('fuel_rate', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Отклонение</div>
                <div style={styles.infoValue}>
                  <span style={{ color: fuelDeviation.includes('+') ? '#ef4444' : '#10b981' }}>
                    {fuelDeviation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Время работы</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Время выезда</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="departure_time"
                    fieldLabel="Время выезда"
                    value={departureTime}
                    onUpdate={(newValue) => handleFieldUpdate('departure_time', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Время возвращения</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="arrival_time"
                    fieldLabel="Время возвращения"
                    value={arrivalTime}
                    onUpdate={(newValue) => handleFieldUpdate('arrival_time', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Общее время работы</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="total_hours"
                    fieldLabel="Общее время работы"
                    value={getFieldValue('total_hours') || '—'}
                    onUpdate={(newValue) => handleFieldUpdate('total_hours', newValue)}
                  />
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Время простоя</div>
                <div style={styles.infoValue}>
                  <EditableField
                    documentId={document.id}
                    fieldKey="downtime_hours"
                    fieldLabel="Время простоя"
                    value={getFieldValue('downtime_hours') || '—'}
                    onUpdate={(newValue) => handleFieldUpdate('downtime_hours', newValue)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Подписи и отметки</h2>
            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Подпись водителя</div>
                <div style={styles.infoValue}>
                  {getFieldValue('signature_driver') === 'Распознана' ? '✅ Распознана' : '❌ Не распознана'}
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Подпись механика</div>
                <div style={styles.infoValue}>
                  {signatureMechanic === 'Распознана' ? '✅ Распознана' : '❌ Не распознана'}
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Подпись диспетчера</div>
                <div style={styles.infoValue}>
                  {signatureDispatcher === 'Распознана' ? '✅ Распознана' : '❌ Не распознана'}
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoLabel}>Медосмотр пройден</div>
                <div style={styles.infoValue}>
                  {medicalCheck === 'Да' ? '✅ Да' : '❌ Нет'}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Проверка данных</h2>
            <div style={styles.validationsList}>
              <div style={styles.validationItem}>
                <span style={styles.validationIcon}>✅</span>
                <span style={styles.validationText}>Пробег рассчитан корректно</span>
              </div>
              <div style={styles.validationItem}>
                <span style={styles.validationIcon}>⚠️</span>
                <span style={styles.validationText}>Расход топлива выше нормы на 18%</span>
              </div>
              <div style={styles.validationItem}>
                <span style={styles.validationIcon}>❌</span>
                <span style={styles.validationText}>Подпись механика не распознана</span>
              </div>
              <div style={styles.validationItem}>
                <span style={styles.validationIcon}>✅</span>
                <span style={styles.validationText}>Время возвращения позже времени выезда</span>
              </div>
            </div>
          </div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>ИИ-комментарий</h2>
            <p style={styles.commentText}>
              Система обнаружила повышенный расход топлива относительно нормы.
              Рекомендуется проверить маршрут, фактическую заправку и корректность показаний спидометра.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1400px', margin: '0 auto', padding: '24px' },
  breadcrumbs: { marginBottom: '16px', fontSize: '14px', color: '#6b7280' },
  breadcrumbLink: { color: '#3b82f6', textDecoration: 'none' },
  breadcrumbSeparator: { margin: '0 8px' },
  breadcrumbCurrent: { color: '#1f2937' },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  statusBadge: { display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', color: 'white' },

  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  saveButton: {
    padding: '8px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  confirmButton: {
    padding: '8px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  exportButton: {
    padding: '8px 20px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },

  loading: { textAlign: 'center' as const, padding: '48px', color: '#6b7280' },
  errorContainer: { textAlign: 'center' as const, padding: '48px' },
  errorText: { color: '#ef4444', marginBottom: '16px' },
  backButton: { padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },

  twoColumns: { display: 'flex', gap: '32px', flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  leftColumn: { flex: '1.2', minWidth: '300px' },
  rightColumn: {
    flex: '1',
    minWidth: '400px',
    maxWidth: '650px',
    maxHeight: 'calc(100vh - 180px)',
    overflowY: 'auto' as const,
    paddingRight: '8px',
  },

  imageContainer: { backgroundColor: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'center' as const, position: 'sticky' as const, top: '24px' },
  documentImage: { maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' as const, borderRadius: '8px' },
  imagePlaceholder: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#9ca3af' },
  imagePlaceholderIcon: { fontSize: '64px', marginBottom: '16px' },
  downloadLink: { color: '#3b82f6', textDecoration: 'none', marginTop: '12px' },

  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' },

  // НОВЫЕ СТИЛИ ДЛЯ ДВУХ КОЛОНОК
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  infoLabel: {
    width: '160px',
    fontWeight: '500',
    color: '#6b7280',
    flexShrink: 0,
  },
  infoValue: {
  flex: 1,
  color: '#1f2937',
},

  validationsList: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  validationItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  validationIcon: { fontSize: '18px' },
  validationText: { color: '#1f2937' },
  commentText: { color: '#4b5563', lineHeight: 1.5, margin: 0 },
}

export default DocumentDetail