import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Поиск:', searchQuery)
  }

  const handleNotifications = () => {
    console.log('Уведомления')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header style={styles.header}>
      <div style={styles.searchSection}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Поиск по документу, водителю, автомобилю"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div style={styles.rightSection}>
        <button onClick={handleNotifications} style={styles.notificationButton}>
          <span style={styles.notificationIcon}>🔔</span>
          <span style={styles.notificationBadge}>3</span>
        </button>

        <div style={styles.avatar}>
          <span style={styles.avatarText}>ОИ</span>
        </div>

        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.fullName || 'Оператор'}</span>
          <span style={styles.userStatus}>Активен</span>
        </div>

        <button onClick={handleLogout} style={styles.logoutButton}>
          Выйти
        </button>
      </div>
    </header>
  )
}

const styles = {
  header: {
    height: '70px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'fixed' as const,
    top: 0,
    right: 0,
    left: '280px',
    zIndex: 10,
  },
  searchSection: {
    flex: 1,
    maxWidth: '500px',
  },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  searchIcon: {
    color: '#9ca3af',
    marginRight: '8px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '0.875rem',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  notificationButton: {
    position: 'relative' as const,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: '1.25rem',
    color: '#6b7280',
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: '0px',
    right: '0px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  avatarText: {
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  userName: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
  },
  userStatus: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#10b981',
  },
  logoutButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
  },
}

export default Header