import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocuments } from '../services/api';
import './UploadPage.css';

type ImageQuality = 'excellent' | 'good' | 'low';

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve(img); URL.revokeObjectURL(url); };
    img.onerror = (e) => { reject(e); URL.revokeObjectURL(url); };
    img.src = url;
  });
};

// Резкость через вариацию Лапласиана (стандартная мера расфокуса) + разрешение исходника
const analyzeImageQuality = async (file: File): Promise<ImageQuality> => {
  const img = await loadImage(file);
  const longSide = Math.max(img.naturalWidth, img.naturalHeight);

  const maxDim = 500;
  const scale = Math.min(1, maxDim / longSide);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'good';
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const laplacian = gray[idx - 1] + gray[idx + 1] + gray[idx - w] + gray[idx + w] - 4 * gray[idx];
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }
  const mean = sum / count;
  const sharpness = sumSq / count - mean * mean;

  const isHighRes = longSide >= 1500;
  const isMediumRes = longSide >= 800;
  const isSharp = sharpness > 300;
  const isMediumSharp = sharpness > 80;

  if (isHighRes && isSharp) return 'excellent';
  if ((isHighRes || isMediumRes) && isMediumSharp) return 'good';
  return 'low';
};

const UploadPage = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileQuality, setFileQuality] = useState<Map<File, ImageQuality>>(new Map());
  const [isDragover, setIsDragover] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('Путевой лист легкового автомобиля');
  const [division, setDivision] = useState('Центральный парк');
  const [tripDate, setTripDate] = useState('');
  const [autoRecognize, setAutoRecognize] = useState(true);
  const [checkAnomalies, setCheckAnomalies] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file: File) => file.size > 0);
    if (newFiles.length === 0) return;
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setMessage({ text: '', isError: false });

    newFiles
      .filter(file => file.type.startsWith('image/') && file.type !== 'image/heic')
      .forEach(file => {
        analyzeImageQuality(file)
          .then(quality => setFileQuality(prev => new Map(prev).set(file, quality)))
          .catch(() => setFileQuality(prev => new Map(prev).set(file, 'good')));
      });
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMessage({ text: '', isError: false });
  }, []);

  const handleCancel = () => {
    setSelectedFiles([]);
    setTripDate('');
    setDivision('Центральный парк');
    setDocumentType('Путевой лист легкового автомобиля');
    setMessage({ text: 'Загрузка отменена', isError: false });
  };

  const handleUpload = async () => {
    if (isUploading) return;
    if (selectedFiles.length === 0) {
      setMessage({ text: 'Выберите хотя бы один файл для загрузки', isError: true });
      return;
    }
    setIsUploading(true);
    setMessage({ text: '', isError: false });
    try {
      const response = await uploadDocuments(selectedFiles, { documentType, division, tripDate});
      setMessage({ text: `Загружено ${response.data.files?.length || selectedFiles.length} файл(ов)`, isError: false });
      setSelectedFiles([]);
      if (autoRecognize) {
        setTimeout(() => {
          navigate('/queue');
        }, 1000);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage({ text: error.response?.data?.error || 'Ошибка при загрузке файлов', isError: true });
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
    return `${(bytes / 1024).toFixed(1)} КБ`;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragover(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragover(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragover(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e);
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Загрузка путевых листов</h1>
        <p style={{ margin: '6px 0px 0px', color: 'rgb(102, 112, 133)', fontSize: '15px' }}>Контроль обработки путевых листов и качества распознавания</p>
      </div>

      {/* Прямоугольник 1: загрузка */}
      <div
        className={`upload-section ${isDragover ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="drop-text">Перетащите файлы сюда или выберите с устройства</div>
        <div className="drop-hint">Поддерживаемые форматы: JPG, PNG, PDF, HEIC</div>
        <div className="upload-buttons">
          <label className="btn btn-primary">
            Выбрать файлы
            <input type="file" multiple accept=".jpg,.jpeg,.png,.pdf,.heic" onChange={handleFileSelect} className="file-input" />
          </label>
          <label className="btn btn-outline-dark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
              <path d="M12 18h.01"/>
            </svg>
            Загрузить с телефона
            <input type="file" multiple accept=".jpg,.jpeg,.png,.heic" onChange={handleFileSelect} className="file-input" />
          </label>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="file-input" multiple accept=".jpg,.jpeg,.png,.pdf,.heic" onChange={handleFileSelect} />

      {/* Прямоугольник 2: настройки */}
      <div className="settings-section">
        <h2>Настройки пакета</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Тип документа</label>
            <select value={documentType} onChange={e => setDocumentType(e.target.value)}>
              <option>Путевой лист легкового автомобиля</option>
              <option>Путевой лист грузового автомобиля</option>
              <option>Сводный путевой лист</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Подразделение</label>
            <select value={division} onChange={e => setDivision(e.target.value)}>
              <option>Центральный парк</option>
              <option>Северный парк</option>
              <option>Западный филиал</option>
            </select>
          </div>
          <div className="setting-item">
            <label>Дата рейса</label>
            <input type="date" value={tripDate} onChange={e => setTripDate(e.target.value)} />
          </div>
          <div className="checkbox-group">
            <label><input type="checkbox" checked={autoRecognize} onChange={e => setAutoRecognize(e.target.checked)} /> Автоматически отправить на распознавание</label>
            <label><input type="checkbox" checked={checkAnomalies} onChange={e => setCheckAnomalies(e.target.checked)} /> Проверять аномалии после OCR</label>
          </div>
        </div>
      </div>

      {/* Загруженные файлы — виден всегда */}
      <div className="selected-files">
        <h3>Загруженные файлы</h3>
        <div className="files-table-wrapper">
          <table className="files-table">
            <thead>
              <tr>
                <th>Миниатюра</th>
                <th>Имя файла</th>
                <th>Размер</th>
                <th>Качество изображения</th>
                <th>Статус</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {selectedFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="files-empty">Нет загруженных файлов</td>
                </tr>
              ) : (
                selectedFiles.map((file, index) => {
                  const isImage = file.type.startsWith('image/');
                  const isPDF = file.type === 'application/pdf';
                  const quality = isPDF ? null : fileQuality.get(file) ?? null;
                  const qualityText = quality === 'excellent' ? 'Отличное' : quality === 'good' ? 'Хорошее' : quality === 'low' ? 'Низкое качество' : isPDF ? '-' : 'Анализ...';
                  const status = isPDF ? 'error' : quality === 'low' ? 'low-quality' : quality === null ? 'analyzing' : 'ready';
                  const statusText = status === 'ready' ? 'Готов к обработке' : status === 'low-quality' ? 'Низкое качество' : status === 'analyzing' ? 'Анализ...' : 'Ошибка формата';

                  return (
                    <tr key={`${file.name}-${index}`}>
                      <td>
                        <div className="file-thumb">
                          {isImage ? (
                            <img src={URL.createObjectURL(file)} alt={file.name} />
                          ) : (
                            <svg className="file-thumb-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                              <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                              <circle cx="10" cy="12" r="2"/>
                              <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/>
                            </svg>
                          )}
                        </div>
                      </td>
                      <td><span className="file-name">{file.name}</span></td>
                      <td><span className="file-size">{formatSize(file.size)}</span></td>
                      <td>
                        <span className={`file-quality ${quality === 'excellent' || quality === 'good' ? 'good' : quality === 'low' ? 'low' : 'none'}`}>
                          {isPDF ? '-' : qualityText}
                        </span>
                      </td>
                      <td>
                        <span className={`file-status-badge ${status}`}>
                          {status === 'ready' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5"/>
                            </svg>
                          )}
                          {status === 'low-quality' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                            </svg>
                          )}
                          {status === 'error' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                            </svg>
                          )}
                          {statusText}
                        </span>
                      </td>
                      <td>
                        <button className="file-remove-btn" onClick={(e) => { e.stopPropagation(); removeFile(index); }} disabled={isUploading}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {message.text && <div className={`message ${message.isError ? 'error' : ''}`}>{message.text}</div>}

      {/* Прямоугольник 3: нижняя панель */}
      <div className="action-bar">
        <button className="btn-cancel" onClick={handleCancel} disabled={isUploading}> Отменить</button>
        <button className="btn-submit" onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
          {isUploading ? 'Загрузка...' : 'Запустить распознавание'}
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
