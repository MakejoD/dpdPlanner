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
  Alert
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
  Timeline as TimelineIcon
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

const Dashboard = () => {
  const { user, hasRole } = useAuth()

  // Datos de ejemplo para el dashboard
  const statsCards = [
    {
      title: 'Actividades Total',
      value: '156',
      subtitle: 'Actividades planificadas',
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
      trend: '+12%'
    },
    {
      title: 'Avance Físico',
      value: '67%',
      subtitle: 'Promedio general',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: 'success',
      trend: '+5%'
    },
    {
      title: 'Ejecución Presupuestaria',
      value: '54%',
      subtitle: 'Del presupuesto total',
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
      trend: '+3%'
    },
    {
      title: 'Usuarios Activos',
      value: '23',
      subtitle: 'En el sistema',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'info',
      trend: '+2'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      title: 'Reporte de avance Q3 aprobado',
      subtitle: 'Actividad: Implementación de sistema',
      time: 'Hace 2 horas',
      status: 'success'
    },
    {
      id: 2,
      title: 'Nuevo indicador creado',
      subtitle: 'Eje: Modernización tecnológica',
      time: 'Hace 4 horas',
      status: 'info'
    },
    {
      id: 3,
      title: 'Reporte pendiente de aprobación',
      subtitle: 'Actividad: Capacitación personal',
      time: 'Hace 6 horas',
      status: 'warning'
    },
    {
      id: 4,
      title: 'Meta Q3 no alcanzada',
      subtitle: 'Indicador: Eficiencia operativa',
      time: 'Hace 1 día',
      status: 'error'
    }
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'error':
        return <ErrorIcon color="error" />
      default:
        return <AssignmentIcon color="info" />
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Panel de Control
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {user?.firstName} {user?.lastName}
        </Typography>
        <Chip 
          label={user?.role?.name} 
          color="primary" 
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${card.color === 'primary' ? '#1976d2' : 
                  card.color === 'success' ? '#2e7d32' :
                  card.color === 'warning' ? '#ed6c02' : '#0288d1'} 0%, ${
                  card.color === 'primary' ? '#1565c0' : 
                  card.color === 'success' ? '#1b5e20' :
                  card.color === 'warning' ? '#e65100' : '#01579b'} 100%)`,
                color: 'white'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      mr: 2 
                    }}
                  >
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {card.trend}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" gutterBottom>
                  {card.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Progress Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Progreso por Eje Estratégico
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                {[
                  { name: 'Modernización Tecnológica', progress: 75, color: 'primary' },
                  { name: 'Fortalecimiento Institucional', progress: 60, color: 'success' },
                  { name: 'Transparencia y Rendición', progress: 45, color: 'warning' },
                  { name: 'Desarrollo del Talento Humano', progress: 80, color: 'info' }
                ].map((item, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.progress} 
                      color={item.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actividades Recientes
              </Typography>
              
              <List sx={{ mt: 2 }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ backgroundColor: 'transparent' }}>
                          {getStatusIcon(activity.status)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
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
                    {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role-specific sections */}
      {hasRole('Técnico Registrador') && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, backgroundColor: 'info.lighter' }}>
              <Typography variant="h6" gutterBottom>
                Mis Tareas Pendientes
              </Typography>
              <Typography variant="body2">
                Tienes 3 reportes de avance pendientes de envío para este trimestre.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="2 reportes vencidos" color="error" size="small" sx={{ mr: 1 }} />
                <Chip label="1 reporte por vencer" color="warning" size="small" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {hasRole('Director de Área') && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, backgroundColor: 'warning.lighter' }}>
              <Typography variant="h6" gutterBottom>
                Reportes Pendientes de Aprobación
              </Typography>
              <Typography variant="body2">
                Hay 5 reportes de tu equipo esperando tu aprobación.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="3 reportes Q3" color="primary" size="small" sx={{ mr: 1 }} />
                <Chip label="2 reportes mensuales" color="secondary" size="small" />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Sistema de Aprobaciones - Para usuarios con permisos de aprobación */}
      {hasRole('Director') || hasRole('Administrador') || hasRole('Director de Área') ? (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <ApprovalsDashboard />
          </Grid>
        </Grid>
      ) : null}
    </Box>
  )
}

export default Dashboard
