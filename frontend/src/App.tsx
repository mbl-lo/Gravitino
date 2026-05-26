import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Layout from './components/Layout/Layout'
import PlaceholderPage from './components/PlaceholderPage'

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
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/upload" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Загрузка документов" 
            icon="📤"
            description="Загрузка и распознавание путевых листов"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/queue" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Очередь обработки" 
            icon="⏳"
            description="Документы, ожидающие обработки"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/archive" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Архив путевых листов" 
            icon="📁"
            description="Все обработанные документы"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/anomalies" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Аномалии" 
            icon="⚠️"
            description="Документы, требующие проверки"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/export" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Экспорт и интеграции" 
            icon="📎"
            description="Выгрузка данных и интеграция с системами"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/training" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Обучающие данные" 
            icon="🎓"
            description="Наборы данных для обучения ИИ"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Настройки" 
            icon="⚙️"
            description="Настройки системы и параметры работы"
          />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <PlaceholderPage 
            title="Пользователи" 
            icon="👥"
            description="Управление пользователями системы"
          />
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