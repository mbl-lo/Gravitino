import { useState, useEffect } from 'react'
import { getUsers, getSystemSettings, updateSystemSettings } from '../services/api'
import type { User } from '../services/types'

interface RoleTemplate {
  role: string
  label: string
  description: string
  color: string
}

type SystemIconName = 'shield' | 'file-text' | 'cpu' | 'users' | 'save'

const SystemIcon = ({ name, size = 24, color = '#2563eb' }: { name: SystemIconName; size?: number; color?: string }) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { color, flexShrink: 0 },
    'aria-hidden': true,
  }

  if (name === 'shield') {
    return (
      <svg {...commonProps}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    )
  }

  if (name === 'file-text') {
    return (
      <svg {...commonProps}>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
      </svg>
    )
  }

  if (name === 'cpu') {
    return (
      <svg {...commonProps}>
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <rect width="6" height="6" x="9" y="9" rx="1" />
        <path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2" />
      </svg>
    )
  }

  if (name === 'users') {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  }

  return (
    <svg {...commonProps}>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  )
}

const SettingsPage = () => {
  const [maxFuelDeviation, setMaxFuelDeviation] = useState(5)
  const [maxWorkingHours, setMaxWorkingHours] = useState(12)
  const [checkOdometer, setCheckOdometer] = useState(true)
  const [autoDetectAnomalies, setAutoDetectAnomalies] = useState(true)

  const [fields, setFields] = useState<Record<string, boolean>>({
    driver: true, vehicle: true, mileage: true, fuel: true,
    workingTime: true, signatures: true, route: true, division: true,
    medical: true, technical: true
  })

  const [ocrMode, setOcrMode] = useState('balanced')
  const [minConfidence, setMinConfidence] = useState(85)
  const [autoManualReview, setAutoManualReview] = useState(true)

  const [auditLog, setAuditLog] = useState(true)
  const [dataRetention, setDataRetention] = useState(36)
  const [enable2FA, setEnable2FA] = useState(true)

  const [users, setUsers] = useState<User[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([getUsers(), getSystemSettings()])
        setUsers(usersRes.data)
        const s = settingsRes.data
        setMaxFuelDeviation(s.maxFuelDeviation)
        setMaxWorkingHours(s.maxWorkingHours)
        setCheckOdometer(s.checkOdometerConsistency)
        setAutoDetectAnomalies(s.autoDetectAnomalies)
        if (s.enabledFields && Object.keys(s.enabledFields).length > 0) setFields(s.enabledFields)
        setOcrMode(s.ocrMode)
        setMinConfidence(s.minConfidence)
        setAutoManualReview(s.autoManualReview)
        setAuditLog(s.auditLog)
        setDataRetention(s.dataRetentionMonths)
        setEnable2FA(s.enable2FA)
      } catch (err) {
        console.error('Не удалось загрузить данные:', err)
      } finally {
        setIsLoadingUsers(false)
      }
    }
    loadData()
  }, [])

  const roleTemplates: RoleTemplate[] = [
    { role: 'admin', label: 'Администратор', description: 'Полный доступ ко всем функциям системы', color: '#2563eb' },
    { role: 'operator', label: 'Оператор', description: 'Загрузка, проверка и корректировка документов', color: '#059669' },
    { role: 'accountant', label: 'Бухгалтер', description: 'Просмотр данных, экспорт отчетов', color: '#d97706' },
    { role: 'manager', label: 'Менеджер', description: 'Просмотр дашбордов и аналитики', color: '#7c3aed' },
  ]

  const roles = roleTemplates.map(template => ({
    ...template,
    count: users.filter(user => user.role === template.role).length
  }))

  const handleFieldToggle = (key: string) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    setSuccessMessage('')
    setErrorMessage('')
    try {
      await updateSystemSettings({
        maxFuelDeviation,
        maxWorkingHours,
        checkOdometerConsistency: checkOdometer,
        autoDetectAnomalies,
        enabledFields: fields,
        ocrMode,
        minConfidence,
        autoManualReview,
        auditLog,
        dataRetentionMonths: dataRetention,
        enable2FA,
      })
      setSuccessMessage('Конфигурация системы успешно сохранена!')
    } catch (err) {
      console.error(err)
      setErrorMessage('Не удалось сохранить настройки. Попробуйте еще раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Настройки системы</h1>
        <p style={styles.subtitle}>Конфигурация правил валидации, OCR и безопасности</p>
      </div>

      {successMessage && (
        <div style={styles.alertSuccess}>{successMessage}</div>
      )}
      {errorMessage && (
        <div style={styles.alertError}>{errorMessage}</div>
      )}

      <div style={styles.layoutContainer}>
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><SystemIcon name="shield" />Правила валидации</h3>
            <div style={styles.formGroupRow}>
              <div style={styles.labelCell}>
                <span style={styles.inputLabel}>Макс. отклонение расхода топлива</span>
                <span style={styles.inputHint}>Допустимое отклонение от нормы расхода</span>
              </div>
              <div style={styles.inputCell}>
                <input type="number" value={maxFuelDeviation} onChange={e => setMaxFuelDeviation(Number(e.target.value))} style={styles.numInput} />
                <span style={styles.unit}>%</span>
              </div>
            </div>

            <div style={styles.formGroupRow}>
              <div style={styles.labelCell}>
                <span style={styles.inputLabel}>Макс. время работы</span>
                <span style={styles.inputHint}>Максимальная продолжительность смены</span>
              </div>
              <div style={styles.inputCell}>
                <input type="number" value={maxWorkingHours} onChange={e => setMaxWorkingHours(Number(e.target.value))} style={styles.numInput} />
                <span style={styles.unit}>часов</span>
              </div>
            </div>

            <div style={styles.formGroupRow}>
              <div style={styles.labelCell}>
                <span style={styles.inputLabel}>Проверка согласованности пробега</span>
                <span style={styles.inputHint}>Сравнение расчетного и фактического пробега</span>
              </div>
              <div style={styles.checkboxCell}>
                <input type="checkbox" id="checkOdometer" checked={checkOdometer} onChange={() => setCheckOdometer(!checkOdometer)} style={styles.checkbox} />
                <label htmlFor="checkOdometer" style={styles.checkboxLabel}>{checkOdometer ? 'Включено' : 'Выключено'}</label>
              </div>
            </div>

            <div style={styles.formGroupRow}>
              <div style={styles.labelCell}>
                <span style={styles.inputLabel}>Автообнаружение аномалий</span>
                <span style={styles.inputHint}>ИИ-анализ на предмет логических несоответствий</span>
              </div>
              <div style={styles.checkboxCell}>
                <input type="checkbox" id="autoDetectAnomalies" checked={autoDetectAnomalies} onChange={() => setAutoDetectAnomalies(!autoDetectAnomalies)} style={styles.checkbox} />
                <label htmlFor="autoDetectAnomalies" style={styles.checkboxLabel}>{autoDetectAnomalies ? 'Включено' : 'Выключено'}</label>
              </div>
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><SystemIcon name="file-text" />Поля документа</h3>
            <p style={styles.sectionDesc}>Выберите поля путевого листа, подлежащие обязательному распознаванию и верификации</p>
            <div style={styles.fieldsGrid}>
              {[
                ['Водитель', 'driver'], ['Автомобиль', 'vehicle'],
                ['Пробег', 'mileage'], ['Топливо', 'fuel'],
                ['Время работы', 'workingTime'], ['Подписи', 'signatures'],
                ['Маршрут', 'route'], ['Подразделение', 'division'],
                ['Медосмотр', 'medical'], ['Техосмотр', 'technical']
              ].map(([label, key]) => (
                <div key={key} style={styles.gridCheckboxItem} onClick={() => handleFieldToggle(key)}>
                  <input type="checkbox" checked={fields[key]} onChange={() => {}} style={styles.checkbox} />
                  <span style={styles.gridLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><SystemIcon name="cpu" />OCR и ИИ</h3>
            <div style={styles.verticalFormGroup}>
              <label style={styles.inputLabel}>Режим распознавания</label>
              <select value={ocrMode} onChange={e => setOcrMode(e.target.value)} style={styles.select}>
                <option value="fast">Быстрый (90% точность, 2 сек)</option>
                <option value="balanced">Сбалансированный (95% точность, 4 сек)</option>
                <option value="maximum">Максимальная точность (98% точность, 8 сек)</option>
              </select>
            </div>
            <div style={styles.verticalFormGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={styles.inputLabel}>Минимальная уверенность</label>
                <span style={{ fontWeight: '600', color: '#2563eb' }}>{minConfidence}%</span>
              </div>
              <input type="range" min="50" max="100" value={minConfidence} onChange={e => setMinConfidence(Number(e.target.value))} style={styles.slider} />
            </div>
            <div style={{ ...styles.formGroupRow, borderBottom: 'none', paddingBottom: 0, marginTop: '16px' }}>
              <div style={styles.labelCell}>
                <span style={styles.inputLabel}>Автоотправка на ручную проверку</span>
                <span style={styles.inputHint}>При низкой уверенности OCR</span>
              </div>
              <div style={styles.checkboxCell}>
                <input type="checkbox" id="autoManualReview" checked={autoManualReview} onChange={() => setAutoManualReview(!autoManualReview)} style={styles.checkbox} />
                <label htmlFor="autoManualReview" style={styles.checkboxLabel}>Включено</label>
              </div>
            </div>
          </div>
        </div>
        <div style={styles.sideColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><SystemIcon name="users" />Пользователи и роли</h3>
            {isLoadingUsers ? (
              <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '12px' }}>Подсчет сотрудников...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roles.map(role => (
                  <div key={role.role} style={styles.roleRow}>
                    <div style={styles.roleMeta}>
                      <span style={{ ...styles.roleLabel, color: role.color }}>{role.label}</span>
                      <span style={styles.roleDesc}>{role.description}</span>
                    </div>
                    <div style={styles.roleCountBadge}>
                      <span style={{ color: '#6b7280', fontSize: '11px' }}>В базе</span>
                      <strong style={{ fontSize: '18px', color: '#1f2937' }}>{role.count}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}><SystemIcon name="shield" />Безопасность</h3>
            <div style={styles.verticalFormGroup}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <input type="checkbox" id="auditLog" checked={auditLog} onChange={() => setAuditLog(!auditLog)} style={styles.checkbox} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label htmlFor="auditLog" style={{ ...styles.inputLabel, cursor: 'pointer' }}>Журнал аудита</label>
                  <span style={styles.inputHint}>Вести полный журнал действий пользователей</span>
                </div>
              </div>
            </div>
            <div style={styles.verticalFormGroup}>
              <label style={styles.inputLabel}>Срок хранения данных (месяцев)</label>
              <input type="number" value={dataRetention} onChange={e => setDataRetention(Number(e.target.value))} style={styles.select} />
            </div>
            <div style={{ ...styles.verticalFormGroup, marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <input type="checkbox" id="enable2FA" checked={enable2FA} onChange={() => setEnable2FA(!enable2FA)} style={styles.checkbox} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label htmlFor="enable2FA" style={{ ...styles.inputLabel, cursor: 'pointer' }}>Контроль доступа</label>
                  <span style={styles.inputHint}>Двухфакторная аутентификация (2FA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={styles.bottomBar}>
        <button onClick={handleSave} disabled={isSaving} style={{ ...styles.saveButton, opacity: isSaving ? 0.65 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
          {isSaving ? 'Сохранение...' : <><SystemIcon name="save" size={20} color="currentColor" />Сохранить изменения</>}
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {margin: '0 auto', padding: '8px 8px 32px', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { marginBottom: '24px' },
  title: { fontSize: '30px', lineHeight: 1.25, fontWeight: '700', letterSpacing: '-0.02em', color: '#101828', margin: 0 },
  subtitle: { color: 'rgb(102, 112, 133)', fontSize: '15px', margin: '6px 0px 0px' },
  layoutContainer: { display: 'flex', gap: '24px', flexWrap: 'wrap' as const, alignItems: 'flex-start' },
  mainColumn: { flex: '1.4', minWidth: '400px', display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  sideColumn: { flex: '1', minWidth: '350px', display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 20px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' },
  sectionDesc: { fontSize: '13px', color: '#64748b', marginTop: '-12px', marginBottom: '20px' },
  formGroupRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9' },
  labelCell: { display: 'flex', flexDirection: 'column' as const, gap: '4px', flex: 1, paddingRight: '16px' },
  inputLabel: { fontSize: '14px', fontWeight: '500', color: '#374151' },
  inputHint: { fontSize: '12px', color: '#94a3b8' },
  inputCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  checkboxCell: { display: 'flex', alignItems: 'center', gap: '8px' },
  numInput: { width: '80px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', textAlign: 'center' as const },
  unit: { fontSize: '13px', color: '#64748b', minWidth: '40px' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
  checkboxLabel: { fontSize: '13px', fontWeight: '500', color: '#2563eb' },
  fieldsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' },
  gridCheckboxItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s' },
  gridLabel: { fontSize: '13px', fontWeight: '500', color: '#334155' },
  verticalFormGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '20px' },
  select: { padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', outline: 'none', width: '100%' },
  slider: { width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '5px', cursor: 'pointer' },
  roleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', backgroundColor: '#f8fafc' },
  roleMeta: { display: 'flex', flexDirection: 'column' as const, gap: '2px', flex: 1, paddingRight: '12px' },
  roleLabel: { fontSize: '14px', fontWeight: '600' },
  roleDesc: { fontSize: '11px', color: '#64748b' },
  roleCountBadge: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', minWidth: '90px' },
  bottomBar: { position: 'fixed' as const, bottom: 0, left: '260px', right: 0, height: '70px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '32px', zIndex: 10 },
  saveButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' },
  alertSuccess: { padding: '12px 16px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #a7f3d0' },
  alertError: { padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', border: '1px solid #fecaca' }
}

export default SettingsPage
