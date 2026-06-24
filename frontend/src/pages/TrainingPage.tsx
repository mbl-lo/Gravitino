import { useState, useEffect, useCallback } from 'react'
import { RiseOutlined, ExclamationCircleOutlined, CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons'
import {
  getTrainingStats,
  getTrainingDocuments,
  confirmTraining,
  addToTrainingSet
} from '../services/api'
import type { TrainingStats, TrainingDocument, LabeledField } from '../services/api'

const FIELD_TYPES = [
  'Дата', 'ФИО водителя', 'Госномер', 'Маршрут',
  'Пробег', 'Расход топлива', 'Подпись', 'Номер документа'
]

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
    <path d="M3 12A9 3 0 0 0 21 12"/>
  </svg>
)

interface FieldQuality {
  id: string
  name: string
  samples: number
  accuracy: number
}

const MOCK_QUALITY: FieldQuality[] = [
  { id: '1', name: 'Госномер автомобиля', samples: 2450, accuracy: 98 },
  { id: '2', name: 'Пробег (цифры)', samples: 4820, accuracy: 97 },
  { id: '3', name: 'Время (формат ЧЧ:ММ)', samples: 3180, accuracy: 94 },
  { id: '4', name: 'Топливо (литры)', samples: 2960, accuracy: 91 },
  { id: '5', name: 'Фамилия водителя', samples: 1840, accuracy: 89 },
  { id: '6', name: 'Подпись (распознавание)', samples: 1230, accuracy: 82 }
]

const statCards = [
  { key: 'labeledFields', label: 'Размеченных полей', icon: <DatabaseIcon />, color: '#2563eb', bgColor: '#eff6ff' },
  { key: 'modelAccuracy', label: 'Точность модели', icon: <RiseOutlined style={{ fontSize: '24px', color: '#16a34a' }} />, color: '#16a34a', bgColor: '#ecfdf5' },
  { key: 'needsLabeling', label: 'Требуют разметки', icon: <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />, color: '#f59e0b', bgColor: '#fffbeb' },
  { key: 'lastTraining', label: 'Последнее обучение', icon: <CalendarOutlined style={{ fontSize: '24px', color: '#4b5563' }} />, color: '#101828', bgColor: '#f9fafb' }
] as const

const trainingFilters = ['Разметка', 'Ошибки OCR', 'История обучения', 'Наборы данных'] as const

