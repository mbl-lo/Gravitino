import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()

  // Если уже авторизован - перенаправляем
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard'
    }
  }, [isAuthenticated])

  // Валидация email
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Очищаем предыдущие ошибки
    setError('')

    // Валидация полей
    if (!email.trim()) {
      setError('Введите адрес электронной почты')
      return
    }

    if (!validateEmail(email)) {
      setError('Введите корректный адрес электронной почты (например, user@company.ru)')
      return
    }

    if (!password) {
      setError('Введите пароль')
      return
    }

    if (password.length < 4) {
      setError('Пароль должен содержать не менее 4 символов')
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      // После успешного входа useEffect сработает и перенаправит
    } catch (err: any) {
      // Обработка разных типов ошибок
      const errorMessage = err.message || 'Ошибка при входе в систему'

      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setError('Неверный адрес электронной почты')
      } else if (errorMessage.includes('пароль') || errorMessage.includes('Password')) {
        setError('Неверный пароль')
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setError('Ошибка сети. Проверьте подключение к интернету')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Левая колонка - синий фон */}
      <div style={{
        width: '50%',
        backgroundColor: '#1d4ed8',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            width: '96px',
            height: '96px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto'
          }}>
            <svg style={{ width: '48px', height: '48px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
          Автоматизация обработки <br /> путевых листов
        </h2>
        <p style={{ color: '#bfdbfe', fontSize: '1rem' }}>
          ИИ-распознавание, валидация данных и контроль аномалий <br /> для транспортных компаний
        </p>
      </div>

      {/* Правая колонка - серый фон с карточкой */}
      <div style={{
        width: '50%',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          padding: '2rem',
          width: '100%',
          maxWidth: '28rem'
        }}>
          <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Цифровой архив
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              ИИ-распознавание и контроль путевых листов
            </p>
          </div>

          {/* Блок с ошибкой - визуальное отображение */}
          {error && (
            <div className="animate-shake" style={{
              marginBottom: '1.5rem',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <p style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500', margin: 0 }}>
                  Ошибка авторизации
                </p>
                <p style={{ color: '#991b1b', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem', textAlign: 'left' }}>
                Электронная почта
              </label>
              <input
                id="email"
                type="email"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: error && !email ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                placeholder="demo@company.ru"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('') // Очищаем ошибку при вводе
                }}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem', textAlign: 'left' }}>
                Пароль
              </label>
              <input
                id="password"
                type="password"
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: error && !password ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                placeholder="********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                disabled={loading}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '1rem', height: '1rem' }}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                />
                <span style={{ color: '#374151' }}>Запомнить меня</span>
              </label>
              <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Забыли пароль?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '600',
                padding: '0.625rem',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }}></div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Доступ только для сотрудников организации
            </p>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: '#166534',
            textAlign: 'center',
            border: '1px solid #bbf7d0'
          }}>
            🧪 <strong>Тестовые данные:</strong> demo@company.ru / 123456
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

// Добавьте стиль для анимации в index.css или в head
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
`
document.head.appendChild(styleSheet)