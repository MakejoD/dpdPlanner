import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useAuth } from './contexts/AuthContext'
import LoadingScreen from './components/common/LoadingScreen'
import LoginPage from './pages/auth/LoginPage'
import DashboardLayout from './components/layout/DashboardLayout'
import TestLogin from './TestLogin'

// Pages
import Dashboard from './pages/dashboard/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import RoleManagement from './pages/admin/RoleManagement'
import DepartmentManagement from './pages/admin/DepartmentManagement'
import StrategicPlanning from './pages/planning/StrategicPlanning'
import ProgressTracking from './pages/tracking/ProgressTracking'
import BudgetExecution from './pages/budget/BudgetExecution'
import Reports from './pages/reports/Reports'
import Profile from './pages/profile/Profile'

// Componente para rutas protegidas
const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Si se especifica un permiso requerido, verificarlo
  if (requiredPermission) {
    const [action, resource] = requiredPermission.split(':')
    if (!hasPermission(action, resource)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

// Componente para redireccionar usuarios autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Rutas públicas */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        {/* Test route */}
        <Route path="/test" element={<TestLogin />} />

        {/* Rutas protegidas */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  {/* Dashboard principal */}
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Administración del sistema */}
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute requiredPermission="read:user">
                        <UserManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/roles" 
                    element={
                      <ProtectedRoute requiredPermission="read:role">
                        <RoleManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/departments" 
                    element={
                      <ProtectedRoute requiredPermission="read:department">
                        <DepartmentManagement />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Planificación estratégica */}
                  <Route 
                    path="/planning/*" 
                    element={
                      <ProtectedRoute requiredPermission="read:strategic_axis">
                        <StrategicPlanning />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Seguimiento y avances */}
                  <Route 
                    path="/tracking/*" 
                    element={
                      <ProtectedRoute requiredPermission="read:progress_report">
                        <ProgressTracking />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Ejecución presupuestaria */}
                  <Route 
                    path="/budget/*" 
                    element={
                      <ProtectedRoute requiredPermission="read:budget">
                        <BudgetExecution />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Reportes y dashboards */}
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute requiredPermission="read:dashboard">
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Perfil de usuario */}
                  <Route path="/profile" element={<Profile />} />

                  {/* Redirección por defecto */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Página 404 */}
                  <Route 
                    path="*" 
                    element={
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <h1>404 - Página no encontrada</h1>
                        <p>La página que buscas no existe.</p>
                      </Box>
                    } 
                  />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Box>
  )
}

export default App
