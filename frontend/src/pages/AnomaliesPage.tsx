import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnomalies } from '../services/api';

// Тип под данные с бэкенда
interface BackendAnomaly {
  id: string;
  documentId: string;
  documentNumber: string;
  type: string;
  fieldLabel: string;
  severity: string;
  status: string;
  detectedAt?: string;
  expectedValue?: string;
  actualValue?: string;
  rule?: string;
  recommendedAction?: string | null;
}

const SEVERITY_MAP: Record<string, string> = {
  critical: 'severity-critical',
  high: 'severity-high',
  medium: 'severity-medium',
  low: 'severity-low',
};

const SEVERITY_TEXT: Record<string, string> = {
  critical: 'Критическая',
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
};

const SeverityIcon = ({ severity }: { severity: string }) => {
  if (severity === 'critical' || severity === 'high') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    );
  }
  if (severity === 'medium') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
};

const STATUS_MAP: Record<string, string> = {
  open: 'status-open',
  review: 'status-review',
  fixed: 'status-fixed',
};

const STATUS_TEXT: Record<string, string> = {
  open: 'Открыто',
  review: 'На проверке',
  fixed: 'Исправлено',
};

const AnomaliesPage = () => {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState<BackendAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fetchRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchAnomalies = useCallback(async () => {
    try {
      const response = await getAnomalies();
      setAnomalies(response.data as unknown as BackendAnomaly[]);
    } catch (error) {
      console.error('Ошибка при загрузке аномалий:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRef.current = fetchAnomalies; }, [fetchAnomalies]);
  useEffect(() => { fetchRef.current(); }, []);

  // Получаем уникальные типы аномалий для фильтра
  const filtered = anomalies.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterDate && a.detectedAt?.slice(0, 10) !== filterDate) return false;
    return true;
  });

  const selectedAnomaly = anomalies.find(a => a.id === selectedId) || null;

  // Подсчет статистики (только для активных аномалий)
  const stats = {
    critical: anomalies.filter(a => a.severity === 'critical' && a.status !== 'fixed').length,
    medium: anomalies.filter(a => a.severity === 'medium' && a.status !== 'fixed').length,
    low: anomalies.filter(a => a.severity === 'low'  && a.status !== 'fixed').length,
    fixed: anomalies.filter(a => a.status === 'fixed').length,
  };

  const openDocument = (documentId: string) => navigate(`/documents/${documentId}`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Загрузка аномалий...</div>
      </div>
    );
  }

  return (
    <div className="anomalies-page">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <h1>Аномалии и ошибки</h1>
          <p style={{ margin: '6px 0px 0px', color: 'rgb(102, 112, 133)', fontSize: '15px' }}>Автоматическое выявление логических несоответствий в путевых листах</p>
        </div>
      </div>

      <div className="container">
        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-meta">
              <div className="stat-value stat-value-critical">{stats.critical}</div>
              <div className="stat-label">Критические</div>
            </div>
            <span className="stat-icon stat-icon-critical">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </span>
          </div>
          <div className="stat-card">
            <div className="stat-meta">
              <div className="stat-value stat-value-medium">{stats.medium}</div>
              <div className="stat-label">Средние</div>
            </div>
            <span className="stat-icon stat-icon-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </span>
          </div>
          <div className="stat-card">
            <div className="stat-meta">
              <div className="stat-value stat-value-low">{stats.low}</div>
              <div className="stat-label">Низкие</div>
            </div>
            <span className="stat-icon stat-icon-low">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </span>
          </div>
          <div className="stat-card">
            <div className="stat-meta">
              <div className="stat-value stat-value-fixed">{stats.fixed}</div>
              <div className="stat-label">Исправлены</div>
            </div>
            <span className="stat-icon stat-icon-fixed">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                <path d="m9 11 3 3L22 4" />
              </svg>
            </span>
          </div>
        </div>

        {/* Фильтры */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Серьезность</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">Все</option>
              <option value="critical">Критические</option>
              <option value="medium">Средние</option>
              <option value="low">Низкие</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Тип аномалии</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Все типы</option>
              <option value="Несоответствие пробега">Несоответствие пробега</option>
              <option value="Расход топлива выше нормы">Расход топлива</option>
              <option value="Отсутствует подпись">Отсутствие подписи</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Статус</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Все</option>
              <option value="open">Открыто</option>
              <option value="review">На проверке</option>
              <option value="fixed">Исправлено</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Дата</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>

          <button className="apply-btn" onClick={() => fetchRef.current()}>Применить</button>
        </div>

        {/* Таблица */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>Аномалий не найдено по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="results-layout">
            <div className="table-wrapper">
              <table className="anomalies-table">
                <thead>
                  <tr>
                    <th>Документ</th>
                    <th>Тип аномалии</th>
                    <th>Поле</th>
                    <th>Серьезность</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(anomaly => (
                    <tr
                      key={anomaly.id}
                      className={anomaly.id === selectedId ? 'row-selected' : ''}
                      onClick={() => setSelectedId(anomaly.id)}
                    >
                      <td>
                        <button
                          className="document-link"
                          onClick={(e) => { e.stopPropagation(); openDocument(anomaly.documentId); }}
                        >
                          {anomaly.documentNumber}
                        </button>
                      </td>
                      <td>{anomaly.type}</td>
                      <td>{anomaly.fieldLabel}</td>
                      <td>
                        <span className={`severity-badge ${SEVERITY_MAP[anomaly.severity] || 'severity-medium'}`}>
                          <SeverityIcon severity={anomaly.severity} />
                          {SEVERITY_TEXT[anomaly.severity] || anomaly.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${STATUS_MAP[anomaly.status] || 'status-open'}`}>
                          {STATUS_TEXT[anomaly.status] || anomaly.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detail-panel">
              {!selectedAnomaly ? (
                <p className="detail-empty">Выберите аномалию из списка, чтобы увидеть детали</p>
              ) : (
                <>
                  <h3 className="detail-title">Детали аномалии</h3>

                  <div className="detail-field">
                    <span className="detail-label">Документ</span>
                    <button className="detail-doc-link" onClick={() => openDocument(selectedAnomaly.documentId)}>
                      {selectedAnomaly.documentNumber}
                    </button>
                  </div>

                  <div className="detail-field">
                    <span className="detail-label">Тип аномалии</span>
                    <strong>{selectedAnomaly.type}</strong>
                  </div>

                  {selectedAnomaly.rule && (
                    <div className="detail-field">
                      <span className="detail-label">Правило</span>
                      <span>{selectedAnomaly.rule}</span>
                    </div>
                  )}

                  {selectedAnomaly.actualValue && (
                    <div className="detail-box detail-box-danger">
                      <span className="detail-label">Обнаружено</span>
                      <strong>{selectedAnomaly.actualValue}</strong>
                    </div>
                  )}

                  {selectedAnomaly.expectedValue && (
                    <div className="detail-box detail-box-success">
                      <span className="detail-label">Ожидается</span>
                      <strong>{selectedAnomaly.expectedValue}</strong>
                    </div>
                  )}

                  {selectedAnomaly.recommendedAction && (
                    <div className="detail-field">
                      <span className="detail-label">Рекомендуемое действие</span>
                      <span>{selectedAnomaly.recommendedAction}</span>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button className="detail-btn detail-btn-primary" onClick={() => openDocument(selectedAnomaly.documentId)}>
                      Открыть документ
                    </button>
                    <button className="detail-btn detail-btn-success">Пометить как исправлено</button>
                    <button className="detail-btn detail-btn-outline">Отклонить</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .anomalies-page {
          min-height: 100vh;
          width: 100% !important;
          max-width: none !important;
          flex-shrink: 0 !important;
          background-color: #f8fafc;
          padding-top: 8px;
          padding-bottom: 32px;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .container {
          margin: 0 auto;
          width: 100% !important;
          max-width: none !important;
          padding: 0 8px;
          box-sizing: border-box;
          min-width: 0;
        }

        /* Header */
        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 30px;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #101828;
          margin: 0;
        }

        .page-header p {
          max-width: 840px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s;
          min-width: 0;
        }

        .stat-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .stat-value {
          font-size: 30px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
          overflow-wrap: anywhere;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .stat-value-critical { color: #dc2626; }
        .stat-value-medium { color: #f59e0b; }
        .stat-value-low { color: #4b5563; }
        .stat-value-fixed { color: #16a34a; }

        .stat-icon-critical { background: #fef2f2; color: #dc2626; }
        .stat-icon-medium { background: #fffbeb; color: #d97706; }
        .stat-icon-low { background: #f3f4f6; color: #4b5563; }
        .stat-icon-fixed { background: #ecfdf5; color: #16a34a; }

        /* Filters */
        .filters-bar {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
          margin-bottom: 24px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1 1 180px;
          min-width: 0;
        }

        .filter-group label {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-group select,
        .filter-group input {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 8px 32px 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }

        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .filter-group input:disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .apply-btn {
          align-self: flex-end;
          min-height: 35px;
          flex: 0 0 auto;
          padding: 9px 20px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .apply-btn:hover {
          background: #1d4ed8;
        }

        /* Results layout: table + detail panel */
        .results-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          min-width: 0;
        }

        .results-layout .table-wrapper {
          flex: 2.2;
          min-width: 0;
        }

        .detail-panel {
          flex: 1;
          min-width: 280px;
          max-width: 360px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-sizing: border-box;
        }

        .detail-empty {
          color: #94a3b8;
          font-size: 14px;
          text-align: center;
          padding: 24px 0;
        }

        .detail-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px 0;
        }

        .detail-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 16px;
          min-width: 0;
        }

        .detail-label {
          font-size: 12px;
          color: #64748b;
        }

        .detail-doc-link {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          padding: 0;
          text-align: left;
          overflow-wrap: anywhere;
        }

        .detail-doc-link:hover {
          text-decoration: underline;
        }

        .detail-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 12px;
          overflow-wrap: anywhere;
        }

        .detail-box-danger {
          background: #fef2f2;
          border-left: 4px solid #dc2626;
        }

        .detail-box-danger strong {
          color: #dc2626;
        }

        .detail-box-success {
          background: #ecfdf5;
          border-left: 4px solid #16a34a;
        }

        .detail-box-success strong {
          color: #16a34a;
        }

        .detail-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        .detail-btn {
          width: 100%;
          min-height: 42px;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .detail-btn-primary {
          background: #2563eb;
          color: white;
        }

        .detail-btn-success {
          background: #16a34a;
          color: white;
        }

        .detail-btn-outline {
          background: white;
          border: 1px solid #e2e8f0;
          color: #334155;
        }

        /* Table */
        .table-wrapper {
          max-width: 100%;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .anomalies-table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
          font-size: 14px;
        }

        .anomalies-table thead tr {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .anomalies-table th {
          text-align: left;
          padding: 14px 16px;
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .anomalies-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }

        .anomalies-table td:first-child,
        .anomalies-table td:nth-child(4),
        .anomalies-table td:nth-child(5) {
          white-space: nowrap;
        }

        .anomalies-table td:nth-child(2),
        .anomalies-table td:nth-child(3) {
          min-width: 180px;
        }

        .anomalies-table tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .anomalies-table tbody tr:hover {
          background: #f8fafc;
        }

        .anomalies-table tbody tr.row-selected {
          background: #eff6ff;
        }

        /* Document link */
        .document-link {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          white-space: nowrap;
        }

        .document-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Severity badges */
        .severity-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .severity-critical {
          background: #fef2f2;
          color: #dc2626;
        }

        .severity-high {
          background: #ffedd5;
          color: #ea580c;
        }

        .severity-medium {
          background: #fef3c7;
          color: #d97706;
        }

        .severity-low {
          background: #dbeafe;
          color: #2563eb;
        }

        /* Status badges */
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-open {
          background: #eff6ff;
          color: rgb(37, 99, 235);
        }

        .status-review {
          background: #fffbeb;
          color: #f59e0b;
        }

        .status-fixed {
          background: #ecfdf5;
          color: #16a34a;
        }

        /* View button */
        .view-btn {
          padding: 6px 16px;
          background: #f1f5f9;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          color: #475569;
          transition: all 0.2s;
        }

        .view-btn:hover {
          background: #e2e8f0;
          color: #2563eb;
        }

        /* Empty state */
        .empty-state {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 48px;
          text-align: center;
          color: #64748b;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .results-layout {
            flex-direction: column;
          }

          .results-layout .table-wrapper,
          .detail-panel {
            width: 100%;
            max-width: none;
          }
        }

        @media (max-width: 900px) {
          .container {
            padding: 0 8px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .filters-bar {
            gap: 12px;
          }
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 24px;
          }

          .stats-grid {
            gap: 12px;
            margin-bottom: 20px;
          }

          .stat-card {
            border-radius: 12px;
            padding: 16px;
          }

          .stat-value {
            font-size: 26px;
          }

          .filters-bar {
            flex-direction: column;
            gap: 12px;
            padding: 14px;
          }
          
          .filter-group,
          .apply-btn {
            width: 100%;
          }
          
          .detail-panel {
            padding: 18px;
          }
        }

        @media (max-width: 480px) {
          .container {
            padding: 0 4px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-card {
            align-items: center;
          }

          .empty-state {
            padding: 32px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnomaliesPage;
