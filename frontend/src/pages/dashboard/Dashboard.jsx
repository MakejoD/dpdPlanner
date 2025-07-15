import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  CardActions,
  IconButton,
  Tooltip,
  Badge,
  Stack
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  PendingActions as PendingActionsIcon,
  Schedule as ScheduleIcon,
  AccountTree as AccountTreeIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
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
  Title,
  ChartTooltip,
  Legend
)

const Dashboard = () => {
  const { user, hasRole, hasPermission } = useAuth()
  
  // Estados para datos reales
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activities: { total: 0, completed: 0, inProgress: 0 },
      indicators: { total: 0, onTrack: 0, delayed: 0 },
      progressReports: { total: 0, pending: 0, approved: 0, rejected: 0 },
      budget: { total: 0, executed: 0, percentage: 0 },
      users: { total: 0, active: 0 },
      pacc: { schedules: 0, compliant: 0, alerts: 0 }
    },
    strategicAxes: [],
    recentActivities: [],
    pendingApprovals: [],
    executionByDepartment: [],
    monthlyProgress: []
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo
      const promises = []

      // 1. Estadísticas generales
      promises.push(
        httpClient.get('/dashboard/stats')
          .then(response => {
            console.log('Dashboard stats response:', response);
            return response;
          })
          .catch(err => {
            console.error('Error loading dashboard stats:', err);
            return { data: { stats: {} } };
          })
      )

      // 2. Ejes estratégicos con progreso
      promises.push(
        httpClient.get('/strategic-axes')
          .then(response => {
            console.log('Strategic axes response:', response);
            return response;
          })
          .catch(err => {
            console.error('Error loading strategic axes:', err);
            return { data: [] };
          })
      )

      // 3. Actividades recientes
      promises.push(
        httpClient.get('/activities/recent').catch(err => ({ data: [] }))
      )

      // 4. Reportes de progreso pendientes (si tiene permisos)
      if (hasPermission('read', 'progress_report')) {
        promises.push(
          httpClient.get('/progress-reports/recent').catch(err => ({ data: [] }))
        )
      } else {
        promises.push(Promise.resolve({ data: [] }))
      }

      // 5. Aprobaciones pendientes (si tiene permisos)
      if (hasPermission('approve', 'progress-report') || hasPermission('approve', 'progress_report')) {
        promises.push(
          httpClient.get('/approvals/pending').catch(err => ({ data: { reports: [] } }))
        )
      } else {
        promises.push(Promise.resolve({ data: { reports: [] } }))
      }

      // 6. Datos PACC (si tiene permisos)
      if (hasPermission('read', 'procurement')) {
        promises.push(
          httpClient.get('/pacc/dashboard-stats').catch(err => ({ data: {} }))
        )
      } else {
        promises.push(Promise.resolve({ data: {} }))
      }

      const [
        statsResponse,
        axesResponse,
        activitiesResponse,
        reportsResponse,
        approvalsResponse,
        paccResponse
      ] = await Promise.all(promises)

      // Procesar datos
      const stats = statsResponse.data?.data || statsResponse.data || {}
      const axes = axesResponse.data?.data || axesResponse.data || []
      const activities = activitiesResponse.data?.data || activitiesResponse.data || []
      const reports = reportsResponse.data?.data || reportsResponse.data || []
      const approvals = approvalsResponse.data?.data?.reports || approvalsResponse.data?.reports || approvalsResponse.data || []
      const paccData = paccResponse.data?.data || paccResponse.data || {}

      console.log('Processed data:', {
        stats,
        axesCount: axes.length,
        activitiesCount: activities.length,
        reportsCount: reports.length,
        approvalsCount: approvals.length
      })

      // Construir actividades recientes combinadas
      const recentActivities = [
        ...activities.map(activity => ({
          id: `activity-${activity.id}`,
          title: `Actividad: ${activity.name}`,
          subtitle: activity.product?.name || 'Sin producto asignado',
          time: activity.updatedAt ? format(parseISO(activity.updatedAt), 'PPp', { locale: es }) : 'Fecha no disponible',
          status: activity.status === 'COMPLETED' ? 'success' : activity.status === 'IN_PROGRESS' ? 'info' : 'warning',
          type: 'activity'
        })),
        ...reports.slice(0, 3).map(report => ({
          id: `report-${report.id}`,
          title: `Reporte de avance ${report.status === 'APPROVED' ? 'aprobado' : report.status === 'REJECTED' ? 'rechazado' : 'enviado'}`,
          subtitle: report.activity?.name || report.indicator?.name || 'Sin título',
          time: report.updatedAt ? format(parseISO(report.updatedAt), 'PPp', { locale: es }) : 'Fecha no disponible',
          status: report.status === 'APPROVED' ? 'success' : report.status === 'REJECTED' ? 'error' : 'warning',
          type: 'report'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)

      setDashboardData({
        stats: {
          activities: stats.activities || { total: 0, completed: 0, inProgress: 0 },
          indicators: stats.indicators || { total: 0, onTrack: 0, delayed: 0 },
          progressReports: stats.progressReports || { total: 0, pending: 0, approved: 0, rejected: 0 },
          budget: stats.budget || { total: 0, executed: 0, percentage: 0 },
          users: stats.users || { total: 0, active: 0 },
          pacc: paccData || { schedules: 0, compliant: 0, alerts: 0 }
        },
        strategicAxes: axes,
        recentActivities,
        pendingApprovals: approvals,
        executionByDepartment: stats.executionByDepartment || [],
        monthlyProgress: stats.monthlyProgress || []
      })

    } catch (error) {
      console.error('Error cargando dashboard:', error)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
  }

  useEffect(() => {
    loadDashboardData()
  }, [user])

  // Calcular estadísticas dinámicas
  const getStatsCards = () => {
    const { stats } = dashboardData
    
    return [
      {
        title: 'Actividades',
        value: stats.activities.total,
        subtitle: `${stats.activities.completed} completadas`,
        icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
        color: 'primary',
        trend: stats.activities.total > 0 ? `${Math.round((stats.activities.completed / stats.activities.total) * 100)}%` : '0%',
        progress: stats.activities.total > 0 ? (stats.activities.completed / stats.activities.total) * 100 : 0
      },
      {
        title: 'Indicadores',
        value: stats.indicators.total,
        subtitle: `${stats.indicators.onTrack} en progreso`,
        icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
        color: 'success',
        trend: stats.indicators.total > 0 ? `${Math.round((stats.indicators.onTrack / stats.indicators.total) * 100)}%` : '0%',
        progress: stats.indicators.total > 0 ? (stats.indicators.onTrack / stats.indicators.total) * 100 : 0
      },
      {
        title: 'Reportes',
        value: stats.progressReports.total,
        subtitle: `${stats.progressReports.pending} pendientes`,
        icon: <PendingActionsIcon sx={{ fontSize: 40 }} />,
        color: stats.progressReports.pending > 0 ? 'warning' : 'info',
        trend: `${stats.progressReports.approved} aprobados`,
        progress: stats.progressReports.total > 0 ? (stats.progressReports.approved / stats.progressReports.total) * 100 : 0
      },
      {
        title: 'Usuarios',
        value: stats.users.total,
        subtitle: `${stats.users.active} activos`,
        icon: <PeopleIcon sx={{ fontSize: 40 }} />,
        color: 'info',
        trend: stats.users.total > 0 ? `${Math.round((stats.users.active / stats.users.total) * 100)}%` : '0%',
        progress: stats.users.total > 0 ? (stats.users.active / stats.users.total) * 100 : 0
      }
    ]
  }

  const getStatusIcon = (status, type) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'error':
        return <ErrorIcon color="error" />
      case 'info':
        return type === 'activity' ? <AssignmentIcon color="info" /> : <AssessmentIcon color="info" />
      default:
        return <TimelineIcon color="action" />
    }
  }

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  const statsCards = getStatsCards()

  return (
    <Box>
      {/* Header modernizado */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight="700" gutterBottom sx={{ 
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Panel de Control
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Bienvenido, {user?.firstName} {user?.lastName}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip 
              label={user?.role?.name} 
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
          </Stack>
        </Box>
        
        <Tooltip title="Actualizar datos">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            sx={{ 
              backgroundColor: 'primary.main', 
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' }
            }}
          >
            {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards modernizadas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${
                  card.color === 'primary' ? '#1976d2, #1565c0' : 
                  card.color === 'success' ? '#2e7d32, #1b5e20' :
                  card.color === 'warning' ? '#ed6c02, #e65100' : 
                  card.color === 'info' ? '#0288d1, #01579b' : '#757575, #424242'
                })`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '50%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.1)',
                  transform: 'skewX(-15deg)',
                  transformOrigin: 'top'
                }
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      mr: 2,
                      width: 60,
                      height: 60
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.trend}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  {card.title}
                </Typography>
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>      <Grid container spacing={3}>
        {/* Progreso por Eje Estratégico */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Progreso por Eje Estratégico
                </Typography>
                <Chip 
                  label={`${dashboardData.strategicAxes.length} ejes`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                {dashboardData.strategicAxes.length > 0 ? (
                  dashboardData.strategicAxes.map((axis, index) => {
                    // Calcular progreso basado en actividades completadas
                    const progress = axis.objectives?.length > 0 
                      ? Math.round((axis.objectives.filter(obj => obj.status === 'COMPLETED').length / axis.objectives.length) * 100)
                      : 0
                    
                    const getProgressColor = (progress) => {
                      if (progress >= 80) return 'success'
                      if (progress >= 60) return 'info'  
                      if (progress >= 40) return 'warning'
                      return 'error'
                    }

                    return (
                      <Box key={axis.id} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {axis.name}
                          </Typography>
                          <Chip 
                            label={`${progress}%`}
                            size="small"
                            color={getProgressColor(progress)}
                            variant="filled"
                          />
                        </Box>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={progress} 
                          color={getProgressColor(progress)}
                          sx={{ 
                            height: 10, 
                            borderRadius: 5,
                            backgroundColor: 'rgba(0,0,0,0.1)'
                          }}
                        />
                        
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {axis.objectives?.length || 0} objetivos • {axis.description || 'Sin descripción'}
                        </Typography>
                      </Box>
                    )
                  })
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AccountTreeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No hay ejes estratégicos configurados
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Actividades Recientes */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Actividades Recientes
                </Typography>
                <Badge badgeContent={dashboardData.recentActivities.length} color="primary">
                  <TimelineIcon color="action" />
                </Badge>
              </Box>
              
              <List sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                {dashboardData.recentActivities.length > 0 ? (
                  dashboardData.recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            backgroundColor: 'transparent',
                            border: '2px solid',
                            borderColor: activity.status === 'success' ? 'success.main' : 
                                       activity.status === 'warning' ? 'warning.main' :
                                       activity.status === 'error' ? 'error.main' : 'info.main'
                          }}>
                            {getStatusIcon(activity.status, activity.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="bold">
                              {activity.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {activity.subtitle}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < dashboardData.recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <TimelineIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No hay actividades recientes
                    </Typography>
                  </Box>
                )}
              </List>
            </CardContent>
            
            {dashboardData.recentActivities.length > 0 && (
              <CardActions>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => window.location.href = '/planning/activities'}
                >
                  Ver todas las actividades
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Secciones específicas por rol */}
      {hasRole('Técnico de Seguimiento') && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
              border: '1px solid #2196f3'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingActionsIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Mis Tareas Pendientes
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Tienes {dashboardData.stats.progressReports.pending} reportes de avance pendientes de envío.
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {dashboardData.stats.progressReports.pending > 0 && (
                  <Chip 
                    label={`${dashboardData.stats.progressReports.pending} reportes pendientes`} 
                    color="warning" 
                    size="small" 
                  />
                )}
                {dashboardData.stats.progressReports.approved > 0 && (
                  <Chip 
                    label={`${dashboardData.stats.progressReports.approved} reportes aprobados`} 
                    color="success" 
                    size="small" 
                  />
                )}
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => window.location.href = '/tracking/progress'}
                >
                  Ir a Reportes de Avance
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {(hasRole('Director de Área') || hasRole('Coordinador de Planificación')) && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
              border: '1px solid #ff9800'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="warning" sx={{ mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Reportes Pendientes de Aprobación
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Hay {dashboardData.pendingApprovals.length} reportes esperando tu aprobación.
              </Typography>
              
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {dashboardData.pendingApprovals.length > 0 && (
                  <Chip 
                    label={`${dashboardData.pendingApprovals.length} reportes pendientes`} 
                    color="warning" 
                    size="small" 
                  />
                )}
                <Chip 
                  label={`${dashboardData.stats.progressReports.approved} aprobados este mes`} 
                  color="success" 
                  size="small" 
                />
              </Stack>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  color="warning"
                  onClick={() => window.location.href = '/tracking/approvals'}
                >
                  Ir a Aprobaciones
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {(hasRole('Coordinador de PACC') || hasPermission('read', 'procurement')) && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
              border: '1px solid #9c27b0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon color="secondary" sx={{ mr: 2 }} />
                <Typography variant="h6" fontWeight="bold">
                  Sistema PACC
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                Estado del Plan Anual de Compras y Contrataciones
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary" fontWeight="bold">
                      {dashboardData.stats.pacc.schedules || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Cronogramas
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {dashboardData.stats.pacc.compliant || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      En cumplimiento
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {dashboardData.stats.pacc.alerts || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Alertas
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  color="secondary"
                  onClick={() => window.location.href = '/pacc/dashboard'}
                >
                  Ir a PACC Dashboard
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Sección de resumen para Administradores */}
      {(hasRole('Administrador del Sistema') || hasRole('Director General')) && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
              border: '2px solid #4caf50'
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AssessmentIcon color="success" sx={{ mr: 2, fontSize: 32 }} />
                  <Typography variant="h5" fontWeight="bold">
                    Resumen Ejecutivo del Sistema
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="primary" fontWeight="bold">
                        {dashboardData.stats.activities.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Actividades
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="success.main" fontWeight="bold">
                        {dashboardData.stats.indicators.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Indicadores
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="warning.main" fontWeight="bold">
                        {dashboardData.stats.progressReports.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Reportes
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="info.main" fontWeight="bold">
                        {dashboardData.stats.users.active}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Usuarios Activos
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => window.location.href = '/admin/users'}
                  >
                    Gestionar Usuarios
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => window.location.href = '/reports'}
                  >
                    Ver Reportes
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => window.location.href = '/planning/strategic-planning'}
                  >
                    Planificación Estratégica
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default Dashboard
