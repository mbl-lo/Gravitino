
import React, { useState, useRef, useCallback } from 'react';
import './UploadPage.css';

const UploadPage = () => {
  // Файлы, выбранные пользователем
  const [selectedFiles, setSelectedFiles] = useState([]);
  // Флаг перетаскивания над зоной
  const [isDragover, setIsDragover] = useState(false);
  // Сообщение пользователю
  const [message, setMessage] = useState({ text: '', isError: false });
  // Ссылка на скрытый input
  const fileInputRef = useRef(null);

  // Добавление файлов в список
  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).filter(file => file.size > 0);
    if (newFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setMessage({ text: '', isError: false });
  }, []);

  // Удаление одного файла по индексу
  const removeFile = useCallback((index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMessage({ text: '', isError: false });
  }, []);

  // Полная очистка списка
  const clearAll = useCallback(() => {
    if (selectedFiles.length === 0) return;
    setSelectedFiles([]);
    setMessage({ text: 'Список файлов очищен', isError: false });
  }, [selectedFiles.length]);

  // Имитация загрузки на сервер
  const handleUpload = useCallback(() => {
    if (selectedFiles.length === 0) {
      setMessage({ text: 'Выберите хотя бы один файл для загрузки', isError: true });
      return;
    }

    const fileNames = selectedFiles.map(f => f.name).join(', ');
    setMessage({ text: `Загружено ${selectedFiles.length} файл(ов): ${fileNames}`, isError: false });

    // Очищаем список после загрузки
    setTimeout(() => setSelectedFiles([]), 1500);
  }, [selectedFiles]);

  // Форматирование размера файла
  const formatSize = (bytes) => {
    if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} МБ`;
    }
    return `${(bytes / 1024).toFixed(1)} КБ`;
  };

  // Обработчики drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragover(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragover(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragover(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Обработчик выбора через input
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = ''; // Сброс, чтобы можно было выбрать тот же файл повторно
  };

  return (
    <div className="upload-page">
      <div className="upload-card">
        <h1>Загрузка документов</h1>
        <div className="subtitle">Добавьте PDF, DOCX, XLSX или изображения</div>

        {/* Зона перетаскивания */}
        <div
          className={`drop-zone ${isDragover ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
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

        {/* Список выбранных файлов */}
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
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="actions">
          <button className="btn btn-outline" onClick={clearAll}>Очистить</button>
          <button className="btn btn-primary" onClick={handleUpload}>Загрузить документы</button>
        </div>

        {/* Сообщение */}
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