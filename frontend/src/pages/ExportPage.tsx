import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'

type IconProps = {
  children: ReactNode
  size?: number
}

const Icon = ({ children, size = 24 }: IconProps) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

const FileJsonIcon = () => (
  <Icon>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1" />
    <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1" />
  </Icon>
)

const DatabaseIcon = () => (
  <Icon>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </Icon>
)

const FileTextIcon = () => (
  <Icon>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8M16 13H8M16 17H8" />
  </Icon>
)

const CodeIcon = () => (
  <Icon>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </Icon>
)

const CheckIcon = () => (
  <Icon size={13}>
    <path d="m20 6-11 11-5-5" />
  </Icon>
)

const SettingsIcon = () => (
  <Icon size={16}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

const ExternalLinkIcon = () => (
  <Icon size={16}>
    <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Icon>
)

type IntegrationCardProps = {
  icon: ReactNode
  iconColor: string
  iconBackground: string
  title: string
  description: string
  status?: ReactNode
  action: ReactNode
}

const IntegrationCard = ({
  icon,
  iconColor,
  iconBackground,
  title,
  description,
  status,
  action,
}: IntegrationCardProps) => (
  <article className="export-integration-card" style={styles.integrationCard}>
    <div style={{ ...styles.iconBox, color: iconColor, backgroundColor: iconBackground }}>
      {icon}
    </div>
    <div style={styles.integrationContent}>
      <h2 style={styles.integrationTitle}>{title}</h2>
      <p style={styles.integrationDescription}>{description}</p>
      {status}
      <div style={styles.actionRow}>{action}</div>
    </div>
  </article>
)

const dataExample = `{
  "document_id": "PL-2026-00128",
  "date": "2026-05-17",
  "organization": "ООО 'Транс Логистик'",
  "division": "Центральный парк",
  "driver": {
    "name": "Иванов Сергей Петрович",
    "employee_number": "00245"
  },
  "vehicle": {
    "model": "Hyundai Solaris",
    "license_plate": "С789МР"
  },
  "route": "Москва - Клин - Москва",
  "mileage": {
    "odometer_start": 45672,
    "odometer_end": 45856,
    "calculated": 184
  },
  "fuel": {
    "start_balance": 42,
    "issued": 20,
    "end_balance": 31,
    "calculated_consumption": 31,
    "consumption_rate": 7.2,
    "deviation_percent": 18
  },
  "working_time": {
    "departure": "08:15",
    "arrival": "16:42",
    "total_hours": 8.45,
    "downtime_hours": 1.25
  },
  "signatures": {
    "driver": true,
    "mechanic": false,
    "dispatcher": true
  },
  "medical_check": true,
  "ocr_accuracy": 94.7,
  "anomalies": [
    {
      "type": "fuel_overconsumption",
      "severity": "high",
      "field": "fuel_deviation",
      "value": 18,
      "threshold": 5
    }
  ]
}`

const mappingRows = [
  ['driver.name', 'employee_full_name', true, 'Без изменений'],
  ['vehicle.license_plate', 'vehicle_number', true, 'Верхний регистр'],
  ['mileage.calculated', 'trip_distance_km', true, 'Округление до целого'],
  ['fuel.calculated_consumption', 'fuel_used_liters', true, '2 знака после запятой'],
  ['working_time.total_hours', 'work_hours', false, 'Формат HH:MM'],
] as const

const ExportPage = () => {
  const [mappingData, setMappingData] = useState(() => 
    mappingRows.map(([source, target, required, transformation]) => ({
      source,
      target,
      required,
      transformation
    }))
  );

  const scrollToMapping = () => {
    document.getElementById('field-mapping')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCheckboxChange = (sourceField: string) => {
    setMappingData(prevData =>
      prevData.map(row =>
        row.source === sourceField ? { ...row, required: !row.required } : row
      )
    )
  }

  return (
    <div className="export-page" style={styles.page}>
      <style>{`
        .export-page {
          container-name: export-page;
          container-type: inline-size;
        }

        .export-integration-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .export-secondary-button {
          cursor: default;
          transition: border-color 0.2s ease;
        }

        .export-secondary-button:hover {
          border-color: #2563eb !important;
        }

        @container export-page (max-width: 900px) {
          .export-integration-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @container export-page (max-width: 600px) {
          .export-integration-card {
            min-height: auto !important;
            padding: 20px !important;
          }
        }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.title}>Экспорт и интеграции</h1>
        <p style={styles.subtitle}>Передача структурированных данных в учетные системы</p>
      </header>

      <section className="export-integration-grid" style={styles.integrationGrid} aria-label="Доступные интеграции">
        <IntegrationCard
          icon={<FileJsonIcon />}
          iconColor="#2563eb"
          iconBackground="#eff6ff"
          title="Экспорт JSON"
          description="Формирование структурированных данных для внешних систем"
          action={
            <button type="button" style={styles.primaryButton} onClick={scrollToMapping}>
              Настроить
            </button>
          }
        />
        <IntegrationCard
          icon={<DatabaseIcon />}
          iconColor="#4b5563"
          iconBackground="#f9fafb"
          title="Бухгалтерская система"
          description="Интеграция с 1С и другими системами учета"
          status={<span style={styles.neutralBadge}>Не подключено</span>}
          action={<button type="button" className="export-secondary-button" style={styles.secondaryButton}>Подключить</button>}
        />
        <IntegrationCard
          icon={<FileTextIcon />}
          iconColor="#16a34a"
          iconBackground="#f0fdf4"
          title="СЭД"
          description="Система электронного документооборота"
          status={<span style={styles.successBadge}><CheckIcon />Подключено</span>}
          action={<button type="button" className="export-secondary-button" style={styles.secondaryButton}><SettingsIcon />Настройки</button>}
        />
        <IntegrationCard
          icon={<CodeIcon />}
          iconColor="#9333ea"
          iconBackground="#faf5ff"
          title="API"
          description="REST API для интеграции с вашими системами"
          status={<span style={styles.successBadge}><CheckIcon />Активно</span>}
          action={<button type="button" className="export-secondary-button" style={styles.secondaryButton}><ExternalLinkIcon />Документация</button>}
        />
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>Пример структуры данных</h2>
        <div style={styles.codeContainer}>
          <pre style={styles.code}>{dataExample}</pre>
        </div>
      </section>

      <section id="field-mapping" style={styles.card}>
        <h2 style={styles.sectionTitle}>Настройки маппинга полей</h2>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Поле из OCR', 'Поле в системе учета', 'Обязательно', 'Правило трансформации'].map((heading) => (
                  <th key={heading} style={styles.tableHeader}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mappingData.map(({source, target, required, transformation}) => (
                <tr key={source}>
                  <td style={{ ...styles.tableCell, ...styles.sourceField }}>{source}</td>
                  <td style={{ ...styles.tableCell, ...styles.targetField }}>{target}</td>
                  <td style={styles.tableCell}>
                    <input
                      aria-label={`${source}: обязательное поле`}
                      type="checkbox"
                      checked={required}
                      onChange={() => handleCheckboxChange(source)}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={{ ...styles.tableCell, color: '#667085' }}>{transformation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    margin: '0 auto',
    padding: '8px 8px 32px',
    color: '#101828',
  },
  header: { marginBottom: '24px' },
  title: {
    margin: 0,
    fontSize: '30px',
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '6px 0 0',
    color: '#667085',
    fontSize: '15px',
  },
  integrationGrid: {
    display: 'grid',
    gap: '24px',
    marginBottom: '24px',
  },
  integrationCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    minHeight: '210px',
    padding: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid #eef1f5',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(16, 24, 40, 0.06)',
  },
  iconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  integrationContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    height: '100%',
  },
  integrationTitle: {
    margin: 0,
    fontSize: '18px',
    lineHeight: 1.4,
    fontWeight: 600,
  },
  integrationDescription: {
    margin: '6px 0 10px',
    color: '#667085',
    fontSize: '14px',
    lineHeight: 1.55,
  },
  actionRow: { marginTop: 'auto', paddingTop: '4px' },
  primaryButton: {
    padding: '10px 16px',
    border: 0,
    borderRadius: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    color: '#101828',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'default',
  },
  neutralBadge: {
    display: 'inline-flex',
    padding: '5px 12px',
    borderRadius: '999px',
    backgroundColor: '#f2f4f7',
    color: '#667085',
    fontSize: '12px',
    fontWeight: 500,
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 12px',
    borderRadius: '999px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    fontSize: '12px',
    fontWeight: 500,
  },
  card: {
    marginTop: '20px',
    padding: '24px',
    backgroundColor: '#ffffff',
    border: '1px solid #eef1f5',
    borderRadius: '20px',
    boxShadow: '0 8px 24px rgba(16, 24, 40, 0.06)',
  },
  sectionTitle: {
    margin: '0 0 16px',
    fontSize: '18px',
    lineHeight: 1.4,
    fontWeight: 600,
  },
  codeContainer: {
    overflowX: 'auto',
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: '#101828',
  },
  code: {
    margin: 0,
    color: '#4ade80',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  tableScroll: { overflowX: 'auto' },
  table: {
    width: '100%',
    minWidth: '760px',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    color: '#667085',
    fontSize: '13px',
    fontWeight: 600,
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  tableCell: {
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px',
    textAlign: 'left',
  },
  sourceField: {
    color: '#2563eb',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  targetField: {
    color: '#344054',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#2563eb',
  },
}

export default ExportPage
