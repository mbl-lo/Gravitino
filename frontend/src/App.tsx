import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DocumentDetail from './pages/DocumentDetail'  
import Layout from './components/Layout/Layout'
import UploadPage from './pages/UploadPage'
import QueuePage from './pages/QueuePage'
import './App.css'
import AnomaliesPage from './pages/AnomaliesPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import ArchivePage from './pages/ArchivePage'
import ExportPage from './pages/ExportPage'
import TrainingPage from './pages/TrainingPage'

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
          <UploadPage />
        </ProtectedRoute>
      } />
      
      <Route path="/queue" element={
        <ProtectedRoute>
          <QueuePage />
        </ProtectedRoute>
      } />
      
      <Route path="/archive" element={
        <ProtectedRoute>
          <ArchivePage />
        </ProtectedRoute>
      } />
      
      <Route path="/documents/:id" element={
        <ProtectedRoute>
          <DocumentDetail />
        </ProtectedRoute>
      } />
      
      <Route path="/anomalies" element={
        <ProtectedRoute>
          <AnomaliesPage/>
        </ProtectedRoute>
      } />
      
      <Route path="/export" element={
        <ProtectedRoute>
          <ExportPage />
        </ProtectedRoute>
      } />
      
      <Route path="/training" element={
        <ProtectedRoute>
          <TrainingPage />
        </ProtectedRoute>
      } />
    
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <UsersPage />
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
