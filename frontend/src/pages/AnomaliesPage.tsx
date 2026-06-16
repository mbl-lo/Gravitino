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

const STATUS_MAP: Record<string, string> = {
  open: 'status-open',
  fixed: 'status-fixed',
  hidden: 'status-hidden',
  incorrect: 'status-incorrect',
  insufficient: 'status-insufficient',
};

const STATUS_TEXT: Record<string, string> = {
  open: 'Открыто',
  fixed: 'Исправлено',
  hidden: 'Скрыто',
  incorrect: 'Неправильные',
  insufficient: 'Недостаточные',
};

const AnomaliesPage = () => {
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState<BackendAnomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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
  const uniqueTypes = [...new Set(anomalies.map(a => a.type))];

  const filtered = anomalies.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  // Подсчет статистики (только для активных аномалий)
  const stats = {
    hight: anomalies.filter(a => a.severity === 'high' && a.status !== 'fixed').length,
    critical: anomalies.filter(a => a.severity === 'critical' && a.status !== 'fixed').length,
    medium: anomalies.filter(a => a.severity === 'medium' && a.status !== 'fixed').length,
    low: anomalies.filter(a => a.severity === 'low'  && a.status !== 'fixed').length,
    fixed: anomalies.filter(a => a.status === 'fixed').length,
    hidden: anomalies.filter(a => a.status === 'hidden').length,
    incorrect: anomalies.filter(a => a.status === 'incorrect').length,
    insufficient: anomalies.filter(a => a.status === 'insufficient').length,
  };

  const openDocument = (documentId: string) => navigate(`/documents/${documentId}`);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return dateString;
  };

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
          <p className="subtitle">Автоматическое выявление логических несоответствий в путевых листах</p>
        </div>
      </div>

      <div className="container">
        {/* Статистика */}
        <div className="stats-grid">
        <div className="stat-card">
            <div className="stat-dot high"></div>
            <div className="stat-value">{stats.hight}</div>
            <div className="stat-label">Высокие</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot critical"></div>
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Критические</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot medium"></div>
            <div className="stat-value">{stats.medium}</div>
            <div className="stat-label">Средние</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot low"></div>
            <div className="stat-value">{stats.low}</div>
            <div className="stat-label">Низкие</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot fixed-dot"></div>
            <div className="stat-value">{stats.fixed}</div>
            <div className="stat-label">Исправлены</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot hidden-dot"></div>
            <div className="stat-value">{stats.hidden}</div>
            <div className="stat-label">Скрытые</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot incorrect"></div>
            <div className="stat-value">{stats.incorrect}</div>
            <div className="stat-label">Неправильные</div>
          </div>
          <div className="stat-card">
            <div className="stat-dot insufficient"></div>
            <div className="stat-value">{stats.insufficient}</div>
            <div className="stat-label">Недостаточные</div>
          </div>
        </div>

        {/* Фильтры */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Серьезность</label>
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}>
              <option value="all">Все</option>
              <option value="critical">Критические</option>
              <option value="high">Высокие</option>
              <option value="medium">Средние</option>
              <option value="low">Низкие</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Тип аномалии</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">Все типы</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Статус</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Все</option>
              <option value="open">Открыто</option>
              <option value="fixed">Исправлено</option>
              <option value="hidden">Скрыто</option>
              <option value="incorrect">Неправильные</option>
              <option value="insufficient">Недостаточные</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Дата</label>
            <input type="text" placeholder="ДД.ММ.ГГГГ" disabled />
          </div>
        </div>

        {/* Результаты */}
        <div className="results-header">
          <span>Найдено аномалий: <strong>{filtered.length}</strong></span>
        </div>

        {/* Таблица */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>Аномалий не найдено по выбранным фильтрам</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="anomalies-table">
              <thead>
                <tr>
                  <th>Документ</th>
                  <th>Тип аномалии</th>
                  <th>Поле</th>
                  <th>Серьезность</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(anomaly => (
                  <tr key={anomaly.id} onClick={() => openDocument(anomaly.documentId)}>
                    <td>
                      <button className="document-link">
                        {anomaly.documentNumber}
                      </button>
                    </td>
                    <td>{anomaly.type}</td>
                    <td>{anomaly.fieldLabel}</td>
                    <td>
                      <span className={`severity-badge ${SEVERITY_MAP[anomaly.severity] || 'severity-medium'}`}>
                        {SEVERITY_TEXT[anomaly.severity] || anomaly.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${STATUS_MAP[anomaly.status] || 'status-open'}`}>
                        {STATUS_TEXT[anomaly.status] || anomaly.status}
                      </span>
                    </td>
                    <td>{formatDate(anomaly.detectedAt)}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDocument(anomaly.documentId);
                        }}
                      >
                        Открыть
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .anomalies-page {
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* Header */
        .page-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 24px 0;
          margin-bottom: 28px;
        }

        .page-header h1 {
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #64748b;
          font-size: 14px;
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 14px 12px;
          text-align: center;
          transition: all 0.2s;
        }

        .stat-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin: 0 auto 6px;
        }

        .stat-dot.high { background-color: #d40000; }
        .stat-dot.critical { background-color: #ef4444; }
        .stat-dot.medium { background-color: #f59e0b; }
        .stat-dot.low { background-color: #3b82f6; }
        .stat-dot.fixed-dot { background-color: #10b981; }
        .stat-dot.hidden-dot { background-color: #8b5cf6; }
        .stat-dot.incorrect { background-color: #f97316; }
        .stat-dot.insufficient { background-color: #64748b; }

        .stat-value {
          font-size: 26px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }

        /* Filters */
        .filters-bar {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 24px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          padding: 8px 32px 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13px;
          background: white;
          min-width: 160px;
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

        /* Results header */
        .results-header {
          margin-bottom: 16px;
          font-size: 13px;
          color: #475569;
        }

        .results-header strong {
          color: #2563eb;
          font-size: 15px;
        }

        /* Table */
        .table-wrapper {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }

        .anomalies-table {
          width: 100%;
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
        }

        .anomalies-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }

        .anomalies-table tbody tr {
          cursor: pointer;
          transition: background 0.2s;
        }

        .anomalies-table tbody tr:hover {
          background: #f8fafc;
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
        }

        .document-link:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Severity badges */
        .severity-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
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
        }

        .status-open {
          background: #ffedd5;
          color: #ea580c;
        }

        .status-fixed {
          background: #d1fae5;
          color: #059669;
        }

        .status-hidden {
          background: #ede9fe;
          color: #7c3aed;
        }

        .status-incorrect {
          background: #fef2f2;
          color: #dc2626;
        }

        .status-insufficient {
          background: #f1f5f9;
          color: #475569;
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
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 900px) {
          .container {
            padding: 0 16px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .filters-bar {
            flex-direction: column;
            gap: 12px;
          }
          
          .filter-group select,
          .filter-group input {
            width: 100%;
          }
          
          .table-wrapper {
            overflow-x: auto;
          }
          
          .anomalies-table {
            min-width: 700px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnomaliesPage;