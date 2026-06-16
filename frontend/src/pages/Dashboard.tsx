import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClockCircleOutlined, FileTextOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons'
import { getDashboardStats } from '../services/api'

interface DashboardData {
  cards: {
    processedToday: number
    avgOcrAccuracy: number
    activeAnomaliesCount: number
    waitingReview: number
  }
  dailyStats: Array<{ day: string; processed: number; warnings: number; manual: number }>
  recentAnomalies: Array<{ id: string; message: string; documentNumber: string }>
  fieldAccuracy: Array<{ name: string; value: number }>
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await getDashboardStats()
        setData(response.data as unknown as DashboardData)
      } catch (err) {
        console.error('Ошибка загрузки статистики дашборда:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (isLoading || !data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        Агрегация аналитических данных системы...
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Дашборд</h1>
        <p className="subtitle">Контроль обработки путевых листов и качества распознавания</p>
      </div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-meta">
            <span className="metric-title">Обработано сегодня</span>
            <span className="metric-value">{data.cards.processedToday}</span>
          </div>
          <span className="metric-icon blue-icon"><FileTextOutlined /></span>
        </div>
        <div className="metric-card">
          <div className="metric-meta">
            <span className="metric-title">Средняя точность OCR</span>
            <span className="metric-value">{data.cards.avgOcrAccuracy}%</span>
          </div>
          <span className="metric-icon green-icon"><RiseOutlined /></span>
        </div>
        <div className="metric-card">
          <div className="metric-meta">
            <span className="metric-title">Найдено аномалий</span>
            <span className="metric-value red-text">{data.cards.activeAnomaliesCount}</span>
            <span className="metric-trend danger-text"><WarningOutlined /> Требуют проверки</span>
          </div>
          <span className="metric-icon orange-icon"><WarningOutlined /></span>
        </div>
        <div className="metric-card">
          <div className="metric-meta">
            <span className="metric-title">Ожидают проверки</span>
            <span className="metric-value">{data.cards.waitingReview}</span>
            <span className="metric-trend text-muted"><ClockCircleOutlined /> В очереди</span>
          </div>
          <span className="metric-icon gray-icon"><ClockCircleOutlined /></span>
        </div>
      </div>
      <div className="middle-section-layout">
        <div className="chart-card">
          <h3 className="panel-title">Динамика обработки</h3>
          <div className="chart-axis-y-container">
            <div className="chart-bars-area">
              {(() => {
                const maxValue = Math.max(
                  1,
                  ...data.dailyStats.flatMap(item => [item.processed, item.warnings, item.manual]),
                )
                return data.dailyStats.map(item => {
                const hProcessed = (item.processed / maxValue) * 140
                const hWarnings = (item.warnings / maxValue) * 140
                const hManual = (item.manual / maxValue) * 140
                return (
                  <div key={item.day} className="chart-column-group">
                    <div className="bars-sub-grid">
                      <div className="bar bar-processed" style={{ height: `${hProcessed}px` }} title={`Обработано: ${item.processed}`} />
                      <div className="bar bar-warning" style={{ height: `${hWarnings}px` }} title={`С предупреждениями: ${item.warnings}`} />
                      <div className="bar bar-manual" style={{ height: `${hManual}px` }} title={`Ручная корректировка: ${item.manual}`} />
                    </div>
                    <span className="day-label">{item.day}</span>
                  </div>
                )
              })
              })()}
            </div>
          </div>
          <div className="chart-legend">
            <div className="legend-item"><span className="legend-dot blue-dot" /> Обработано</div>
            <div className="legend-item"><span className="legend-dot orange-dot" /> С предупреждениями</div>
            <div className="legend-item"><span className="legend-dot red-dot" /> Ручная корректировка</div>
          </div>
        </div>
        <div className="anomalies-side-panel">
          <div className="panel-flex-header">
            <h3 className="panel-title" style={{ margin: 0 }}>Последние аномалии</h3>
            <span className="view-all-link" onClick={() => navigate('/anomalies')}>Все ↗</span>
          </div>
          <div className="anomalies-list-wrapper">
            {data.recentAnomalies.length === 0 ? (
              <div className="empty-anomalies-stub">✅ Необработанных аномалий в системе нет</div>
            ) : (
              data.recentAnomalies.map(anomaly => (
                <div key={anomaly.id} className="anomaly-item-row">
                  <div className="anomaly-indicator-dot" />
                  <div className="anomaly-text-block">
                    <span className="anomaly-message-title">{anomaly.message}</span>
                    <span className="anomaly-doc-code">{anomaly.documentNumber}</span>
                    <span className="anomaly-action-redirect" onClick={() => navigate(`/anomalies`)}>Открыть</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="bottom-quality-card">
        <h3 className="panel-title">Качество распознавания по полям</h3>
        <div className="progress-bars-stack">
          {data.fieldAccuracy.map(field => (
            <div key={field.name} className="progress-row-item">
              <div className="progress-meta-label">
                <span>{field.name}</span>
                <strong className="pct-value">{field.value}%</strong>
              </div>
              <div className="progress-track-line">
                <div className="progress-fill-line" style={{ width: `${field.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .dashboard-page { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; min-height: 100vh; padding-bottom: 40px; }
        .dashboard-header { margin-bottom: 24px; }
        .dashboard-header h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .subtitle { color: #64748b; font-size: 13px; margin: 0; }

        /* Metrics Cards Grid */
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
        .metric-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .metric-meta { display: flex; flex-direction: column; gap: 4px; }
        .metric-title { font-size: 13px; color: #64748b; font-weight: 500; }
        .metric-value { font-size: 28px; font-weight: 700; color: #0f172a; line-height: 1.1; }
        .metric-trend { font-size: 12px; font-weight: 600; margin-top: 2px; }
        .metric-trend.up { color: #16a34a; }
        .metric-trend.danger-text { color: #ea580c; }
        .red-text { color: #ef4444 !important; }
        .metric-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        
        /* Icon backgrounds colors */
        .blue-icon { background: #eff6ff; color: #2563eb; }
        .green-icon { background: #f0fdf4; color: #16a34a; }
        .orange-icon { background: #fff7ed; color: #ea580c; }
        .gray-icon { background: #f8fafc; color: #64748b; }

        /* Middle Section Rules */
        .middle-section-layout { display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap; }
        .chart-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; flex: 2; min-width: 500px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .anomalies-side-panel { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; flex: 1; min-width: 320px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        
        .panel-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0 0 20px 0; }
        .panel-flex-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .view-all-link { color: #2563eb; font-size: 12px; font-weight: 600; cursor: pointer; }
        .view-all-link:hover { text-decoration: underline; }

        /* Pure HTML/CSS Bar Chart Engine */
        .chart-axis-y-container { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 16px; position: relative; }
        .chart-bars-area { height: 170px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 16px; }
        .chart-column-group { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; min-width: 0; }
        .bars-sub-grid { display: flex; align-items: flex-end; gap: 3px; height: 140px; padding: 0 6px; background: #f8fafc; border-radius: 8px; }
        .bar { width: 24px; border-radius: 6px 6px 0 0; transition: transform 0.2s; cursor: pointer; }
        .bar:hover { transform: scaleY(1.05); }
        .bar-processed { background-color: #2563eb; }
        .bar-warning { background-color: #f59e0b; }
        .bar-manual { background-color: #ef4444; }
        .day-label { font-size: 11px; color: #64748b; font-weight: 600; }

        /* Chart Legend Styles */
        .chart-legend { display: flex; justify-content: center; gap: 20px; margin-top: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748b; font-weight: 500; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .blue-dot { background: #2563eb; }
        .orange-dot { background: #f59e0b; }
        .red-dot { background: #ef4444; }

        /* Anomalies List styling */
        .anomalies-list-wrapper { display: flex; flex-direction: column; gap: 12px; }
        .anomaly-item-row { border: 1px solid #f1f5f9; border-radius: 12px; padding: 12px 14px; display: flex; gap: 12px; align-items: flex-start; transition: background 0.15s; }
        .anomaly-item-row:hover { background: #f8fafc; }
        .anomaly-indicator-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; margin-top: 6px; flex-shrink: 0; }
        .anomaly-text-block { display: flex; flex-direction: column; gap: 2px; flex: 1; position: relative; }
        .anomaly-message-title { font-size: 13px; font-weight: 600; color: #1e293b; padding-right: 50px; }
        .anomaly-doc-code { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .anomaly-action-redirect { position: absolute; right: 0; top: 0; font-size: 11px; color: #2563eb; font-weight: 600; cursor: pointer; }
        .anomaly-action-redirect:hover { text-decoration: underline; }
        .empty-anomalies-stub { text-align: center; color: #10b981; font-size: 13px; padding: 30px; font-weight: 500; }

        /* Bottom Quality Section (image_d420db.png) */
        .bottom-quality-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .progress-bars-stack { display: flex; flex-direction: column; gap: 16px; }
        .progress-row-item { display: flex; flex-direction: column; gap: 6px; }
        .progress-meta-label { display: flex; justify-content: space-between; font-size: 12px; color: #334155; font-weight: 500; }
        .pct-value { color: #16a34a; font-weight: 600; }
        .progress-track-line { height: 6px; background-color: #f1f5f9; border-radius: 3px; overflow: hidden; width: 100%; }
        .progress-fill-line { height: 100%; background-color: #16a34a; border-radius: 3px; }

        /* Adaptive rules */
        @media (max-width: 1024px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
          .chart-card, .anomalies-side-panel { flex: 1 1 100%; min-width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
