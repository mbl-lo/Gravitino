import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div style={styles.container}>
      <Sidebar />
      <Header />
      <main style={styles.main}>
        <div style={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f9fafb',
  },
  main: {
    flex: 1,
    marginLeft: '280px',
    marginTop: '70px',
    padding: '24px',
    height: 'calc(100vh - 70px)',
    overflow: 'auto',
    boxSizing: 'border-box' as const,
  },
  content: {
    width: '100%',
    height: '100%',
  },
}

export default Layout