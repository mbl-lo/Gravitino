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
              padding: '8px 12px',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              fontSize: '14px',
              width: '250px',
              outline: 'none',
              backgroundColor: '#fff',
            }}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '6px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {isLoading ? '...' : '✅ Сохранить'}
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 14px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
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
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        transition: 'all 0.2s',
        display: 'inline-block',
        minWidth: '180px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#3b82f6'
        e.currentTarget.style.backgroundColor = '#eff6ff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e5e7eb'
        e.currentTarget.style.backgroundColor = '#f9fafb'
      }}
    >
      {value || '—'}
    </div>
  )
}

export default EditableField