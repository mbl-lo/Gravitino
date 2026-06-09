import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Дашборд' },
    { path: '/upload', icon: '📤', label: 'Загрузка документов' },
    { path: '/queue', icon: '⏳', label: 'Очередь обработки' },
    { path: '/archive', icon: '📁', label: 'Архив путевых листов' },
    { path: '/anomalies', icon: '⚠️', label: 'Аномалии' },
    { path: '/export', icon: '📎', label: 'Экспорт и интеграции' },
    { path: '/training', icon: '🎓', label: 'Обучающие данные' },
    { path: '/settings', icon: '⚙️', label: 'Настройки' },
    { path: '/users', icon: '👥', label: 'Пользователи' },
  ]

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>
        <h2 style={styles.logoText}>Цифровой архив</h2>
        <p style={styles.logoSub}>ИИ-распознавание путевых листов</p>
      </div>
      
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#1f2937',
    color: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    position: 'fixed' as const,
    left: 0,
    top: 0,
    bottom: 0,
    overflowY: 'auto' as const,
    zIndex: 100,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid #374151',
    marginBottom: '20px',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    margin: 0,
    marginBottom: '8px',
  },
  logoSub: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    margin: 0,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    color: '#d1d5db',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
    fontSize: '0.875rem',
  },
  navLinkActive: {
    backgroundColor: '#374151',
    color: 'white',
  },
  navIcon: {
    fontSize: '1.25rem',
  },
}

export default Sidebar