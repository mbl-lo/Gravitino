import { NavLink } from 'react-router-dom'
import { WarningOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';

const Sidebar = () => {
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard w-5 h-5"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg>, 
      label: 'Дашборд' 
    },
    { 
      path: '/upload', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload w-5 h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line></svg>, 
      label: 'Загрузка документов' 
    },
    { 
      path: '/queue', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-checks w-5 h-5"><path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path></svg>, 
      label: 'Очередь обработки' 
    },
    { 
      path: '/archive', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-archive w-5 h-5"><rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path></svg>, 
      label: 'Архив путевых листов' 
    },
    { 
      path: '/anomalies', 
      icon: <WarningOutlined />, 
      label: 'Аномалии' 
    },
    { 
      path: '/export', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-json w-5 h-5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"></path><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"></path></svg>, 
      label: 'Экспорт и интеграции' 
    },
    { 
      path: '/training', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database w-5 h-5"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>, 
      label: 'Обучающие данные' 
    },
    { 
      path: '/settings', 
      icon: <SettingOutlined />, 
      label: 'Настройки' 
    },
    { 
      path: '/users', 
      icon: <UserOutlined />, 
      label: 'Пользователи' 
    },
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