import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueue } from '../services/api';
import type { QueueDocument } from '../services/api';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchQueueRef = useRef<() => Promise<void>>(() => Promise.resolve());

const fetchQueue = useCallback(async () => {
  // ВРЕМЕННЫЕ ТЕСТОВЫЕ ДАННЫЕ (для проверки статусов)
  const testDocuments = [
    {
      id: '1',
      originalFileName: 'Документ ЗАГРУЖЕН.pdf',
      fileSize: 1024,
      status: 'uploaded',
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      originalFileName: 'Документ ОБРАБАТЫВАЕТСЯ.pdf',
      fileSize: 2048,
      status: 'processing',
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      originalFileName: 'Документ ТРЕБУЕТ ПРОВЕРКИ.pdf',
      fileSize: 1536,
      status: 'needs_review',
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      originalFileName: 'Документ ПОДТВЕРЖДЁН.pdf',
      fileSize: 5120,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      originalFileName: 'Документ ОШИБКА.pdf',
      fileSize: 768,
      status: 'error',
      createdAt: new Date().toISOString()
    }
  ];

  // Преобразуем тестовые данные в нужный формат
  const mappedData: QueueDocument[] = testDocuments.map((doc) => ({
    id: doc.id,
    name: doc.originalFileName,
    size: doc.fileSize,  // ← число, а не строка
    status: doc.status as 'uploaded' | 'processing' | 'needs_review' | 'confirmed' | 'error',
    progress: doc.status === 'processing' ? 45 : doc.status === 'confirmed' ? 100 : 0,
    added: new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  setDocuments(mappedData);
  setIsLoading(false);
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
  const uploadedCount = documents.filter(d => d.status === 'uploaded').length;

  const getStatusInfo = (status: QueueDocument['status']) => {
    switch (status) {
      case 'uploaded':
        return { className: 'uploaded', text: 'Загружен' }
      case 'processing':
        return { className: 'processing', text: 'Обрабатывается' }
      case 'needs_review':
        return { className: 'needs_review', text: 'Требует проверки' }
      case 'confirmed':
        return { className: 'confirmed', text: 'Подтверждён' }
      case 'error':
        return { className: 'error', text: 'Ошибка' }
      default:
        return { className: 'uploaded', text: 'Загружен' }
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
              <span className="progress-dot waiting"></span> Загружены: <strong>{uploadedCount}</strong>
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
                  <div className="doc-info"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    style={{ cursor: 'pointer' }}>
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