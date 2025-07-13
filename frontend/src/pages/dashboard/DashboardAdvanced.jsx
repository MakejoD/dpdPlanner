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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
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
  Refresh as RefreshIcon
} from '@mui/icons-material'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js'
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2'
import { format, startOfMonth, endOfMonth } from 'date-fns'

import { useAuth } from '../../contexts/AuthContext'
import ApprovalsDashboard from '../../components/common/ApprovalsDashboard'
import httpClient from '../../utils/api'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const DashboardAdvanced = () => {
  const { user, hasRole } = useAuth()
  
  // Estados para datos y filtros
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [filters, setFilters] = useState({
    departmentId: '',
    strategicAxisId: '',
    period: format(new Date(), 'yyyy-MM'),
    year: new Date().getFullYear()
  })
  
  // Estados para datos de filtros
  const [departments, setDepartments] = useState([])
  const [strategicAxes, setStrategicAxes] = useState([])
  
  // Cargar datos iniciales
  useEffect(() => {
    loadFilterData()
    loadDashboardData()
  }, [])
  
  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (dashboardData) { // Solo recargar si ya tenemos datos
      loadDashboardData()
    }
  }, [filters])
  
  const loadFilterData = async () => {
    try {
      const [deptsResponse, axesResponse] = await Promise.all([
        httpClient.get('/departments'),
        httpClient.get('/strategic-axes')
      ])
      
      setDepartments(Array.isArray(deptsResponse.data.data) ? deptsResponse.data.data : [])
      setStrategicAxes(Array.isArray(axesResponse.data.data) ? axesResponse.data.data : [])
    } catch (error) {
      console.error('Error cargando datos de filtros:', error)
    }
  }
  
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Obtener datos de múltiples endpoints
      const [
        activitiesResponse,
        progressResponse,
        budgetResponse,
        approvalsResponse
      ] = await Promise.all([
        httpClient.get('/activities'),
        httpClient.get('/progress-reports'),
        httpClient.get('/budget-execution'),
        httpClient.get('/approvals/pending')
      ])
      
      const activities = Array.isArray(activitiesResponse.data.data) ? activitiesResponse.data.data : []
      const progressReports = Array.isArray(progressResponse.data.data) ? progressResponse.data.data : []
      const budgetExecutions = Array.isArray(budgetResponse.data.data) ? budgetResponse.data.data : []
      const pendingApprovals = Array.isArray(approvalsResponse.data.data) ? approvalsResponse.data.data : []
      
      // Procesar datos para el dashboard
      const processedData = processDashboardData(activities, progressReports, budgetExecutions, pendingApprovals)
      setDashboardData(processedData)
      
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const processDashboardData = (activities, progressReports, budgetExecutions, pendingApprovals) => {
    // Filtrar por departamento si está seleccionado
    let filteredActivities = activities
    if (filters.departmentId) {
      filteredActivities = activities.filter(activity => 
        activity.responsibleUser?.departmentId === parseInt(filters.departmentId)
      )
    }
    
    // Filtrar por eje estratégico si está seleccionado
    if (filters.strategicAxisId) {
      filteredActivities = filteredActivities.filter(activity =>
        activity.product?.objective?.strategicAxisId === parseInt(filters.strategicAxisId)
      )
    }
    
    // Calcular métricas principales
    const totalActivities = filteredActivities.length
    const activitiesWithProgress = progressReports.filter(report => 
      filteredActivities.some(activity => activity.id === report.activityId)
    )
    
    // Calcular avance físico promedio
    const physicalProgress = activitiesWithProgress.length > 0 
      ? activitiesWithProgress.reduce((sum, report) => sum + (report.executionPercentage || 0), 0) / activitiesWithProgress.length
      : 0
    
    // Calcular presupuesto total y ejecutado
    const totalBudget = budgetExecutions.reduce((sum, budget) => sum + parseFloat(budget.assignedAmount || 0), 0)
    const executedBudget = budgetExecutions.reduce((sum, budget) => sum + parseFloat(budget.paidAmount || 0), 0)
    const budgetExecution = totalBudget > 0 ? (executedBudget / totalBudget) * 100 : 0
    
    // Datos para gráficos
    const progressByMonth = generateProgressByMonth(progressReports)
    const budgetByActivity = generateBudgetByActivity(filteredActivities, budgetExecutions)
    const activitiesByStatus = generateActivitiesByStatus(filteredActivities, progressReports)
    const departmentProgress = generateDepartmentProgress(activities, progressReports, departments)
    
    return {
      stats: {
        totalActivities,
        physicalProgress,
        budgetExecution,
        pendingApprovals: pendingApprovals.length,
        totalBudget,
        executedBudget
      },
      charts: {
        progressByMonth,
        budgetByActivity,
        activitiesByStatus,
        departmentProgress
      },
      semaphores: generateSemaphores(physicalProgress, budgetExecution, activitiesWithProgress.length, totalActivities)
    }
  }
  
  const generateProgressByMonth = (progressReports) => {
    const monthlyData = {}
    progressReports.forEach(report => {
      if (report.createdAt) {
        const month = format(new Date(report.createdAt), 'yyyy-MM')
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0 }
        }
        monthlyData[month].total += report.executionPercentage || 0
        monthlyData[month].count += 1
      }
    })
    
    const months = Object.keys(monthlyData).sort().slice(-6) // Últimos 6 meses
    return {
      labels: months.map(month => format(new Date(month + '-01'), 'MMM yyyy')),
      datasets: [{
        label: 'Avance Físico Promedio (%)',
        data: months.map(month => monthlyData[month].count > 0 
          ? (monthlyData[month].total / monthlyData[month].count).toFixed(1)
          : 0
        ),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    }
  }
  
  const generateBudgetByActivity = (activities, budgetExecutions) => {
    const activityBudgets = activities.slice(0, 10).map(activity => {
      const budgets = budgetExecutions.filter(budget => budget.activityId === activity.id)
      const assigned = budgets.reduce((sum, budget) => sum + parseFloat(budget.assignedAmount || 0), 0)
      const executed = budgets.reduce((sum, budget) => sum + parseFloat(budget.paidAmount || 0), 0)
      
      return {
        name: activity.name.length > 20 ? activity.name.substring(0, 20) + '...' : activity.name,
        assigned,
        executed
      }
    })
    
    return {
      labels: activityBudgets.map(item => item.name),
      datasets: [
        {
          label: 'Presupuesto Asignado',
          data: activityBudgets.map(item => item.assigned),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
        },
        {
          label: 'Presupuesto Ejecutado',
          data: activityBudgets.map(item => item.executed),
          backgroundColor: 'rgba(255, 99, 132, 0.8)',
        }
      ]
    }
  }
  
  const generateActivitiesByStatus = (activities, progressReports) => {
    let onTrack = 0
    let delayed = 0
    let critical = 0
    let notStarted = activities.length
    
    activities.forEach(activity => {
      const reports = progressReports.filter(report => report.activityId === activity.id)
      if (reports.length > 0) {
        notStarted--
        const avgProgress = reports.reduce((sum, report) => sum + (report.executionPercentage || 0), 0) / reports.length
        
        if (avgProgress >= 80) onTrack++
        else if (avgProgress >= 50) delayed++
        else critical++
      }
    })
    
    return {
      labels: ['En Meta', 'Con Retraso', 'Crítico', 'Sin Iniciar'],
      datasets: [{
        data: [onTrack, delayed, critical, notStarted],
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',   // Verde
          'rgba(255, 193, 7, 0.8)',   // Amarillo
          'rgba(244, 67, 54, 0.8)',   // Rojo
          'rgba(158, 158, 158, 0.8)'  // Gris
        ],
        borderWidth: 2
      }]
    }
  }
  
  const generateDepartmentProgress = (activities, progressReports, departments) => {
    const deptProgress = departments.map(dept => {
      const deptActivities = activities.filter(activity => 
        activity.responsibleUser?.departmentId === dept.id
      )
      
      if (deptActivities.length === 0) return { name: dept.name, progress: 0 }
      
      const deptReports = progressReports.filter(report =>
        deptActivities.some(activity => activity.id === report.activityId)
      )
      
      const avgProgress = deptReports.length > 0
        ? deptReports.reduce((sum, report) => sum + (report.executionPercentage || 0), 0) / deptReports.length
        : 0
      
      return { 
        name: dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name, 
        progress: avgProgress.toFixed(1) 
      }
    }).filter(item => item.progress > 0)
    
    return {
      labels: deptProgress.map(item => item.name),
      datasets: [{
        label: 'Avance por Departamento (%)',
        data: deptProgress.map(item => item.progress),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
      }]
    }
  }
  
  const generateSemaphores = (physicalProgress, budgetExecution, activitiesWithProgress, totalActivities) => {
    const getColor = (value, thresholds = { good: 80, warning: 60 }) => {
      if (value >= thresholds.good) return 'success'
      if (value >= thresholds.warning) return 'warning'
      return 'error'
    }
    
    const coveragePercentage = totalActivities > 0 ? (activitiesWithProgress / totalActivities) * 100 : 0
    
    return [
      {
        title: 'Avance Físico',
        value: physicalProgress.toFixed(1),
        unit: '%',
        color: getColor(physicalProgress),
        description: physicalProgress >= 80 ? 'Excelente progreso' : 
                    physicalProgress >= 60 ? 'Progreso moderado' : 'Requiere atención'
      },
      {
        title: 'Ejecución Presupuestal',
        value: budgetExecution.toFixed(1),
        unit: '%',
        color: getColor(budgetExecution),
        description: budgetExecution >= 80 ? 'Ejecución alta' : 
                    budgetExecution >= 60 ? 'Ejecución moderada' : 'Ejecución baja'
      },
      {
        title: 'Cobertura de Reportes',
        value: coveragePercentage.toFixed(1),
        unit: '%',
        color: getColor(coveragePercentage),
        description: coveragePercentage >= 80 ? 'Buena cobertura' : 
                    coveragePercentage >= 60 ? 'Cobertura parcial' : 'Cobertura insuficiente'
      }
    ]
  }
  
  const getSemaphoreIcon = (color) => {
    switch (color) {
      case 'success':
        return <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
      case 'warning':
        return <WarningIcon color="warning" sx={{ fontSize: 40 }} />
      case 'error':
        return <ErrorIcon color="error" sx={{ fontSize: 40 }} />
      default:
        return <AssignmentIcon color="info" sx={{ fontSize: 40 }} />
    }
  }
  
  const exportDashboard = () => {
    // TODO: Implementar exportación a PDF/Excel
    alert('Funcionalidad de exportación en desarrollo')
  }
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }
  
  const clearFilters = () => {
    setFilters({
      departmentId: '',
      strategicAxisId: '',
      period: format(new Date(), 'yyyy-MM'),
      year: new Date().getFullYear()
    })
  }
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando dashboard...
        </Typography>
      </Box>
    )
  }
  
  if (!dashboardData) {
    return (
      <Alert severity="error">
        Error al cargar los datos del dashboard
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Dashboard Avanzado POA
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {user?.firstName} {user?.lastName} - {user?.role?.name}
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Filtros Dinámicos</Typography>
            <Box sx={{ ml: 'auto' }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadDashboardData}
                sx={{ mr: 1 }}
              >
                Actualizar
              </Button>
              <Button
                startIcon={<ExportIcon />}
                onClick={exportDashboard}
                variant="outlined"
              >
                Exportar
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={filters.departmentId}
                  label="Departamento"
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                >
                  <MenuItem value="">Todos los departamentos</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Eje Estratégico</InputLabel>
                <Select
                  value={filters.strategicAxisId}
                  label="Eje Estratégico"
                  onChange={(e) => handleFilterChange('strategicAxisId', e.target.value)}
                >
                  <MenuItem value="">Todos los ejes</MenuItem>
                  {strategicAxes.map((axis) => (
                    <MenuItem key={axis.id} value={axis.id}>
                      {axis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Año</InputLabel>
                <Select
                  value={filters.year}
                  label="Año"
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <MenuItem value={2024}>2024</MenuItem>
                  <MenuItem value={2025}>2025</MenuItem>
                  <MenuItem value={2026}>2026</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                fullWidth
                size="medium"
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Sistema de Semáforos */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        🚦 Sistema de Semáforos
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardData.semaphores.map((semaphore, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                border: `3px solid ${
                  semaphore.color === 'success' ? '#4caf50' :
                  semaphore.color === 'warning' ? '#ff9800' : '#f44336'
                }`,
                backgroundColor: semaphore.color === 'success' ? '#e8f5e8' :
                                semaphore.color === 'warning' ? '#fff3e0' : '#ffebee'
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {getSemaphoreIcon(semaphore.color)}
                </Box>
                <Typography variant="h3" fontWeight="bold" color={semaphore.color}>
                  {semaphore.value}{semaphore.unit}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {semaphore.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {semaphore.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Estadísticas Principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ backgroundColor: 'primary.main', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.stats.totalActivities}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Actividades
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6">Total Actividades</Typography>
              <Typography variant="body2" color="text.secondary">
                En el período seleccionado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ backgroundColor: 'success.main', mr: 2 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.stats.physicalProgress.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Promedio
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6">Avance Físico</Typography>
              <Typography variant="body2" color="text.secondary">
                Ejecución de actividades
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ backgroundColor: 'warning.main', mr: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.stats.budgetExecution.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ejecutado
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6">Ejecución Presupuestal</Typography>
              <Typography variant="body2" color="text.secondary">
                ${(dashboardData.stats.executedBudget / 1000000).toFixed(1)}M / ${(dashboardData.stats.totalBudget / 1000000).toFixed(1)}M
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ backgroundColor: 'info.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardData.stats.pendingApprovals}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6">Aprobaciones</Typography>
              <Typography variant="body2" color="text.secondary">
                Reportes por aprobar
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos Dinámicos */}
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        📊 Análisis Gráfico
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Progreso por Mes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evolución de Avance Físico
              </Typography>
              {dashboardData.charts.progressByMonth.labels.length > 0 ? (
                <Line 
                  data={dashboardData.charts.progressByMonth}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Últimos 6 meses' }
                    },
                    scales: {
                      y: { beginAtZero: true, max: 100 }
                    }
                  }}
                />
              ) : (
                <Typography color="text.secondary">No hay datos disponibles</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de Actividades */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado de Actividades
              </Typography>
              {dashboardData.charts.activitiesByStatus.datasets[0].data.some(val => val > 0) ? (
                <Doughnut 
                  data={dashboardData.charts.activitiesByStatus}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' },
                      title: { display: true, text: 'Distribución por estado' }
                    }
                  }}
                />
              ) : (
                <Typography color="text.secondary">No hay datos disponibles</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Presupuesto por Actividad */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comparativo Físico vs Financiero
              </Typography>
              {dashboardData.charts.budgetByActivity.labels.length > 0 ? (
                <Bar 
                  data={dashboardData.charts.budgetByActivity}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Top 10 actividades' }
                    },
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              ) : (
                <Typography color="text.secondary">No hay datos disponibles</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Progreso por Departamento */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avance por Departamento
              </Typography>
              {dashboardData.charts.departmentProgress.labels.length > 0 ? (
                <Bar 
                  data={dashboardData.charts.departmentProgress}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Comparativo departamental' }
                    },
                    scales: {
                      y: { beginAtZero: true, max: 100 }
                    }
                  }}
                />
              ) : (
                <Typography color="text.secondary">No hay datos disponibles</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dashboard de Aprobaciones */}
      <Divider sx={{ my: 4 }} />
      <ApprovalsDashboard />
    </Box>
  )
}

export default DashboardAdvanced
