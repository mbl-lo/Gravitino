import { useState } from 'react'
import { BellOutlined, SearchOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const nameParts = user?.fullName?.trim().split(' ').filter(Boolean) ?? []
  const displayName = nameParts.length >= 2 ? `${nameParts[1]} ${nameParts[0]}` : user?.fullName || 'Оператор Иванов'
  const initials = nameParts.length >= 2 ? (nameParts[1][0] + nameParts[0][0]).toUpperCase() : nameParts[0]?.[0]?.toUpperCase() || 'ОИ'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Поиск:', searchQuery)
  }

  const handleNotifications = () => {
    console.log('Уведомления')
  }

  return (
    <header style={styles.header}>
      <div style={styles.searchSection}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <SearchOutlined style={styles.searchIcon} />
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
          <BellOutlined style={styles.notificationIcon} />
          <span style={styles.notificationBadge} />
        </button>

        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            <span style={styles.avatarText}>{initials}</span>
          </div>

          <div style={styles.userInfo}>
            <span style={styles.userName}>{displayName}</span>
            <span style={styles.userStatus}>Активен</span>
          </div>
        </div>
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
    maxWidth: '576px',
  },
  searchForm: {
    position: 'relative' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    fontSize: '20px',
    color: '#9ca3af',
  },
  searchInput: {
    width: '100%',
    padding: '8px 16px 8px 40px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    outline: 'none',
    backgroundColor: 'white',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#101828',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
    transition: 'background-color 0.15s ease',
  },
  notificationIcon: {
    width: '20px',
    height: '20px',
    fontSize: '20px',
    color: '#4b5563',
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    width: '8px',
    height: '8px',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingLeft: '16px',
    borderLeft: '1px solid #E5E7EB',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#2563EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
  },
  userName: {
    display: 'block',
    fontSize: '14px',
    lineHeight: '20px',
    fontWeight: '600',
    color: '#101828',
  },
  userStatus: {
    display: 'block',
    fontSize: '12px',
    lineHeight: '16px',
    color: '#6b7280',
  },
}

export default Header
