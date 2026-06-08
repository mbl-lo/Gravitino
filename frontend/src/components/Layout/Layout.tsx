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
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  main: {
    flex: 1,
    marginLeft: '280px',
    marginTop: '70px',
    padding: '24px',
  },
  content: {
    width: '100%',
  },
}

export default Layout