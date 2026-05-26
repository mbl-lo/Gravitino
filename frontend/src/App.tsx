import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout/Layout'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      
      {/* Все защищённые страницы обёрнуты в Layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/upload" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>📤 Загрузка документов (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/queue" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>⏳ Очередь обработки (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/archive" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>📁 Архив путевых листов (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/anomalies" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>⚠️ Аномалии (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/export" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>📎 Экспорт и интеграции (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/training" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>🎓 Обучающие данные (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>⚙️ Настройки (в разработке)</div>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <div style={{ padding: '24px' }}>👥 Пользователи (в разработке)</div>
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App