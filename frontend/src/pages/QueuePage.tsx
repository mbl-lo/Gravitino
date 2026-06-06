import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQueue, runOcr } from '../services/api';
import type { QueueDocument } from '../services/api';
import './QueuePage.css';

const QueuePage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<QueueDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const fetchQueueRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fetchQueue = useCallback(async () => {
    try {
      const response = await getQueue();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedData: QueueDocument[] = response.data.map((doc: any) => {
        let displayStatus: QueueDocument['status'] = 'uploaded';

        if (doc.status === 'processing') displayStatus = 'processing';
        else if (doc.status === 'needs_review') displayStatus = 'needs_review';
        else if (doc.status === 'confirmed') displayStatus = 'confirmed';
        else if (doc.status === 'error') displayStatus = 'error';
        else if (doc.status === 'processed') displayStatus = 'needs_review';
        else if (doc.status === 'uploaded') displayStatus = 'uploaded';

        if (doc.ocrStatus === 'processing') displayStatus = 'processing';
        else if (doc.ocrStatus === 'error') displayStatus = 'error';

        return {
          id: doc.id,
          name: doc.originalFileName || 'Неизвестный файл',
          size: doc.fileSize,
          status: displayStatus,
          progress: displayStatus === 'processing' ? 45 : displayStatus === 'confirmed' ? 100 : 0,
          added: doc.createdAt
            ? new Date(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''
        };
      });

      setDocuments(mappedData);
    } catch (err) {
      console.error('Ошибка загрузки очереди:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueueRef.current = fetchQueue; }, [fetchQueue]);

  useEffect(() => {
    fetchQueueRef.current();
    const interval = setInterval(() => fetchQueueRef.current(), 3000);
    return () => clearInterval(interval);
  }, []);

  // === Запуск распознавания ===
  const handleRunOcr = async (documentId: string) => {
    setProcessingIds(prev => new Set(prev).add(documentId));
    try {
      await runOcr(documentId);
    } catch (err) {
      console.error('Ошибка запуска OCR:', err);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
      fetchQueue();
    }
  };

  const activeCount = documents.filter(d => d.status === 'processing').length;
  const uploadedCount = documents.filter(d => d.status === 'uploaded').length;

  const getStatusInfo = (status: QueueDocument['status']) => {
    switch (status) {
      case 'uploaded': return { className: 'uploaded', text: 'Загружен' };
      case 'processing': return { className: 'processing', text: 'Распознаётся' };
      case 'needs_review': return { className: 'needs_review', text: 'Требует проверки' };
      case 'confirmed': return { className: 'confirmed', text: 'Готово' };
      case 'error': return { className: 'error', text: 'Ошибка OCR' };
      default: return { className: 'uploaded', text: 'Загружен' };
    }
  };

  return (
    <div className="queue-page">
      <div className="queue-panel">
        <div className="header">
          <div className="title-section">
            <h2>Очередь обработки<span className="badge">{documents.length}</span></h2>
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
              const busy = processingIds.has(doc.id);
              return (
                <div key={doc.id} className="queue-item">
                  <div className="doc-info" onClick={() => navigate(`/documents/${doc.id}`)} style={{ cursor: 'pointer', flex: 1 }}>
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

                    {/* Кнопка распознавания — только для загруженных */}
                    {doc.status === 'uploaded' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleRunOcr(doc.id)}
                        disabled={busy}
                      >
                        {busy ? 'Запуск...' : 'Распознать'}
                      </button>
                    )}

                    <div className="open-icon-wrapper">
                      <button
                        className="open-icon-btn"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        title="Открыть документ"
                      >
                        <span className="open-icon">🔍</span>
                        <span className="open-text">Открыть</span>
                      </button>
                    </div>
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