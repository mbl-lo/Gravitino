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
  { key: 'labeledFields', label: 'Размеченных полей', icon: <DatabaseIcon />, color: '#2563EB', bgColor: '#eff6ff' },
  { key: 'modelAccuracy', label: 'Точность модели', icon: <RiseOutlined style={{ fontSize: '24px', color: '#059669' }} />, color: '#059669', bgColor: '#ecfdf5' },
  { key: 'needsLabeling', label: 'Требуют разметки', icon: <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />, color: '#f59e0b', bgColor: '#fffbeb' },
  { key: 'lastTraining', label: 'Последнее обучение', icon: <CalendarOutlined style={{ fontSize: '24px', color: '#6b7280' }} />, color: '#6b7280', bgColor: '#f3f4f6' }
] as const

const TrainingPage = () => {
  const [stats, setStats] = useState<TrainingStats>({ labeledFields: 0, modelAccuracy: 0, needsLabeling: 0, lastTraining: '' })
  const [documents, setDocuments] = useState<TrainingDocument[]>([])
  const [currentDocument, setCurrentDocument] = useState<TrainingDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qualityFields] = useState<FieldQuality[]>(MOCK_QUALITY)

  const [selectedField, setSelectedField] = useState<LabeledField | null>(null)
  const [fieldType, setFieldType] = useState('')
  const [correctValue, setCorrectValue] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)

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
    if (!currentDocument) return
    try { await confirmTraining(currentDocument.id) } catch { /* noop */ }
  }, [currentDocument])

  const handleAddToTraining = useCallback(async () => {
    if (!currentDocument) return
    try { await addToTrainingSet(currentDocument.id) } catch { /* noop */ }
  }, [currentDocument])

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 91) return '#059669'
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

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Обучающие данные</h1>
      <p style={styles.subtitle}>Разметка и улучшение качества распознавания рукописных полей</p>

      <div style={styles.statsGrid}>
        {statCards.map(card => (
          <div key={card.key} style={{ ...styles.statCard, borderColor: card.color }}>
            <div style={{ ...styles.statIcon, backgroundColor: card.bgColor }}>{card.icon}</div>
            <div style={styles.statContent}>
              <span style={styles.statLabel}>{card.label}</span>
              <span style={{ ...styles.statValue, color: card.color }}>{getStatValue(card.key)}</span>
            </div>
          </div>
        ))}
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
                  {currentDocument.fields.map(field => (
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
                        <span style={{ ...styles.fieldConfidence, color: field.confidence >= 80 ? '#059669' : field.confidence >= 60 ? '#f59e0b' : '#dc2626' }}>{field.confidence}%</span>
                      </div>
                    </div>
                  ))}
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
              <button onClick={handleConfirm} style={styles.btnConfirm}>
                <CheckCircleOutlined style={{ marginRight: '8px' }} />
                Подтвердить разметку
              </button>
              <button onClick={() => setCorrectValue(selectedField?.ocrValue || '')} style={styles.btnFix}>
                Исправить значение
              </button>
              <button onClick={handleAddToTraining} style={styles.btnTrain}>
                Добавить в обучающий набор
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
  container: { padding: '32px 24px' },
  loading: { textAlign: 'center' as const, color: '#6b7280', padding: '48px' },
  mainTitle: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#1f2937' },
  subtitle: { fontSize: '16px', color: '#6b7280', margin: '0 0 32px 0' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statContent: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  statLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '500' },
  statValue: { fontSize: '28px', fontWeight: '700' },
  mainLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'stretch' as const, marginBottom: '32px' },
  documentSection: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '500px', display: 'flex', flexDirection: 'column' as const },
  editorSection: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minHeight: '500px', display: 'flex', flexDirection: 'column' as const },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', margin: 0, color: '#1f2937' },
  docSelect: { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' },
  documentContainer: { flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
  fieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '16px' },
  fieldItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'white' },
  fieldItemSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  fieldItemDone: { borderColor: '#d1fae5', backgroundColor: '#f0fdf4' },
  fieldInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  fieldType: { fontWeight: '500', color: '#1f2937' },
  fieldOcr: { fontSize: '14px', color: '#6b7280' },
  fieldMeta: { display: 'flex', alignItems: 'center', gap: '16px' },
  badgeDone: { fontSize: '13px', color: '#059669', fontWeight: '500' },
  badgePending: { fontSize: '13px', color: '#f59e0b', fontWeight: '500' },
  fieldConfidence: { fontSize: '13px', fontWeight: '600' },
  documentPlaceholder: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '48px 24px', backgroundColor: '#f9fafb', gap: '16px' },
  placeholderIcon: { width: '80px', height: '80px', borderRadius: '20px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' },
  placeholderTitle: { fontSize: '16px', fontWeight: '600', color: '#374151', margin: 0 },
  placeholderHints: { display: 'flex', flexDirection: 'column' as const, gap: '6px', alignItems: 'center' },
  placeholderHint: { fontSize: '13px', color: '#9ca3af' },
  instructions: { display: 'flex', gap: '32px', padding: '12px 16px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' },
  editorContent: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  editorField: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  editorLabel: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  dropdownWrapper: { position: 'relative' as const },
  dropdownButton: { width: '100%', padding: '10px 14px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dropdownArrow: { fontSize: '10px', color: '#6b7280' },
  dropdownMenu: { position: 'absolute' as const, top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' as const, zIndex: 10 },
  dropdownItem: { width: '100%', padding: '10px 14px', backgroundColor: 'transparent', border: 'none', textAlign: 'left' as const, fontSize: '14px', color: '#1f2937', cursor: 'pointer' },
  valueInput: { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#1f2937', outline: 'none', boxSizing: 'border-box' as const },
  confidenceBar: { display: 'flex', alignItems: 'center', gap: '12px' },
  confidenceTrack: { flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', position: 'relative' as const, overflow: 'visible' },
  confidenceFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  confidenceThumb: { position: 'absolute' as const, top: '-4px', width: '16px', height: '16px', borderRadius: '50%', transform: 'translateX(-50%)', transition: 'left 0.3s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  confidenceText: { fontSize: '14px', fontWeight: '600', color: '#1f2937', minWidth: '36px' },
  difficultyGroup: { display: 'flex', gap: '8px' },
  difficultyButton: { padding: '8px 20px', backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#6b7280', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' },
  difficultyButtonActive: { borderColor: '#3b82f6', color: '#3b82f6', backgroundColor: '#eff6ff' },
  editorActions: { display: 'flex', flexDirection: 'column' as const, gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
  btnConfirm: { width: '100%', padding: '12px 24px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnFix: { width: '100%', padding: '12px 24px', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'center' as const },
  btnTrain: { width: '100%', padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'center' as const },
  qualitySection: { backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  qualityTitle: { fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0', color: '#1f2937' },
  qualityGrid: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  qualityRow: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  qualityRowLabel: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  qualityRowRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  qualityFieldName: { fontSize: '15px', fontWeight: '500', color: '#1f2937' },
  qualitySamples: { fontSize: '13px', color: '#6b7280' },
  qualityPct: { fontSize: '18px', fontWeight: '700' },
  qualityTrack: { width: '100%', height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' },
  qualityFill: { height: '100%', borderRadius: '5px', transition: 'width 0.6s ease' },
} as const

export default TrainingPage