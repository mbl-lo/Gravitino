import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function AppPage() {
  const { user, logout, isAuthenticated } = useAuth()

  // Проверка авторизации
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/'
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            📄 Цифровой архив
          </h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Выйти
          </button>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Добро пожаловать, {user?.fullName}!
          </h2>
          
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <h3 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Информация о пользователе:</h3>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Роль:</strong> {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
            <p><strong>Компания:</strong> {user?.organizationId}</p>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#e0f2fe',
            borderRadius: '8px',
            color: '#0369a1'
          }}>
            📋 Здесь будет список путевых листов и основная функциональность
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppPage