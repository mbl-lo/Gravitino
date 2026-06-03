import { useState } from 'react'
import { updateDocumentField } from '../services/documents'

interface EditableFieldProps {
  documentId: string
  fieldKey: string
  fieldLabel: string
  value: string
  onUpdate: (newValue: string) => void
}

const EditableField = ({ documentId, fieldKey, fieldLabel, value, onUpdate }: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await updateDocumentField(documentId, fieldKey, editValue)
      onUpdate(editValue)
      setIsEditing(false)
    } catch (err) {
      setError('Ошибка сохранения')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError('')
  }

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{
              padding: '6px 10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              width: '200px',
            }}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '6px 12px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {isLoading ? '...' : '✅ Сохранить'}
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            ✖ Отмена
          </button>
        </div>
        {error && <span style={{ color: '#ef4444', fontSize: '12px' }}>{error}</span>}
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '6px',
        transition: 'background 0.2s',
        display: 'inline-block',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {value || '—'}
      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>✏️</span>
    </div>
  )
}

export default EditableField