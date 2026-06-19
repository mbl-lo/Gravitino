import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { documentsService, Document } from '../services/documents'
import { HistoryOutlined, EyeOutlined } from '@ant-design/icons';


const ArchivePage = () => {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchParams, setSearchParams] = useSearchParams()
  const globalSearch = searchParams.get('search') || ''

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [driverSearch, setDriverSearch] = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [exportFormat, setExportFormat] = useState('JSON')
  const [onlyAnomalies, setOnlyAnomalies] = useState(false)

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    try {const filters: any = {}
      if (fromDate) filters.fromDate = fromDate
      if (toDate) filters.toDate = toDate
      if (onlyAnomalies) filters.hasAnomalies = true
      if (globalSearch) filters.search = globalSearch 

      const data = await documentsService.getDocumentsList(filters)
      setDocuments(data)
    } catch (err) {
      console.error('Ошибка загрузки архива:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fromDate, toDate, onlyAnomalies, globalSearch])

  useEffect(() => {
  loadDocumentsRef.current = loadDocuments
}, [loadDocuments])

useEffect(() => {
  loadDocumentsRef.current()
}, [loadDocuments])

const loadDocumentsRef = useRef<() => Promise<void>>(() => Promise.resolve())

  const handleReset = () => {
    setFromDate('')
    setToDate('')
    setDriverSearch('')
    setVehicleSearch('')
    setDivisionFilter('all')
    setOnlyAnomalies(false)
    setSearchParams({})
  }

  const getField = (doc: Document, key: string): string => {
    const field = doc.fields?.find(f => f.fieldKey === key)
    if (!field) return '—'
    return field.correctedValue || field.recognizedValue || '—'
  }

  const filteredDocuments = documents.filter(doc => {
    if (globalSearch.trim()) {
      const searchLower = globalSearch.toLowerCase()
      const driver = getField(doc, 'driver_name').toLowerCase()
      const plate = getField(doc, 'vehicle_plate').toLowerCase()
      const model = getField(doc, 'vehicle_model').toLowerCase()
      const docNum = getField(doc, 'document_number').toLowerCase()
      const fileName = (doc.originalFileName ?? '').toLowerCase()

      return (
        driver.includes(searchLower) ||
        plate.includes(searchLower) ||
        model.includes(searchLower) ||
        docNum.includes(searchLower) ||
        fileName.includes(searchLower)
      )
    }

    if (divisionFilter !== 'all') {
      const div = getField(doc, 'division').toLowerCase()
      if (!div.includes(divisionFilter.toLowerCase())) return false
    }
    if (driverSearch.trim()) {
      const driver = getField(doc, 'driver_name').toLowerCase()
      if (!driver.includes(driverSearch.toLowerCase())) return false
    }
    if (vehicleSearch.trim()) {
      const plate = getField(doc, 'vehicle_plate').toLowerCase()
      const model = getField(doc, 'vehicle_model').toLowerCase()
      if (!plate.includes(vehicleSearch.toLowerCase()) && !model.includes(vehicleSearch.toLowerCase())) return false
    }
    
    return true
  })

  const handleDownloadFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(documentsService.getFileUrl(id), '_blank')
  }

  const handleExport = (doc: Document) => {
    const fmt = exportFormat.toLowerCase()
    const url = `http://localhost:3000/documents/export?format=${fmt}&search=${encodeURIComponent(doc.documentNumber ?? doc.id)}`
    const a = window.document.createElement('a')
    a.href = url
    a.download = `document-${doc.documentNumber ?? doc.id}.${fmt}`
    a.click()
  }

  return (
    <div className="archive-page">
      <div className="page-header">
        <div className="archive-container">
          <h1>Архив путевых листов</h1>
          <p style={{ margin: '6px 0px 0px', color: 'rgb(102, 112, 133)', fontSize: '15px' }}>Поиск, фильтрация и просмотр всех обработанных документов</p>
        </div>
      </div>
      <div className="archive-container">
        <div className="search-card">
          <h3 className="section-title">Расширенный поиск</h3>
          <div className="filters-grid">
            <div className="filter-item">
              <label>Дата от</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Дата до</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Водитель</label>
              <input type="text" placeholder="ФИО водителя" value={driverSearch} onChange={e => setDriverSearch(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Номер автомобиля</label>
              <input type="text" placeholder="Госномер" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} />
            </div>
            <div className="filter-item">
              <label>Подразделение</label>
              <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)}>
                <option value="all">Все подразделения</option>
                <option value="Центральный парк">Центральный парк</option>
              </select>
            </div>
            <div className="filter-item">
              <label>Формат экспорта</label>
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)}>
                <option value="JSON">JSON</option>
                <option value="CSV">CSV</option>
                <option value="XLSX">Excel (XLSX)</option>
              </select>
            </div>
          </div>
          <div className="search-actions">
            <label className="checkbox-container">
              <input type="checkbox" checked={onlyAnomalies} onChange={e => setOnlyAnomalies(e.target.checked)} />
              <span>Только с аномалиями</span>
            </label>
            <div className="btn-group">
              <button type="button" className="btn btn-outline" onClick={handleReset}>Сброс</button>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="loading-state">Загрузка данных архива...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">Документы, удовлетворяющие критериям поиска, не найдены.</div>
        ) : (
          <div className="table-wrapper">
            <table className="archive-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата</th>
                  <th>Водитель</th>
                  <th>Автомобиль</th>
                  <th>Пробег</th>
                  <th>Расход топлива</th>
                  <th>OCR Точность</th>
                  <th>Аномалии</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map(doc => {
                  const docNum = getField(doc, 'document_number')
                  const tripDate = getField(doc, 'date')
                  const driver = getField(doc, 'driver_name')
                  const vehicle = getField(doc, 'vehicle_plate')
                  const mileage = getField(doc, 'mileage')
                  const fuel = getField(doc, 'fuel_consumption')
                  const accuracy = doc.ocrConfidence ? Math.round(doc.ocrConfidence * 100) : 100
                  let accClass = 'acc-green'
                  if (accuracy < 95) accClass = 'acc-orange'
                  if (accuracy < 80) accClass = 'acc-red'

                  const anomaliesCount = doc.anomalies ? doc.anomalies.length : 0

                  return (
                    <tr key={doc.id} onClick={() => navigate(`/documents/${doc.id}`)}>
                      <td className="doc-id-cell">{docNum !== '—' ? docNum : `ID-${doc.id.substring(0,8)}`}</td>
                      <td>{tripDate}</td>
                      <td>{driver}</td>
                      <td>{vehicle}</td>
                      <td>{mileage !== '—' ? `${mileage} км` : '—'}</td>
                      <td>{fuel !== '—' ? `${fuel} л` : '—'}</td>
                      <td>
                        <span className={`accuracy-tag ${accClass}`}>{accuracy}%</span>
                      </td>
                      <td>
                        {anomaliesCount > 0 ? (
                          <span className="anomaly-badge">{anomaliesCount}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="actions-cell">
                          <button className="action-icon-btn" title="Просмотр карточки" onClick={() => navigate(`/documents/${doc.id}`)}><EyeOutlined /></button>
                          <button className="action-icon-btn" title="Скачать скан" onClick={(e) => handleDownloadFile(doc.id, e)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-download w-4 h-4 text-gray-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg></button>
                          <button className="action-icon-btn" title={`Экспорт ${exportFormat}`} onClick={() => handleExport(doc)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-json w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"></path><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"></path></svg></button>
                          <button className="action-icon-btn" title="История изменений"><HistoryOutlined /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .archive-page { min-height: 100vh; background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; padding-top: 8px; padding-bottom: 32px; box-sizing: border-box; }
        .archive-container { margin: 0 auto; padding: 0 8px; }
        .page-header { margin-bottom: 24px; }
        .page-header h1 { font-size: 30px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: #101828; margin: 0; }

        .search-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .section-title { font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0; }
        .filters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px; }
        .filter-item { display: flex; flex-direction: column; gap: 6px; }
        .filter-item label { font-size: 12px; font-weight: 500; color: #475569; }
        .filter-item input, .filter-item select { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px; background-color: white; outline: none; }
        .filter-item input:focus, .filter-item select:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
        
        .search-actions { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        .checkbox-container { display: flex; alignItems: center; gap: 8px; font-size: 13px; color: #334155; cursor: pointer; font-weight: 500; }
        .checkbox-container input { width: 15px; height: 15px; cursor: pointer; }
        .btn-group { display: flex; gap: 12px; }
        .btn { padding: 9px 24px; font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.15s; border: none; }
        .btn-primary { background-color: #2563eb; color: white; }
        .btn-primary:hover { background-color: #1d4ed8; }
        .btn-outline { background-color: white; color: #475569; border: 1px solid #cbd5e1; }
        .btn-outline:hover { background-color: #f8fafc; border-color: #94a3b8; }
        
        .table-wrapper { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.01); }
        .archive-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }
        .archive-table th { background: #f8fafc; padding: 12px 16px; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        .archive-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; vertical-align: middle; }
        .archive-table tbody tr { cursor: pointer; transition: background 0.15s; }
        .archive-table tbody tr:hover { background-color: #f8fafc; }
        
        .doc-id-cell { color: #2563eb; font-weight: 600; }
        .accuracy-tag { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .acc-green { background-color: #f0fdf4; color: #16a34a; }
        .acc-orange { background-color: #fffbeb; color: #d97706; }
        .acc-red { background-color: #fef2f2; color: #dc2626; }
        
        .anomaly-badge { background-color: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; font-weight: 700; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; line-height: 1; }
        .actions-cell { display: flex; gap: 14px; font-size: 15px; }
        .action-icon-btn { background: none; border: none; cursor: pointer; padding: 2px; opacity: 0.65; transition: opacity 0.15s, transform 0.1s; }
        .action-icon-btn:hover { opacity: 1; transform: scale(1.15); }
        
        .loading-state, .empty-state { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; text-align: center; color: #64748b; font-size: 14px; }
      `}</style>
    </div>
  )
}

export default ArchivePage