const TrainingPage = () => {
  const [stats, setStats] = useState<TrainingStats>({ labeledFields: 0, modelAccuracy: 0, needsLabeling: 0, lastTraining: '' })
  const [documents, setDocuments] = useState<TrainingDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<TrainingDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qualityFields] = useState<FieldQuality[]>(MOCK_QUALITY)
  const [activeFilter, setActiveFilter] = useState<typeof trainingFilters[number]>('Разметка')

  const [selectedField, setSelectedField] = useState<LabeledField | null>(null)
  const [fieldType, setFieldType] = useState('')
  const [correctValue, setCorrectValue] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [trainingAction, setTrainingAction] = useState<'confirm' | 'add' | null>(null)
  const [trainingMessage, setTrainingMessage] = useState<{ text: string; isError: boolean } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([getTrainingStats(), getTrainingDocuments()])
        setStats(statsRes.data)
        setDocuments(docsRes.data)
        if (docsRes.data.length > 0) setCurrentDocument(docsRes.data[0])
      } catch {
        // fallback to empty data
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleFieldSelect = useCallback((field: LabeledField) => {
    setSelectedField(field)
    setFieldType(field.fieldType)
    setCorrectValue(field.correctValue || field.ocrValue)
    setDifficulty(field.difficulty)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!currentDocument || trainingAction) return
    setTrainingAction('confirm')
    setTrainingMessage(null)
    try {
      await confirmTraining(currentDocument.id)
      setTrainingMessage({ text: 'Разметка подтверждена', isError: false })
    } catch {
      setTrainingMessage({ text: 'Не удалось подтвердить разметку', isError: true })
    } finally {
      setTrainingAction(null)
    }
  }, [currentDocument, trainingAction])

  const handleAddToTraining = useCallback(async () => {
    if (!currentDocument || trainingAction) return
    setTrainingAction('add')
    setTrainingMessage(null)
    try {
      await addToTrainingSet(currentDocument.id)
      setTrainingMessage({ text: 'Документ добавлен в обучающий набор', isError: false })
    } catch {
      setTrainingMessage({ text: 'Не удалось добавить документ в обучающий набор', isError: true })
    } finally {
      setTrainingAction(null)
    }
  }, [currentDocument, trainingAction])

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 91) return '#16a34a'
    return '#f59e0b'
  }

  if (isLoading) return <div style={styles.container}><p style={styles.loading}>Загрузка...</p></div>

  const getStatValue = (key: string) => {
    switch (key) {
      case 'labeledFields': return stats.labeledFields.toLocaleString()
      case 'modelAccuracy': return `${stats.modelAccuracy}%`
      case 'needsLabeling': return stats.needsLabeling.toLocaleString()
      case 'lastTraining': return stats.lastTraining || '—'
      default: return ''
    }
  }

  const visibleFields = currentDocument?.fields.filter(field => {
    if (activeFilter === 'Ошибки OCR') return field.confidence < 80
    if (activeFilter === 'История обучения' || activeFilter === 'Наборы данных') return Boolean(field.correctValue)
    return !field.correctValue
  }) ?? []

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>Обучающие данные</h1>
        <p style={styles.subtitle}>Разметка и улучшение качества распознавания рукописных полей</p>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map(card => (
          <div key={card.key} style={styles.statCard}>
            <div style={styles.statContent}>
              <span style={styles.statLabel}>{card.label}</span>
              <span style={{ ...styles.statValue, color: card.color }}>{getStatValue(card.key)}</span>
            </div>
            <div style={{ ...styles.statIcon, backgroundColor: card.bgColor }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div style={styles.filterTabsCard}>
        <div style={styles.filterTabs} aria-label="Фильтры обучающих данных">
          {trainingFilters.map(filter => {
            const isActive = activeFilter === filter
            return (
              <button
                key={filter}
                type="button"
                style={{ ...styles.filterTab, ...(isActive ? styles.filterTabActive : {}) }}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.mainLayout}>
        <div style={styles.documentSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Документ для разметки</h2>
            {documents.length > 1 && (
              <select style={styles.docSelect} value={currentDocument?.id || ''} onChange={(e) => {
                const doc = documents.find(d => d.id === e.target.value)
                if (doc) { setCurrentDocument(doc); setSelectedField(null) }
              }}>
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.labeledFields}/{doc.totalFields})</option>
                ))}
              </select>
            )}
          </div>

          <div style={styles.documentContainer}>
            {currentDocument ? (
              <>
                <div style={styles.fieldsGrid}>
                  {visibleFields.map(field => (
                    <div key={field.id} style={{
                      ...styles.fieldItem,
                      ...(selectedField?.id === field.id ? styles.fieldItemSelected : {}),
                      ...(field.correctValue ? styles.fieldItemDone : {})
                    }} onClick={() => handleFieldSelect(field)}>
                      <div style={styles.fieldInfo}>
                        <span style={styles.fieldType}>{field.fieldType}</span>
                        <span style={styles.fieldOcr}>OCR: {field.ocrValue}</span>
                      </div>
                      <div style={styles.fieldMeta}>
                        {field.correctValue ? <span style={styles.badgeDone}>Размечено</span> : <span style={styles.badgePending}>Ожидает</span>}
                        <span style={{ ...styles.fieldConfidence, color: field.confidence >= 80 ? '#16a34a' : field.confidence >= 60 ? '#f59e0b' : '#dc2626' }}>{field.confidence}%</span>
                      </div>
                    </div>
                  ))}
                  {visibleFields.length === 0 && (
                    <div style={styles.filteredEmpty}>Нет полей по выбранному фильтру</div>
                  )}
                </div>
                <div style={styles.instructions}>
                  <span>Клик — выделить поле</span>
                  <span>Двойной клик — редактировать значение</span>
                </div>
              </>
            ) : (
              <div style={styles.documentPlaceholder}>
                <div style={styles.placeholderIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
                    <path d="M3 12A9 3 0 0 0 21 12"/>
                  </svg>
                </div>
                <p style={styles.placeholderTitle}>Выберите область для разметки</p>
                <div style={styles.placeholderHints}>
                  <span style={styles.placeholderHint}>Клик — выделить поле</span>
                  <span style={styles.placeholderHint}>Двойной клик — редактировать значение</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.editorSection}>
          <h2 style={styles.sectionTitle}>Редактор меток</h2>

          <div style={styles.editorContent}>
            {trainingMessage && (
              <div style={trainingMessage.isError ? styles.actionError : styles.actionSuccess}>
                {trainingMessage.text}
              </div>
            )}
            <div style={styles.editorField}>
              <label style={styles.editorLabel}>Тип поля</label>
              <div style={styles.dropdownWrapper}>
                <button style={styles.dropdownButton} onClick={() => setShowTypeDropdown(!showTypeDropdown)}>
                  {fieldType || 'Выберите тип поля'}
                  <span style={styles.dropdownArrow}>▼</span>
                </button>
                {showTypeDropdown && (
                  <div style={styles.dropdownMenu}>
                    {FIELD_TYPES.map(type => (
                      <button key={type} style={styles.dropdownItem} onClick={() => { setFieldType(type); setShowTypeDropdown(false) }}>
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.editorField}>
              <label style={styles.editorLabel}>Распознанное значение</label>
              <input type="text" value={selectedField?.ocrValue || ''} placeholder="Значение OCR" style={styles.valueInput} disabled />
            </div>

            <div style={styles.editorField}>
              <label style={styles.editorLabel}>Корректное значение</label>
              <input type="text" value={correctValue} onChange={e => setCorrectValue(e.target.value)} placeholder="Правильное значение" style={styles.valueInput} />
            </div>

            <div style={styles.editorField}>
              <label style={styles.editorLabel}>Уверенность модели</label>
              <div style={styles.confidenceBar}>
                <div style={styles.confidenceTrack}>
                  <div style={{ ...styles.confidenceFill, width: `${selectedField?.confidence || 0}%`, backgroundColor: '#7c3aed' }} />
                  <div style={{ ...styles.confidenceThumb, left: `${selectedField?.confidence || 0}%`, backgroundColor: '#7c3aed' }} />
                </div>
                <span style={styles.confidenceText}>{selectedField?.confidence || 0}%</span>
              </div>
            </div>

            <div style={styles.editorField}>
              <label style={styles.editorLabel}>Сложность распознавания</label>
              <div style={styles.difficultyGroup}>
                {(['easy', 'medium', 'hard'] as const).map(level => (
                  <button key={level} style={{ ...styles.difficultyButton, ...(difficulty === level ? styles.difficultyButtonActive : {}) }} onClick={() => setDifficulty(level)}>
                    {level === 'easy' ? 'Легко' : level === 'medium' ? 'Средне' : 'Сложно'}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.editorActions}>
              <button
                onClick={handleConfirm}
                disabled={Boolean(trainingAction)}
                style={{ ...styles.btnConfirm, ...(trainingAction ? styles.btnDisabled : {}) }}
              >
                <CheckCircleOutlined style={{ marginRight: '8px' }} />
                {trainingAction === 'confirm' ? 'Подтверждение...' : 'Подтвердить разметку'}
              </button>
              <button
                onClick={() => setCorrectValue(selectedField?.ocrValue || '')}
                disabled={Boolean(trainingAction)}
                style={{ ...styles.btnFix, ...(trainingAction ? styles.btnDisabled : {}) }}
              >
                Исправить значение
              </button>
              <button
                onClick={handleAddToTraining}
                disabled={Boolean(trainingAction)}
                style={{ ...styles.btnTrain, ...(trainingAction ? styles.btnDisabled : {}) }}
              >
                {trainingAction === 'add' ? 'Добавление...' : 'Добавить в обучающий набор'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.qualitySection}>
        <h2 style={styles.qualityTitle}>Качество распознавания по типам полей</h2>
        <div style={styles.qualityGrid}>
          {qualityFields.map(field => (
            <div key={field.id} className="progress-row-item" style={styles.qualityRow}>
              <div className="progress-meta-label" style={styles.qualityRowLabel}>
                <span style={styles.qualityFieldName}>{field.name}</span>
                <div style={styles.qualityRowRight}>
                  <span style={styles.qualitySamples}>{field.samples.toLocaleString()} образцов</span>
                  <strong className="pct-value" style={{ ...styles.qualityPct, color: getAccuracyColor(field.accuracy) }}>{field.accuracy}%</strong>
                </div>
              </div>
              <div className="progress-track-line" style={styles.qualityTrack}>
                <div className="progress-fill-line" style={{ ...styles.qualityFill, width: `${field.accuracy}%`, backgroundColor: getAccuracyColor(field.accuracy) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' as const, overflowX: 'hidden' as const, padding: '8px 8px 32px' },
  loading: { textAlign: 'center' as const, color: '#6b7280', padding: '48px' },
  header: { marginBottom: '24px' },
  mainTitle: { fontSize: '30px', lineHeight: 1.25, fontWeight: '700', letterSpacing: '-0.02em', color: '#101828', margin: 0 },
  subtitle: { maxWidth: '820px', margin: '6px 0px 0px', color: 'rgb(102, 112, 133)', fontSize: '15px' },
  filterTabsCard: { minWidth: 0, backgroundColor: 'white', borderRadius: '20px', padding: '8px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', marginBottom: '24px' },
  filterTabs: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  filterTab: { padding: '8px 16px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#4b5563', fontSize: '14px', lineHeight: '20px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s ease, color 0.15s ease' },
  filterTabActive: { backgroundColor: '#2563EB', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '24px', marginBottom: '24px' },
  statCard: { minWidth: 0, backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statContent: { minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '500', overflowWrap: 'anywhere' as const },
  statValue: { fontSize: '30px', lineHeight: 1.2, fontWeight: '700', overflowWrap: 'anywhere' as const },
  mainLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '24px', alignItems: 'stretch' as const, marginBottom: '24px' },
  documentSection: { minWidth: 0, backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', minHeight: '500px', display: 'flex', flexDirection: 'column' as const },
  editorSection: { minWidth: 0, backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)', minHeight: '500px', display: 'flex', flexDirection: 'column' as const },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '12px', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', margin: 0, color: '#101828' },
  docSelect: { maxWidth: '100%', minWidth: 0, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '13px', outline: 'none' },
  documentContainer: { minWidth: 0, flex: 1, minHeight: '500px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '32px', overflow: 'auto', display: 'flex', flexDirection: 'column' as const },
  fieldsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '8px' },
  fieldItem: { minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '10px', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'white' },
  fieldItemSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  fieldItemDone: { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' },
  filteredEmpty: { gridColumn: '1 / -1', padding: '32px 16px', color: '#6b7280', textAlign: 'center' as const },
  fieldInfo: { minWidth: 0, display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px 16px' },
  fieldType: { fontWeight: '500', color: '#1f2937', overflowWrap: 'anywhere' as const },
  fieldOcr: { fontSize: '14px', color: '#6b7280', overflowWrap: 'anywhere' as const },
  fieldMeta: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px 16px' },
  badgeDone: { fontSize: '13px', color: '#16a34a', fontWeight: '500' },
  badgePending: { fontSize: '13px', color: '#f59e0b', fontWeight: '500' },
  fieldConfidence: { fontSize: '13px', fontWeight: '600' },
  documentPlaceholder: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px, 5vw, 48px) 16px', gap: '16px', textAlign: 'center' as const },
  placeholderIcon: { width: '96px', height: '96px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 10px 15px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' },
  placeholderTitle: { fontSize: '16px', fontWeight: '500', color: '#6b7280', margin: 0, overflowWrap: 'anywhere' as const },
  placeholderHints: { display: 'flex', flexDirection: 'column' as const, gap: '6px', alignItems: 'center' },
  placeholderHint: { fontSize: '13px', color: '#9ca3af' },
  instructions: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px 24px', paddingTop: '16px', fontSize: '13px', color: '#6b7280' },
  editorContent: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  editorField: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  editorLabel: { fontSize: '14px', fontWeight: '500', color: '#101828' },
  dropdownWrapper: { position: 'relative' as const },
  dropdownButton: { width: '100%', minWidth: 0, padding: '10px 16px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', color: '#1f2937', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', textAlign: 'left' as const },
  dropdownArrow: { fontSize: '10px', color: '#6b7280' },
  dropdownMenu: { position: 'absolute' as const, top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' as const, zIndex: 10 },
  dropdownItem: { width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', textAlign: 'left' as const, fontSize: '14px', color: '#1f2937', cursor: 'pointer' },
  valueInput: { width: '100%', padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', color: '#1f2937', outline: 'none', boxSizing: 'border-box' as const },
  confidenceBar: { display: 'flex', alignItems: 'center', gap: '12px' },
  confidenceTrack: { flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', position: 'relative' as const, overflow: 'visible' },
  confidenceFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  confidenceThumb: { position: 'absolute' as const, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', transform: 'translateX(-50%)', transition: 'left 0.3s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  confidenceText: { fontSize: '14px', fontWeight: '600', color: '#1f2937', minWidth: '36px' },
  difficultyGroup: { display: 'flex', flexWrap: 'wrap' as const, gap: '8px' },
  difficultyButton: { flex: '1 1 110px', padding: '8px 16px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', color: '#101828', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' },
  difficultyButtonActive: { borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: '#eff6ff' },
  editorActions: { display: 'flex', flexDirection: 'column' as const, gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
  actionSuccess: { padding: '10px 12px', borderRadius: '10px', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '14px', fontWeight: '500' },
  actionError: { padding: '10px 12px', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontSize: '14px', fontWeight: '500' },
  btnDisabled: { opacity: 0.65, cursor: 'not-allowed' },
  btnConfirm: { width: '100%', padding: '12px 24px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnFix: { width: '100%', padding: '12px 24px', backgroundColor: 'white', color: '#101828', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' as const },
  btnTrain: { width: '100%', padding: '12px 24px', backgroundColor: '#2563EB', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' as const },
  qualitySection: { minWidth: 0, backgroundColor: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 24px rgba(16,24,40,0.06)' },
  qualityTitle: { fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#101828' },
  qualityGrid: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  qualityRow: { display: 'flex', flexDirection: 'column' as const, gap: '8px', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' },
  qualityRowLabel: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '8px 16px' },
  qualityRowRight: { display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: '8px 12px' },
  qualityFieldName: { fontSize: '14px', fontWeight: '500', color: '#101828', overflowWrap: 'anywhere' as const },
  qualitySamples: { fontSize: '12px', color: '#6b7280' },
  qualityPct: { fontSize: '14px', fontWeight: '600' },
  qualityTrack: { width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' },
  qualityFill: { height: '100%', borderRadius: '999px', transition: 'width 0.6s ease' },
} as const

export default TrainingPage
