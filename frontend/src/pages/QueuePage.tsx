import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueue, removeFromQueue, clearCompleted } from '../services/api';
import type { QueueDocument } from '../services/api';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  // Список документов в очереди
  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  // Состояние загрузки
  const [isLoading, setIsLoading] = useState(true);
  // Ref для хранения функции fetchQueue без пересоздания
  const fetchQueueRef = useRef<() => Promise<void>>(null!);

  // === Загрузка очереди с сервера ===
  const fetchQueue = useCallback(async () => {
    try {
      const response = await getQueue();

      const mappedData: QueueDocument[] = response.data.map((doc: any) => ({
        id: doc.id,
        name: doc.originalFileName,
        size: doc.fileSize,
        status: doc.ocrStatus === 'completed' ? 'completed' 
              : doc.ocrStatus === 'error' ? 'error'
              : doc.ocrStatus === 'processing' ? 'processing'
              : 'waiting',
        progress: doc.ocrStatus === 'completed' ? 100 : 45,
        added: doc.createdAt 
            ? new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''
      }));

      setDocuments(mappedData);
    } catch (err) {
      console.error('Ошибка загрузки очереди:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сохраняем fetchQueue в ref, чтобы избежать проблем с зависимостями
  useEffect(() => {
    fetchQueueRef.current = fetchQueue;
  }, [fetchQueue]);

  // Первая загрузка + автообновление каждые 3 секунды
  useEffect(() => {
    // Первая загрузка
    fetchQueueRef.current?.();

    // Автообновление
    const interval = setInterval(() => {
      fetchQueueRef.current?.();
    }, 3000);

    return () => clearInterval(interval);
  }, []); // Пустой массив зависимостей — выполняется один раз

  // === Удаление одного документа ===
  const handleRemove = async (id: string) => {
    try {
      await removeFromQueue(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      fetchQueue();
    }
  };

  // === Очистка завершённых ===
  const handleClearCompleted = async () => {
    try {
      await clearCompleted();
      setDocuments(prev => prev.filter(doc => doc.status !== 'completed'));
    } catch (err) {
      console.error('Ошибка очистки:', err);
      fetchQueue();
    }
  };

  // === Ручное обновление ===
  const handleRefresh = () => {
    setIsLoading(true);
    fetchQueue();
  };

  // Статистика
  const activeCount = documents.filter(d => d.status === 'processing').length;
  const waitingCount = documents.filter(d => d.status === 'waiting').length;

  // Получение текста и класса статуса
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
            <div className="empty-queue">Очередь пуста. Загрузите документы.</div>
          ) : (
            documents.map(doc => {
              const statusInfo = getStatusInfo(doc.status);
              return (
                <div key={doc.id} className="queue-item">
                  <div className="doc-info"
                    onClick={() => navigate(`/documents/${doc.id}`)}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(doc.id)}}
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

        <div className="refresh-section">
          <button className="btn" onClick={handleRefresh}>Обновить очередь</button>
          <button className="btn btn-primary" onClick={handleClearCompleted}>Очистить завершённые</button>
        </div>
      </div>
    </div>
  );
};

export default QueuePage;