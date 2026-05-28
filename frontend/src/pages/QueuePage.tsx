import { useState, useEffect, useCallback, useRef } from 'react';
import { getQueue } from '../services/api';
import type { QueueDocument } from '../services/api';
import './QueuePage.css';

const QueuePage = () => {
  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchQueueRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchQueue = useCallback(async () => {
    try {
      const response = await getQueue();
      setDocuments(response.data);
    } catch (err) {
      console.error('Ошибка загрузки очереди:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueRef.current = fetchQueue;
  }, [fetchQueue]);

  useEffect(() => {
    fetchQueueRef.current();
    const interval = setInterval(() => fetchQueueRef.current(), 3000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = documents.filter(d => d.status === 'processing').length;
  const waitingCount = documents.filter(d => d.status === 'waiting').length;

  const getStatusInfo = (status: QueueDocument['status']) => {
    switch (status) {
      case 'processing': return { className: 'processing', text: 'Обработка' };
      case 'completed': return { className: 'completed', text: 'Готово' };
      case 'error': return { className: 'error', text: 'Ошибка' };
      default: return { className: 'waiting', text: 'Ожидание' };
    }
  };

  return (
    <div className="queue-page">
      <div className="queue-panel">
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

        <div className="queue-list">
          {isLoading ? (
            <div className="empty-queue">Загрузка очереди...</div>
          ) : documents.length === 0 ? (
            <div className="empty-queue">Очередь пуста. Загрузите файлы.</div>
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QueuePage;