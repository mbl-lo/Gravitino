import { useState, useRef, useCallback } from 'react';
import { uploadDocuments } from '../services/api';
import './UploadPage.css';

const UploadPage = () => {
  // Файлы, выбранные пользователем
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  // Флаг перетаскивания над зоной
  const [isDragover, setIsDragover] = useState(false);
  // Сообщение пользователю
  const [message, setMessage] = useState({ text: '', isError: false });
  // Флаг загрузки
  const [isUploading, setIsUploading] = useState(false);
  // Ссылка на скрытый input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Добавление файлов в список
  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((file: File) => file.size > 0);
    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setMessage({ text: '', isError: false });
  }, []);

  // Удаление одного файла по индексу
  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMessage({ text: '', isError: false });
  }, []);

  // Полная очистка списка
  const clearAll = useCallback(() => {
    if (selectedFiles.length === 0) return;
    setSelectedFiles([]);
    setMessage({ text: 'Список файлов очищен', isError: false });
  }, [selectedFiles.length]);

  // === Загрузка файлов на сервер ===
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage({ text: 'Выберите хотя бы один файл для загрузки', isError: true });
      return;
    }

    setIsUploading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await uploadDocuments(selectedFiles);
      setMessage({
        text: `Загружено ${response.data.files.length} файл(ов)`,
        isError: false
      });
      setSelectedFiles([]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setMessage({
        text: error.response?.data?.error || 'Ошибка при загрузке файлов',
        isError: true
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Форматирование размера файла
  const formatSize = (bytes: number): string => {
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
    }
    return `${(bytes / 1024).toFixed(1)} КБ`;
  };

  // Обработчики drag & drop
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragover(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragover(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragover(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Обработчик выбора через input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h1>Загрузка документов</h1>
        <div className="subtitle">Добавьте PDF, DOCX, XLSX или изображения</div>

        <div
          className={`drop-zone ${isDragover ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-icon">&#128194;</div>
          <div className="drop-text">Перетащите файлы сюда</div>
          <div className="drop-hint">или нажмите для выбора</div>
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
          />
        </div>

        <div className="selected-files">
          {selectedFiles.length === 0 ? (
            <div className="empty-files">Нет выбранных файлов</div>
          ) : (
            <ul className="file-list">
              {selectedFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className="file-item">
                  <div className="file-info">
                    <span className="file-icon">Ф</span>
                    <span className="file-name" title={file.name}>{file.name}</span>
                    <span className="file-size">{formatSize(file.size)}</span>
                  </div>
                  <button
                    className="remove-file"
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    aria-label="Удалить файл"
                    disabled={isUploading}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="actions">
          <button
            className="btn btn-outline"
            onClick={clearAll}
            disabled={isUploading}
          >
            Очистить
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить документы'}
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.isError ? 'error' : ''}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;