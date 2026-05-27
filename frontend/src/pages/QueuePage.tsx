import React, { useState, useEffect, useCallback } from 'react';
import './QueuePage.css';

const QueuePage = () => {
  // Список документов в очереди
  const [documents, setDocuments] = useState([]);

  // Удаление одного документа
  const removeDocument = useCallback((id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  // Очистка завершённых
  const clearCompleted = useCallback(() => {
    setDocuments(prev => prev.filter(doc => doc.status !== 'completed'));
  }, []);

  // Статистика
  const activeCount = documents.filter(d => d.status === 'processing').length;
  const waitingCount = documents.filter(d => d.status === 'waiting').length;

  // Получение текста и класса статуса
  const getStatusInfo = (status) => {
    switch (status) {
      case 'processing': return { className: 'processing', text: 'Обработка' };
      case 'completed': return { className: 'completed', text: 'Готово' };
      default: return { className: 'waiting', text: 'Ожидание' };
    }
  };

  return (
    <div className="queue-page">
      <div className="queue-panel">
        {/* Заголовок и статистика */}
        <div className="header">
          <div className="title-section">
            <h2>
              Очередь обработки
              <span className="badge">{documents.length}</span>
            </h2>
          </div>
          <div className="stats">
            <span className="stat-item">
              <span className="progress-dot"></span> Активно: <strong>{activeCount}</strong>
            </span>
            <span className="stat-item">
              <span className="progress-dot waiting"></span> Ожидают: <strong>{waitingCount}</strong>
            </span>
          </div>
        </div>

        {/* Список очереди */}
        <div className="queue-list">
          {documents.length === 0 ? (
            <div className="empty-queue">Очередь пуста. Загрузите документы.</div>
          ) : (
            documents.map(doc => {
              const statusInfo = getStatusInfo(doc.status);
              return (
                <div key={doc.id} className="queue-item">
                  <div className="doc-info">
                    <span className="doc-icon">Ф</span>
                    <div className="doc-details">
                      <span className="doc-name" title={doc.name}>{doc.name}</span>
                      <span className="doc-meta">{doc.size} &middot; добавлено {doc.added}</span>
                    </div>
                  </div>
                  <div className="item-right">
                    <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
                    {doc.status === 'processing' && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${doc.progress}%` }}></div>
                      </div>
                    )}
                    <button
                      className="icon-btn remove-btn"
                      onClick={() => removeDocument(doc.id)}
                      title="Удалить"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Кнопки действий */}
        <div className="refresh-section">
          <button className="btn" onClick={() => {}}>Обновить очередь</button>
          <button className="btn btn-primary" onClick={clearCompleted}>Очистить завершённые</button>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;