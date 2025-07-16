import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  Button,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Stack,
  Badge,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Assessment as ReportsIcon,
  ShoppingCart as PaccIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Timeline as TimelineIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Edit as EditIcon,
  NotificationsActive as NotificationIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale
} from 'chart.js'
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { useAuth } from '../../contexts/AuthContext'
import { httpClient } from '../../utils/api'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend
)

const Dashboard = () => {
  const { user, hasRole, hasPermission } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  
  // Estados para datos del dashboard
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activities: { total: 0, completed: 0, inProgress: 0, pending: 0 },
      indicators: { total: 0, onTrack: 0, delayed: 0, critical: 0 },
      progressReports: { total: 0, pending: 0, approved: 0, rejected: 0 },
      budget: { total: 0, executed: 0, percentage: 0, committed: 0 },
      users: { total: 0, active: 0, inactive: 0 },
      pacc: { schedules: 0, compliant: 0, alerts: 0, processes: 0 }
    },
    strategicAxes: [],
    recentActivities: [],
    notifications: [],
    chartData: {
      performance: null,
      budget: null,
      indicators: null
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Datos simulados para desarrollo inicial
  const sampleData = {
    activities: { total: 45, completed: 28, inProgress: 12, pending: 5 },
    indicators: { total: 32, onTrack: 24, delayed: 6, critical: 2 },
    progressReports: { total: 67, pending: 8, approved: 55, rejected: 4 },
    budget: { total: 850000, executed: 520000, percentage: 61, committed: 680000 },
    users: { total: 25, active: 22, inactive: 3 },
    pacc: { schedules: 12, compliant: 9, alerts: 2, processes: 8 }
  }

  // Cargar datos reales del backend
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Intentar cargar datos reales, fallback a datos simulados
      const responses = await Promise.allSettled([
        httpClient.get('/dashboard/stats'),
        httpClient.get('/strategic-axes'),
        httpClient.get('/activities/recent'),
        httpClient.get('/pacc/dashboard-stats')
      ])

      const [statsRes, axesRes, activitiesRes, paccRes] = responses

      const stats = statsRes.status === 'fulfilled' ? statsRes.value.data : sampleData
      const axes = axesRes.status === 'fulfilled' ? axesRes.value.data : []
      const activities = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : []
      const pacc = paccRes.status === 'fulfilled' ? paccRes.value.data : sampleData.pacc

      setDashboardData({
        stats: { ...sampleData, ...stats },
        strategicAxes: axes,
        recentActivities: activities.slice(0, 6),
        notifications: generateNotifications(stats || sampleData),
        chartData: generateChartData(stats || sampleData)
      })

    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Usar datos simulados en caso de error
      setDashboardData({
        stats: sampleData,
        strategicAxes: [],
        recentActivities: [],
        notifications: generateNotifications(sampleData),
        chartData: generateChartData(sampleData)
      })
    } finally {
      setLoading(false)
    }
  }

  // Generar notificaciones basadas en datos
  const generateNotifications = (stats) => {
    const notifications = []
    
    if (stats.progressReports?.pending > 5) {
      notifications.push({
        id: 'reports-pending',
        type: 'warning',
        title: 'Reportes Pendientes',
        message: `Tienes ${stats.progressReports.pending} reportes pendientes de revisión`
      })
    }
    
    if (stats.indicators?.critical > 0) {
      notifications.push({
        id: 'indicators-critical',
        type: 'error',
        title: 'Indicadores Críticos',
        message: `${stats.indicators.critical} indicadores requieren atención inmediata`
      })
    }
    
    if (stats.budget?.percentage > 80) {
      notifications.push({
        id: 'budget-alert',
        type: 'info',
        title: 'Presupuesto',
        message: `Has ejecutado el ${stats.budget.percentage}% del presupuesto anual`
      })
    }

    return notifications
  }

  // Generar datos para gráficos
  const generateChartData = (stats) => {
    return {
      performance: {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [{
          label: 'Actividades Completadas',
          data: [8, 12, 15, 18, 22, 28],
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          tension: 0.4,
          fill: true
        }]
      },
      budget: {
        labels: ['Ejecutado', 'Comprometido', 'Disponible'],
        datasets: [{
          data: [
            stats.budget?.executed || 520000,
            stats.budget?.committed || 160000,
            (stats.budget?.total || 850000) - (stats.budget?.committed || 680000)
          ],
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.grey[300]
          ]
        }]
      },
      indicators: {
        labels: ['En Meta', 'Con Retraso', 'Críticos'],
        datasets: [{
          data: [
            stats.indicators?.onTrack || 24,
            stats.indicators?.delayed || 6,
            stats.indicators?.critical || 2
          ],
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main
          ]
        }]
      }
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Configuración de tarjetas principales
  const getMainCards = () => [
    {
      title: 'Actividades',
      value: dashboardData.stats.activities?.total || 0,
      subtitle: `${dashboardData.stats.activities?.completed || 0} completadas`,
      icon: <AssignmentIcon />,
      color: 'primary',
      progress: dashboardData.stats.activities?.total > 0 
        ? ((dashboardData.stats.activities?.completed || 0) / dashboardData.stats.activities.total) * 100 
        : 0,
      action: () => navigate('/planning/activities')
    },
    {
      title: 'Indicadores',
      value: dashboardData.stats.indicators?.total || 0,
      subtitle: `${dashboardData.stats.indicators?.onTrack || 0} en meta`,
      icon: <TrendingUpIcon />,
      color: 'success',
      progress: dashboardData.stats.indicators?.total > 0 
        ? ((dashboardData.stats.indicators?.onTrack || 0) / dashboardData.stats.indicators.total) * 100 
        : 0,
      action: () => navigate('/tracking/indicators')
    },
    {
      title: 'Presupuesto',
      value: `${dashboardData.stats.budget?.percentage || 0}%`,
      subtitle: `$${(dashboardData.stats.budget?.executed || 0).toLocaleString()} ejecutado`,
      icon: <MoneyIcon />,
      color: 'info',
      progress: dashboardData.stats.budget?.percentage || 0,
      action: () => navigate('/budget')
    },
    {
      title: 'Reportes',
      value: dashboardData.stats.progressReports?.total || 0,
      subtitle: `${dashboardData.stats.progressReports?.pending || 0} pendientes`,
      icon: <ReportsIcon />,
      color: dashboardData.stats.progressReports?.pending > 5 ? 'warning' : 'secondary',
      progress: dashboardData.stats.progressReports?.total > 0 
        ? ((dashboardData.stats.progressReports?.approved || 0) / dashboardData.stats.progressReports.total) * 100 
        : 0,
      action: () => navigate('/tracking/progress')
    }
  ]

  // Configuración de módulos de acceso rápido
  const getQuickAccessModules = () => {
    const modules = []

    if (hasPermission('read', 'strategic_axis')) {
      modules.push({
        title: 'Planificación Estratégica',
        description: 'Gestionar ejes, objetivos y productos estratégicos',
        icon: <AccountTreeIcon sx={{ fontSize: 40 }} />,
        color: 'primary',
        path: '/planning/strategic-axes',
        stats: `${dashboardData.strategicAxes?.length || 0} ejes configurados`
      })
    }

    if (hasPermission('read', 'progress_report')) {
      modules.push({
        title: 'Seguimiento y Control',
        description: 'Reportes de avance e indicadores de gestión',
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
        color: 'success',
        path: '/tracking/progress',
        stats: `${dashboardData.stats.progressReports?.pending || 0} reportes pendientes`
      })
    }

    if (hasPermission('read', 'procurement')) {
      modules.push({
        title: 'Sistema PACC',
        description: 'Plan Anual de Compras y Contrataciones',
        icon: <PaccIcon sx={{ fontSize: 40 }} />,
        color: 'secondary',
        path: '/pacc/dashboard',
        stats: `${dashboardData.stats.pacc?.schedules || 0} cronogramas activos`
      })
    }

    if (hasPermission('read', 'user')) {
      modules.push({
        title: 'Administración',
        description: 'Usuarios, roles y configuración del sistema',
        icon: <PeopleIcon sx={{ fontSize: 40 }} />,
        color: 'info',
        path: '/admin/users',
        stats: `${dashboardData.stats.users?.active || 0} usuarios activos`
      })
    }

    modules.push({
      title: 'Reportes y Análisis',
      description: 'Informes ejecutivos y análisis de datos',
      icon: <ReportsIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
      path: '/reports',
      stats: 'Reportes disponibles'
    })

    return modules
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const mainCards = getMainCards()
  const quickAccessModules = getQuickAccessModules()

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header Principal */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          fontWeight="700" 
          gutterBottom
          sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Dashboard Ejecutivo
        </Typography>
        
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Bienvenido, {user?.firstName} {user?.lastName}
        </Typography>
        
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip 
            label={user?.role?.name || 'Sin rol'} 
            color="primary" 
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
          {user?.department && (
            <Chip 
              label={user.department.name} 
              color="secondary" 
              variant="outlined"
            />
          )}
          <Chip 
            label={format(new Date(), 'PPPP', { locale: es })} 
            variant="outlined"
            size="small"
          />
        </Stack>
      </Box>

      {/* Notificaciones */}
      {dashboardData.notifications?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {dashboardData.notifications.map((notification) => (
            <Alert 
              key={notification.id}
              severity={notification.type}
              sx={{ mb: 1 }}
              action={
                <IconButton size="small" color="inherit">
                  <NotificationIcon />
                </IconButton>
              }
            >
              <strong>{notification.title}:</strong> {notification.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Tarjetas Principales de Métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: `linear-gradient(135deg, ${
                  card.color === 'primary' ? '#1976d2, #1565c0' : 
                  card.color === 'success' ? '#2e7d32, #1b5e20' :
                  card.color === 'warning' ? '#ed6c02, #e65100' : 
                  card.color === 'info' ? '#0288d1, #01579b' :
                  card.color === 'secondary' ? '#7b1fa2, #4a148c' : '#757575, #424242'
                })`,
                color: 'white',
                transform: 'translateY(0)',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[12]
                }
              }}
              onClick={card.action}
            >
              <CardContent sx={{ position: 'relative', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      mr: 2,
                      width: 56,
                      height: 56
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                  {card.subtitle}
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={card.progress} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: 'rgba(255,255,255,0.8)'
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {Math.round(card.progress)}% completado
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos y Análisis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Gráfico de Rendimiento */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Tendencia de Actividades Completadas
              </Typography>
              <Box sx={{ height: 300, mt: 2 }}>
                {dashboardData.chartData.performance && (
                  <Line 
                    data={dashboardData.chartData.performance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución de Indicadores */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Estado de Indicadores
              </Typography>
              <Box sx={{ height: 300, mt: 2, display: 'flex', justifyContent: 'center' }}>
                {dashboardData.chartData.indicators && (
                  <Doughnut 
                    data={dashboardData.chartData.indicators}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'bottom',
                          labels: { usePointStyle: true }
                        }
                      }
                    }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Módulos de Acceso Rápido */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Acceso Rápido a Módulos
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Selecciona un módulo para acceder a sus funcionalidades
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {quickAccessModules.map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
              onClick={() => navigate(module.path)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    mx: 'auto', 
                    mb: 2,
                    backgroundColor: `${module.color}.main`,
                    '&:hover': {
                      backgroundColor: `${module.color}.dark`
                    }
                  }}
                >
                  {module.icon}
                </Avatar>
                
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {module.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {module.description}
                </Typography>
                
                <Chip 
                  label={module.stats}
                  size="small"
                  color={module.color}
                  variant="outlined"
                />
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button 
                  size="small" 
                  color={module.color}
                  endIcon={<ArrowForwardIcon />}
                >
                  Acceder
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Footer con información adicional */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {dashboardData.stats.activities?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Actividades Planificadas
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {Math.round(((dashboardData.stats.activities?.completed || 0) / (dashboardData.stats.activities?.total || 1)) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Progreso General del POA
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {dashboardData.stats.users?.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuarios Participando Activamente
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default Dashboard
