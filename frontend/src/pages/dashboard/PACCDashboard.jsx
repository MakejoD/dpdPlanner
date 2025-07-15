import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  MonetizationOn as MoneyIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../../utils/api';

const PACCDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // En un entorno real, esto vendría de una API consolidada
      const [schedulesRes, alertsRes, complianceRes, processesRes] = await Promise.all([
        api.get('/pacc/schedules'),
        api.get('/pacc/alerts'),
        api.get('/pacc/compliance/latest'),
        api.get('/procurement-processes')
      ]);

      const schedules = schedulesRes.data;
      const alerts = alertsRes.data;
      const compliance = complianceRes.data;
      const processes = processesRes.data;

      // Calcular métricas consolidadas
      const totalSchedules = schedules.length;
      const completedSchedules = schedules.filter(s => s.status === 'COMPLETADA').length;
      const inProgressSchedules = schedules.filter(s => s.status === 'EN_PROCESO').length;
      const delayedSchedules = schedules.filter(s => s.status === 'RETRASADA').length;
      const pendingSchedules = schedules.filter(s => s.status === 'PENDIENTE').length;

      const avgCompliance = schedules.length > 0 
        ? schedules.reduce((sum, s) => sum + s.compliancePercentage, 0) / schedules.length 
        : 0;

      const activeAlerts = alerts.filter(a => a.status === 'ACTIVA');
      const criticalAlerts = activeAlerts.filter(a => a.severity === 'CRITICA');
      const highAlerts = activeAlerts.filter(a => a.severity === 'ALTA');

      const totalBudget = Array.isArray(processes) ? processes.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0) : 0;
      const executedBudget = Array.isArray(processes) ? processes
        .filter(p => p.status === 'EJECUTADO')
        .reduce((sum, p) => sum + (p.estimatedAmount || 0), 0) : 0;

      const criticalPathSchedules = schedules.filter(s => s.criticalPath).length;

      setDashboardData({
        schedules,
        alerts,
        compliance,
        processes,
        metrics: {
          totalSchedules,
          completedSchedules,
          inProgressSchedules,
          delayedSchedules,
          pendingSchedules,
          avgCompliance,
          activeAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          highAlerts: highAlerts.length,
          totalBudget,
          executedBudget,
          criticalPathSchedules
        }
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateReport = async () => {
    try {
      // Llamar al endpoint que genera el reporte HTML
      const response = await api.get('/pacc/reports/executive', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-pacc-ejecutivo-${new Date().toISOString().split('T')[0]}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando dashboard del PACC...</Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const { metrics, schedules, alerts, compliance } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 2 }} />
            Dashboard Ejecutivo PACC
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Plan Anual de Contrataciones y Compras - República Dominicana
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Última actualización: {formatDate(lastUpdate)}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={fetchDashboardData} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={generateReport}
          >
            Generar Reporte
          </Button>
        </Box>
      </Box>

      {/* Métricas principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {metrics.totalSchedules}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Cronogramas
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  {metrics.completedSchedules} completados
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {metrics.avgCompliance.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Cumplimiento Promedio
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                {metrics.avgCompliance >= 80 ? (
                  <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                ) : (
                  <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                )}
                <Typography variant="caption">
                  {metrics.avgCompliance >= 80 ? 'Excelente' : 'Necesita mejoras'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(metrics.totalBudget).replace('DOP', 'RD$')}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Presupuesto PACC
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 50, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  {(metrics.executedBudget / metrics.totalBudget * 100).toFixed(1)}% ejecutado
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${metrics.criticalAlerts > 0 ? theme.palette.error.main : theme.palette.warning.main} 0%, ${metrics.criticalAlerts > 0 ? theme.palette.error.dark : theme.palette.warning.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 'bold' }}>
                    {metrics.activeAlerts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Alertas Activas
                  </Typography>
                </Box>
                <Badge badgeContent={metrics.criticalAlerts} color="error">
                  <NotificationsIcon sx={{ fontSize: 50, opacity: 0.8 }} />
                </Badge>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="caption">
                  {metrics.criticalAlerts} críticas
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos y análisis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Estado de cronogramas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PieChartIcon sx={{ mr: 1 }} />
                Estado de Cronogramas
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Completados</Typography>
                  <Typography variant="body2">{metrics.completedSchedules}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.completedSchedules / metrics.totalSchedules) * 100}
                  color="success"
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">En Proceso</Typography>
                  <Typography variant="body2">{metrics.inProgressSchedules}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.inProgressSchedules / metrics.totalSchedules) * 100}
                  color="info"
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Pendientes</Typography>
                  <Typography variant="body2">{metrics.pendingSchedules}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.pendingSchedules / metrics.totalSchedules) * 100}
                  color="warning"
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Retrasados</Typography>
                  <Typography variant="body2">{metrics.delayedSchedules}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(metrics.delayedSchedules / metrics.totalSchedules) * 100}
                  color="error"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Evaluación de cumplimiento */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                Evaluación de Cumplimiento
              </Typography>

              {compliance ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                      {compliance.overallScore}/100
                    </Typography>
                    <Chip
                      label={compliance.complianceGrade}
                      color={compliance.overallScore >= 90 ? 'success' : 
                             compliance.overallScore >= 80 ? 'info' :
                             compliance.overallScore >= 70 ? 'warning' : 'error'}
                    />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Temporal</Typography>
                      <Typography variant="body2">{compliance.timelinessScore}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={compliance.timelinessScore}
                      sx={{ mt: 0.5, mb: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Presupuestario</Typography>
                      <Typography variant="body2">{compliance.budgetCompliance}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={compliance.budgetCompliance}
                      sx={{ mt: 0.5, mb: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Legal</Typography>
                      <Typography variant="body2">{compliance.legalComplianceScore}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={compliance.legalComplianceScore}
                      sx={{ mt: 0.5, mb: 1, height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Calidad</Typography>
                      <Typography variant="body2">{compliance.qualityScore}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={compliance.qualityScore}
                      sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  No hay evaluaciones de cumplimiento disponibles
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas críticas y próximos vencimientos */}
      <Grid container spacing={3}>
        {/* Alertas críticas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ mr: 1 }} />
                Alertas Críticas
                <Badge badgeContent={metrics.criticalAlerts} color="error" sx={{ ml: 1 }} />
              </Typography>

              {alerts.filter(a => a.severity === 'CRITICA' && a.status === 'ACTIVA').length === 0 ? (
                <Alert severity="success">
                  No hay alertas críticas activas
                </Alert>
              ) : (
                <List>
                  {alerts
                    .filter(a => a.severity === 'CRITICA' && a.status === 'ACTIVA')
                    .slice(0, 5)
                    .map((alert) => (
                      <ListItem key={alert.id} divider>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.title}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {alert.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Disparada: {new Date(alert.triggerDate).toLocaleDateString('es-DO')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Próximos vencimientos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1 }} />
                Próximos Vencimientos
              </Typography>

              <List>
                {schedules
                  .filter(s => s.status !== 'COMPLETADA')
                  .sort((a, b) => new Date(a.plannedEndDate) - new Date(b.plannedEndDate))
                  .slice(0, 5)
                  .map((schedule) => {
                    const daysUntilDue = Math.ceil(
                      (new Date(schedule.plannedEndDate) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    
                    return (
                      <ListItem key={schedule.id} divider>
                        <ListItemIcon>
                          {daysUntilDue <= 7 ? (
                            <ErrorIcon color="error" />
                          ) : daysUntilDue <= 30 ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <CalendarIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={schedule.phaseName}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Vence: {new Date(schedule.plannedEndDate).toLocaleDateString('es-DO')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {daysUntilDue > 0 ? `${daysUntilDue} días restantes` : `${Math.abs(daysUntilDue)} días de retraso`}
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          size="small"
                          label={`${schedule.compliancePercentage}%`}
                          color={schedule.compliancePercentage >= 80 ? 'success' : 'warning'}
                        />
                      </ListItem>
                    );
                  })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PACCDashboard;
