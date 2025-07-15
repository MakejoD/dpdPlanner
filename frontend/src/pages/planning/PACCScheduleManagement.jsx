import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  PieChart as PieChartIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../../utils/api';

const PACCScheduleManagement = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [procurementProcesses, setProcurementProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Cargar cronogramas PACC
      const schedulesResponse = await api.get('/pacc/schedules');
      setSchedules(schedulesResponse.data);

      // Cargar alertas
      const alertsResponse = await api.get('/pacc/alerts');
      setAlerts(alertsResponse.data);

      // Cargar evaluación de cumplimiento más reciente
      const complianceResponse = await api.get('/pacc/compliance/latest');
      setCompliance(complianceResponse.data);

      // Cargar procesos de contratación
      const processesResponse = await api.get('/procurement-processes');
      setProcurementProcesses(processesResponse.data);

    } catch (error) {
      console.error('Error fetching PACC data:', error);
      setError('Error al cargar los datos del PACC');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETADA': return 'success';
      case 'EN_PROCESO': return 'info';
      case 'RETRASADA': return 'error';
      case 'PENDIENTE': return 'warning';
      default: return 'default';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICA': return 'error';
      case 'ALTA': return 'warning';
      case 'MEDIA': return 'info';
      case 'BAJA': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICA': return <ErrorIcon />;
      case 'ALTA': return <WarningIcon />;
      case 'MEDIA': return <InfoIcon />;
      case 'BAJA': return <CheckCircleIcon />;
      default: return <InfoIcon />;
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
    return new Date(date).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
    setDialogOpen(true);
  };

  // Dashboard de resumen
  const DashboardSummary = () => {
    const totalSchedules = schedules.length;
    const completedSchedules = schedules.filter(s => s.status === 'COMPLETADA').length;
    const inProgressSchedules = schedules.filter(s => s.status === 'EN_PROCESO').length;
    const delayedSchedules = schedules.filter(s => s.status === 'RETRASADA').length;
    const avgCompliance = schedules.length > 0 
      ? schedules.reduce((sum, s) => sum + s.compliancePercentage, 0) / schedules.length 
      : 0;

    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICA' && a.status === 'ACTIVA').length;
    const totalActiveAlerts = alerts.filter(a => a.status === 'ACTIVA').length;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.primary.light, color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {totalSchedules}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Cronogramas
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.success.light, color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {avgCompliance.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Cumplimiento Promedio
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.info.light, color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {inProgressSchedules}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    En Proceso
                  </Typography>
                </Box>
                <TimelineIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: criticalAlerts > 0 ? theme.palette.error.light : theme.palette.warning.light, color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                    {totalActiveAlerts}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Alertas Activas
                  </Typography>
                </Box>
                <Badge badgeContent={criticalAlerts} color="error">
                  <NotificationsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Tabla de cronogramas
  const SchedulesTable = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          Cronogramas del PACC
        </Typography>
        
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fase del Proceso</strong></TableCell>
                <TableCell><strong>Proceso</strong></TableCell>
                <TableCell><strong>Responsable</strong></TableCell>
                <TableCell><strong>Fechas</strong></TableCell>
                <TableCell><strong>Cumplimiento</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Ruta Crítica</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {schedule.phaseName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {schedule.procurementProcess?.description || 'No asignado'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2">
                          {schedule.responsibleUser?.firstName} {schedule.responsibleUser?.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {schedule.responsibleUser?.department?.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        <CalendarIcon sx={{ fontSize: 14, mr: 0.5 }} />
                        {formatDate(schedule.plannedStartDate)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(schedule.plannedEndDate)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {schedule.compliancePercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={schedule.compliancePercentage}
                        color={schedule.compliancePercentage >= 80 ? 'success' : 
                               schedule.compliancePercentage >= 60 ? 'warning' : 'error'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.status.replace('_', ' ')}
                      color={getStatusColor(schedule.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.criticalPath ? (
                      <Chip
                        label="Crítica"
                        color="error"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    ) : (
                      <Chip
                        label="Normal"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleScheduleClick(schedule)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  // Panel de alertas
  const AlertsPanel = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <NotificationsIcon sx={{ mr: 1 }} />
          Alertas del Sistema PACC
        </Typography>

        {alerts.length === 0 ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            No hay alertas activas en el sistema
          </Alert>
        ) : (
          <Box sx={{ mt: 2 }}>
            {alerts.map((alert) => (
              <Accordion key={alert.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Chip
                      icon={getSeverityIcon(alert.severity)}
                      label={alert.severity}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {alert.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(alert.triggerDate)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" paragraph>
                        {alert.description}
                      </Typography>
                    </Grid>
                    {alert.assignedUser && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="textSecondary">
                          Asignado a:
                        </Typography>
                        <Typography variant="body2">
                          {alert.assignedUser.firstName} {alert.assignedUser.lastName}
                        </Typography>
                      </Grid>
                    )}
                    {alert.dueDate && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="textSecondary">
                          Fecha límite:
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(alert.dueDate)}
                        </Typography>
                      </Grid>
                    )}
                    {alert.suggestedActions && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="textSecondary">
                          Acciones sugeridas:
                        </Typography>
                        <Typography variant="body2">
                          {alert.suggestedActions}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Panel de cumplimiento
  const CompliancePanel = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon sx={{ mr: 1 }} />
          Evaluación de Cumplimiento PACC
        </Typography>

        {compliance ? (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {compliance.overallScore}/100
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Puntuación General ({compliance.complianceGrade})
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Desglose de Cumplimiento
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Temporal:</Typography>
                    <Typography variant="body2">{compliance.timelinessScore}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliance.timelinessScore}
                    sx={{ mt: 0.5, mb: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Presupuestario:</Typography>
                    <Typography variant="body2">{compliance.budgetCompliance}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliance.budgetCompliance}
                    sx={{ mt: 0.5, mb: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Legal:</Typography>
                    <Typography variant="body2">{compliance.legalComplianceScore}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliance.legalComplianceScore}
                    sx={{ mt: 0.5, mb: 1 }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Calidad:</Typography>
                    <Typography variant="body2">{compliance.qualityScore}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliance.qualityScore}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Total Procesos
                  </Typography>
                  <Typography variant="h6">
                    {compliance.totalProcesses}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    En Tiempo
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {compliance.processesOnSchedule}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Retrasados
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {compliance.processesDelayed}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    En Riesgo
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {compliance.processesAtRisk}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay evaluaciones de cumplimiento disponibles
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Cargando cronogramas del PACC...</Typography>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ScheduleIcon sx={{ mr: 2 }} />
        Cronograma y Seguimiento del PACC
      </Typography>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Sistema de gestión y seguimiento del Plan Anual de Contrataciones y Compras (PACC)
        conforme a la Ley 340-06 de Compras y Contrataciones del Estado.
      </Typography>

      <DashboardSummary />

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Cronogramas" icon={<ScheduleIcon />} />
        <Tab label="Alertas" icon={<Badge badgeContent={alerts.filter(a => a.status === 'ACTIVA').length} color="error"><NotificationsIcon /></Badge>} />
        <Tab label="Cumplimiento" icon={<AssessmentIcon />} />
      </Tabs>

      {tabValue === 0 && <SchedulesTable />}
      {tabValue === 1 && <AlertsPanel />}
      {tabValue === 2 && <CompliancePanel />}

      {/* Dialog para detalles del cronograma */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles del Cronograma
        </DialogTitle>
        <DialogContent>
          {selectedSchedule && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedSchedule.phaseName}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Proceso de Contratación:
                </Typography>
                <Typography variant="body2">
                  {selectedSchedule.procurementProcess?.description}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Responsable:
                </Typography>
                <Typography variant="body2">
                  {selectedSchedule.responsibleUser?.firstName} {selectedSchedule.responsibleUser?.lastName}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Fecha de Inicio:
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedSchedule.plannedStartDate)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Fecha de Fin:
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedSchedule.plannedEndDate)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Cumplimiento:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedSchedule.compliancePercentage}
                    sx={{ flexGrow: 1, mr: 2 }}
                  />
                  <Typography variant="body2">
                    {selectedSchedule.compliancePercentage}%
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Estado:
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={selectedSchedule.status.replace('_', ' ')}
                    color={getStatusColor(selectedSchedule.status)}
                  />
                </Box>
              </Grid>

              {selectedSchedule.risks && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Riesgos Identificados:
                  </Typography>
                  <Typography variant="body2">
                    {selectedSchedule.risks}
                  </Typography>
                </Grid>
              )}

              {selectedSchedule.observations && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Observaciones:
                  </Typography>
                  <Typography variant="body2">
                    {selectedSchedule.observations}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cerrar
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            Editar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PACCScheduleManagement;
