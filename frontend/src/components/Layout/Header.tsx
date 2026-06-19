import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BellOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const nameParts = user?.fullName?.trim().split(' ').filter(Boolean) ?? []
  const displayName = nameParts.length >= 2 ? `${nameParts[1]} ${nameParts[0]}` : user?.fullName || 'Оператор Иванов'
  const initials = nameParts.length >= 2 ? (nameParts[1][0] + nameParts[0][0]).toUpperCase() : nameParts[0]?.[0]?.toUpperCase() || 'ОИ'
  const [previousPage, setPreviousPage] = useState('/dashboard')

  useEffect(() => {
    if (location.pathname !== '/archive') {
      setPreviousPage(location.pathname)
    }
  }, [location.pathname])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.get('search')) {
      setSearchQuery('')
    }
  }, [location.search])

  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/archive?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(previousPage);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    executeSearch(searchQuery);
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(searchQuery);
    }
  };
  const handleClearSearch = () => {
    setSearchQuery('')
    navigate(previousPage)
  };

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
          <SearchOutlined style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по документу, водителю, автомобилю"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {searchQuery && (
            <CloseOutlined 
              onClick={handleClearSearch} 
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', cursor: 'pointer' }} 
            />
          )}
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
