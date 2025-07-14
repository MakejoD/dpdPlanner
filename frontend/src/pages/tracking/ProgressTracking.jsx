import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Fab,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Stack
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  PendingActions as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  BarChart as ChartIcon,
  AttachFile as AttachIcon,
  Delete as DeleteIcon,
  Description as ReportIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const ProgressTracking = () => {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Estados para informes
  const [reports, setReports] = useState([]);
  const [assignments, setAssignments] = useState({ activities: [], directIndicators: [] });
  
  // Estados para diálogos
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Estados para formulario
  const [formData, setFormData] = useState({
    activityId: '',
    indicatorId: '',
    periodType: 'trimestral',
    period: '',
    currentValue: '',
    targetValue: '',
    executionPercentage: '',
    qualitativeComments: '',
    challenges: '',
    nextSteps: ''
  });
  
  // Estados para archivos
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Estados para revisión
  const [reviewData, setReviewData] = useState({
    action: 'aprobar',
    reviewComments: ''
  });
  
  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  
  // Estado para estadísticas
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    rejectedReports: 0,
    myPendingReports: 0
  });

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadReports(),
        loadAssignments(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      showAlert('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const response = await httpClient.get('/progress-reports');
      setReports(response.data.data || []);
    } catch (error) {
      console.error('Error cargando informes:', error);
      setReports([]);
    }
  };

  const loadAssignments = async () => {
    try {
      console.log('🔄 Cargando asignaciones desde el endpoint optimizado...');
      
      // Usar el nuevo endpoint que funciona correctamente
      const response = await httpClient.get('/activities/list-for-tracking');
      console.log('✅ Respuesta del endpoint list-for-tracking:', response);
      
      // Con el fix del httpClient, los datos están en response.data.data
      const activitiesData = response.data.data || [];
      console.log('📊 Actividades cargadas:', activitiesData.length);
      
      // También obtener indicadores directos asignados
      try {
        const indicatorsResponse = await httpClient.get('/progress-reports/my-assignments');
        setAssignments({
          activities: activitiesData,
          directIndicators: indicatorsResponse.data.data?.directIndicators || []
        });
        console.log('✅ Asignaciones cargadas exitosamente');
      } catch (indicatorError) {
        console.warn('⚠️ Error cargando indicadores directos, usando solo actividades');
        setAssignments({
          activities: activitiesData,
          directIndicators: []
        });
      }
    } catch (error) {
      console.error('❌ Error cargando asignaciones:', error);
      setAssignments({ activities: [], directIndicators: [] });
      showAlert('Error al cargar las asignaciones de actividades', 'error');
    }
  };

  const loadStats = async () => {
    try {
      const response = await httpClient.get('/progress-reports');
      const allReports = response.data.data || [];
      
      setStats({
        totalReports: allReports.length,
        pendingReports: allReports.filter(r => r.status === 'SUBMITTED').length,
        approvedReports: allReports.filter(r => r.status === 'APPROVED').length,
        rejectedReports: allReports.filter(r => r.status === 'REJECTED').length,
        myPendingReports: allReports.filter(r => r.status === 'SUBMITTED' && r.reportedBy.id === user.id).length
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setStats({ totalReports: 0, pendingReports: 0, approvedReports: 0, rejectedReports: 0, myPendingReports: 0 });
    }
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funciones para crear reporte
  const handleOpenCreateDialog = (assignment, type) => {
    console.log('🎯 Abriendo diálogo de creación de informe...');
    console.log('📋 Asignación:', assignment);
    console.log('🔧 Tipo:', type);
    
    setSelectedAssignment({ ...assignment, type });
    
    // Pre-población inteligente basada en el tipo
    let initialFormData = {
      activityId: type === 'activity' ? assignment.id : '',
      indicatorId: type === 'indicator' ? assignment.id : '',
      periodType: 'trimestral',
      period: generateCurrentPeriod('trimestral'),
      currentValue: '',
      targetValue: '',
      executionPercentage: '',
      qualitativeComments: '',
      challenges: '',
      nextSteps: ''
    };

    if (type === 'activity' && assignment.indicators?.length > 0) {
      // Pre-popular con datos del primer indicador de la actividad
      const primaryIndicator = assignment.indicators[0];
      console.log('📊 Pre-poblando con indicador principal:', primaryIndicator);
      
      // Usar información de seguimiento si está disponible
      const trackingInfo = assignment.tracking || {};
      
      // Determinar la periodicidad y meta correspondiente
      const reportingFrequency = primaryIndicator.reportingFrequency || 'QUARTERLY';
      const periodType = reportingFrequency === 'QUARTERLY' ? 'trimestral' : 'mensual';
      const currentPeriod = generateCurrentPeriod(periodType);
      
      let targetValue = '';
      if (periodType === 'trimestral') {
        switch (currentPeriod) {
          case 'T1':
            targetValue = primaryIndicator.q1Target || '';
            break;
          case 'T2':
            targetValue = primaryIndicator.q2Target || '';
            break;
          case 'T3':
            targetValue = primaryIndicator.q3Target || '';
            break;
          case 'T4':
            targetValue = primaryIndicator.q4Target || '';
            break;
        }
      } else {
        const monthMapping = {
          'Enero': primaryIndicator.jan_target,
          'Febrero': primaryIndicator.feb_target,
          'Marzo': primaryIndicator.mar_target,
          'Abril': primaryIndicator.apr_target,
          'Mayo': primaryIndicator.may_target,
          'Junio': primaryIndicator.jun_target,
          'Julio': primaryIndicator.jul_target,
          'Agosto': primaryIndicator.aug_target,
          'Septiembre': primaryIndicator.sep_target,
          'Octubre': primaryIndicator.oct_target,
          'Noviembre': primaryIndicator.nov_target,
          'Diciembre': primaryIndicator.dec_target
        };
        targetValue = monthMapping[currentPeriod] || '';
      }
      
      initialFormData = {
        ...initialFormData,
        periodType,
        period: currentPeriod,
        targetValue: trackingInfo.recommendedTargetValue || targetValue || primaryIndicator.annualTarget || '',
        currentValue: trackingInfo.suggestedCurrentValue || primaryIndicator.currentValue || ''
      };
      
      // Auto-calcular porcentaje si tenemos valores
      if (initialFormData.currentValue && initialFormData.targetValue) {
        const current = parseFloat(initialFormData.currentValue);
        const target = parseFloat(initialFormData.targetValue);
        if (target > 0) {
          initialFormData.executionPercentage = ((current / target) * 100).toFixed(2);
        }
      }
      
      console.log('✅ Datos pre-poblados con indicador:', initialFormData);
    } else if (type === 'activity' && (!assignment.indicators || assignment.indicators.length === 0)) {
      // Actividad sin indicadores - usar periodicidad trimestral por defecto
      console.log('⚠️ Actividad sin indicadores - usando valores por defecto');
      const periodType = 'trimestral';
      const currentPeriod = generateCurrentPeriod(periodType);
      
      initialFormData = {
        ...initialFormData,
        periodType,
        period: currentPeriod
      };
      
      console.log('✅ Datos por defecto para actividad sin indicadores:', initialFormData);
    } else if (type === 'indicator') {
      // Pre-popular con datos del indicador directo
      const reportingFrequency = assignment.reportingFrequency || 'QUARTERLY';
      const periodType = reportingFrequency === 'QUARTERLY' ? 'trimestral' : 'mensual';
      const currentPeriod = generateCurrentPeriod(periodType);
      
      let targetValue = '';
      if (periodType === 'trimestral') {
        switch (currentPeriod) {
          case 'T1':
            targetValue = assignment.q1Target || '';
            break;
          case 'T2':
            targetValue = assignment.q2Target || '';
            break;
          case 'T3':
            targetValue = assignment.q3Target || '';
            break;
          case 'T4':
            targetValue = assignment.q4Target || '';
            break;
        }
      } else {
        const monthMapping = {
          'Enero': assignment.jan_target,
          'Febrero': assignment.feb_target,
          'Marzo': assignment.mar_target,
          'Abril': assignment.apr_target,
          'Mayo': assignment.may_target,
          'Junio': assignment.jun_target,
          'Julio': assignment.jul_target,
          'Agosto': assignment.aug_target,
          'Septiembre': assignment.sep_target,
          'Octubre': assignment.oct_target,
          'Noviembre': assignment.nov_target,
          'Diciembre': assignment.dec_target
        };
        targetValue = monthMapping[currentPeriod] || '';
      }
      
      initialFormData.periodType = periodType;
      initialFormData.period = currentPeriod;
      initialFormData.targetValue = targetValue || assignment.annualTarget || '';
      initialFormData.currentValue = assignment.currentValue || '';
    }

    setFormData(initialFormData);
    setSelectedFiles([]);
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setSelectedAssignment(null);
    setFormData({
      activityId: '',
      indicatorId: '',
      periodType: 'trimestral',
      period: '',
      currentValue: '',
      targetValue: '',
      executionPercentage: '',
      qualitativeComments: '',
      challenges: '',
      nextSteps: ''
    });
    setSelectedFiles([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Ignorar cambios en periodType ya que es determinado automáticamente por el indicador
    if (name === 'periodType') {
      return;
    }
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Si cambia el período, actualizar la meta correspondiente
      if (name === 'period' && selectedAssignment) {
        updateTargetByPeriod(newData, value, prev.periodType);
      }
      
      // Auto-calcular porcentaje de ejecución
      if (name === 'currentValue' || name === 'targetValue') {
        const current = parseFloat(name === 'currentValue' ? value : prev.currentValue) || 0;
        const target = parseFloat(name === 'targetValue' ? value : prev.targetValue) || 0;
        if (target > 0) {
          newData.executionPercentage = ((current / target) * 100).toFixed(2);
        }
      }
      
      return newData;
    });
  };

  // Función para actualizar la meta según la periodicidad y período seleccionado
  const updateTargetByPeriod = (formData, selectedPeriod, periodType) => {
    if (!selectedAssignment) return;

    let indicator = null;
    
    // Obtener el indicador principal según el tipo de assignment
    if (selectedAssignment.type === 'activity' && selectedAssignment.indicators?.length > 0) {
      indicator = selectedAssignment.indicators[0]; // Usar el primer indicador
    } else if (selectedAssignment.type === 'indicator') {
      indicator = selectedAssignment;
    }

    if (!indicator) return;

    let targetValue = '';

    if (periodType === 'trimestral') {
      // Mapear el período trimestral
      switch (selectedPeriod) {
        case 'T1':
          targetValue = indicator.q1Target || '';
          break;
        case 'T2':
          targetValue = indicator.q2Target || '';
          break;
        case 'T3':
          targetValue = indicator.q3Target || '';
          break;
        case 'T4':
          targetValue = indicator.q4Target || '';
          break;
        default:
          targetValue = '';
      }
    } else if (periodType === 'mensual') {
      // Mapear el período mensual
      const monthMapping = {
        'Enero': indicator.jan_target,
        'Febrero': indicator.feb_target,
        'Marzo': indicator.mar_target,
        'Abril': indicator.apr_target,
        'Mayo': indicator.may_target,
        'Junio': indicator.jun_target,
        'Julio': indicator.jul_target,
        'Agosto': indicator.aug_target,
        'Septiembre': indicator.sep_target,
        'Octubre': indicator.oct_target,
        'Noviembre': indicator.nov_target,
        'Diciembre': indicator.dec_target
      };
      targetValue = monthMapping[selectedPeriod] || '';
    }

    // Actualizar la meta en el formulario
    if (targetValue) {
      formData.targetValue = targetValue.toString();
      
      // Recalcular el porcentaje si ya hay un valor actual
      if (formData.currentValue) {
        const current = parseFloat(formData.currentValue) || 0;
        const target = parseFloat(targetValue) || 0;
        if (target > 0) {
          formData.executionPercentage = ((current / target) * 100).toFixed(2);
        }
      }
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleSubmitReport = async () => {
    try {
      // Validaciones
      if (!formData.periodType || !formData.period) {
        showAlert('Debe especificar el tipo y período del informe', 'error');
        return;
      }

      if (!formData.currentValue || !formData.targetValue) {
        showAlert('Debe especificar el valor actual y meta', 'error');
        return;
      }

      // Crear FormData para archivos
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Agregar archivos
      selectedFiles.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      await httpClient.post('/progress-reports', formDataToSend);

      showAlert('Informe creado exitosamente', 'success');
      handleCloseCreateDialog();
      loadData();
    } catch (error) {
      console.error('Error creando informe:', error);
      showAlert(error.response?.data?.message || 'Error al crear informe', 'error');
    }
  };

  // Funciones para ver reporte
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedReport(null);
  };

  // Funciones para revisar reporte
  const handleOpenReviewDialog = (report) => {
    setSelectedReport(report);
    setReviewData({
      action: 'aprobar',
      reviewComments: ''
    });
    setOpenReviewDialog(true);
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setSelectedReport(null);
    setReviewData({
      action: 'aprobar',
      reviewComments: ''
    });
  };

  const handleSubmitReview = async () => {
    try {
      // Validación para rechazo
      if (reviewData.action === 'rechazar' && reviewData.reviewComments.trim().length < 10) {
        showAlert('La razón del rechazo debe tener al menos 10 caracteres', 'error');
        return;
      }

      const endpoint = reviewData.action === 'aprobar' ? 'approve' : 'reject';
      const payload = {};
      
      if (reviewData.action === 'aprobar') {
        payload.comments = reviewData.reviewComments;
      } else {
        payload.rejectionReason = reviewData.reviewComments;
        payload.comments = reviewData.reviewComments; // También como comentario adicional
      }
      
      await httpClient.post(`/approvals/${selectedReport.id}/${endpoint}`, payload);
      
      showAlert(
        `Informe ${reviewData.action === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`, 
        'success'
      );
      handleCloseReviewDialog();
      loadData();
    } catch (error) {
      console.error('Error revisando informe:', error);
      showAlert(error.response?.data?.message || 'Error al revisar informe', 'error');
    }
  };

  // Funciones utilitarias
  const generateCurrentPeriod = (type) => {
    const now = new Date();
    const year = now.getFullYear();
    
    switch (type) {
      case 'trimestral':
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        return `T${quarter}`;
      case 'mensual':
        const month = now.getMonth() + 1;
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return monthNames[month - 1];
      default:
        return 'T1';
    }
  };

  const getPeriodOptions = (type) => {
    const currentYear = new Date().getFullYear();
    
    switch (type) {
      case 'trimestral':
        return [
          { value: 'T1', label: 'T1 - Primer Trimestre (Enero-Marzo)' },
          { value: 'T2', label: 'T2 - Segundo Trimestre (Abril-Junio)' },
          { value: 'T3', label: 'T3 - Tercer Trimestre (Julio-Septiembre)' },
          { value: 'T4', label: 'T4 - Cuarto Trimestre (Octubre-Diciembre)' }
        ];
      case 'mensual':
        return [
          { value: 'Enero', label: 'Enero' },
          { value: 'Febrero', label: 'Febrero' },
          { value: 'Marzo', label: 'Marzo' },
          { value: 'Abril', label: 'Abril' },
          { value: 'Mayo', label: 'Mayo' },
          { value: 'Junio', label: 'Junio' },
          { value: 'Julio', label: 'Julio' },
          { value: 'Agosto', label: 'Agosto' },
          { value: 'Septiembre', label: 'Septiembre' },
          { value: 'Octubre', label: 'Octubre' },
          { value: 'Noviembre', label: 'Noviembre' },
          { value: 'Diciembre', label: 'Diciembre' }
        ];
      default:
        return [];
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'DRAFT':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <PendingIcon />;
      case 'APPROVED':
        return <ApproveIcon />;
      case 'REJECTED':
        return <RejectIcon />;
      case 'DRAFT':
        return <PendingIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'DRAFT':
        return 'Borrador';
      default:
        return status;
    }
  };

  const canReviewReport = (report) => {
    return hasPermission('approve', 'progress_report') && 
           report.status === 'SUBMITTED' &&
           report.reportedBy.id !== user.id;
  };

  const canEditReport = (report) => {
    return report.reportedBy.id === user.id && report.status === 'SUBMITTED';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom display="flex" alignItems="center">
            <TrendingUpIcon sx={{ mr: 2 }} />
            Seguimiento e Informes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona el seguimiento e informes de avances de actividades e indicadores
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<AssignmentIcon />}
            onClick={() => window.open('/planning/activities', '_blank')}
            sx={{ textTransform: 'none' }}
          >
            Ir a Planificación
          </Button>            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                // Abrir diálogo para actividad con más indicadores
                const activityWithIndicators = assignments.activities.find(a => a.indicators?.length > 0);
                if (activityWithIndicators) {
                  handleOpenCreateDialog(activityWithIndicators, 'activity');
                } else {
                  showAlert('No hay actividades con indicadores disponibles para reportar', 'warning');
                }
              }}
              disabled={assignments.activities.filter(a => a.indicators?.length > 0).length === 0}
            >
              Crear Informe
            </Button>
        </Stack>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ReportIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Informes
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalReports}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PendingIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pendientes
                  </Typography>
                  <Typography variant="h4">
                    {stats.pendingReports}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ApproveIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Aprobados
                  </Typography>
                  <Typography variant="h4">
                    {stats.approvedReports}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Mis Pendientes
                  </Typography>
                  <Typography variant="h4">
                    {stats.myPendingReports}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Mis Asignaciones" icon={<AssignmentIcon />} />
          <Tab label="Informes de Avances" icon={<TrendingUpIcon />} />
        </Tabs>
      </Paper>

      {/* Tab 1: Mis Asignaciones */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Actividades Asignadas */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 1 }} />
                Actividades Asignadas ({assignments.activities.length})
              </Typography>
              
              {assignments.activities.length === 0 ? (
                <Alert severity="info">No tienes actividades asignadas</Alert>
              ) : (
                assignments.activities.map((activity) => (
                  <Accordion key={activity.id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                        <Box>
                          <Typography variant="subtitle1">{activity.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.product?.code} - {activity.product?.name}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip 
                            label={`${activity._count?.indicators || 0} indicadores`}
                            size="small"
                            color={activity._count?.indicators > 0 ? 'primary' : 'default'}
                            icon={<ChartIcon />}
                          />
                          <Chip 
                            label={`${activity._count?.progressReports || 0} informes`}
                            size="small"
                            color="secondary"
                            icon={<ReportIcon />}
                          />
                        </Stack>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {activity.description || 'Sin descripción disponible'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2">
                            <strong>Período:</strong> {activity.startDate ? new Date(activity.startDate).toLocaleDateString() : 'No definido'} - {activity.endDate ? new Date(activity.endDate).toLocaleDateString() : 'No definido'}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenCreateDialog(activity, 'activity')}
                              disabled={!activity.indicators || activity.indicators.length === 0}
                            >
                              Nuevo Informe
                            </Button>
                          </Box>
                        </Grid>
                        
                        {/* Mostrar información de seguimiento si está disponible */}
                        {activity.tracking && (
                          <Grid item xs={12}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                                <strong>Información de Seguimiento:</strong><br/>
                                • Período actual: {activity.tracking.currentPeriod}<br/>
                                • Meta recomendada: {activity.tracking.recommendedTargetValue}<br/>
                                • Último valor: {activity.tracking.suggestedCurrentValue}<br/>
                                {activity.tracking.hasRecentReport && (
                                  <>                                • Último informe: {new Date(activity.tracking.lastReportDate).toLocaleDateString()}</>
                                )}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}
                        
                        {/* Mostrar indicadores asociados */}
                        {activity.indicators && activity.indicators.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 2 }}>
                              Indicadores Asociados:
                            </Typography>
                            <Grid container spacing={2}>
                              {activity.indicators.map((indicator) => (
                                <Grid item xs={12} key={indicator.id}>
                                  <Card variant="outlined" sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography variant="subtitle2">{indicator.name}</Typography>
                                      <Chip 
                                        label={indicator.type}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                      {indicator.description}
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">
                                          <strong>Meta Anual:</strong> {indicator.annualTarget} {indicator.measurementUnit}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={6}>
                                        <Typography variant="body2">
                                          <strong>Valor Actual:</strong> {indicator.currentValue || 0} {indicator.measurementUnit}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                    
                                    <Box sx={{ mt: 2 }}>
                                      <Typography variant="body2" sx={{ mb: 1 }}>
                                        Metas Trimestrales:
                                      </Typography>
                                      <Stack direction="row" spacing={1}>
                                        <Chip label={`Q1: ${indicator.q1Target || 0}`} size="small" variant="outlined" />
                                        <Chip label={`Q2: ${indicator.q2Target || 0}`} size="small" variant="outlined" />
                                        <Chip label={`Q3: ${indicator.q3Target || 0}`} size="small" variant="outlined" />
                                        <Chip label={`Q4: ${indicator.q4Target || 0}`} size="small" variant="outlined" />
                                      </Stack>
                                    </Box>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </Grid>
                        )}
                        
                        {(!activity.indicators || activity.indicators.length === 0) && (
                          <Grid item xs={12}>
                            <Alert severity="warning">
                              Esta actividad no tiene indicadores asociados. Para crear informes de avances, 
                              primero debe configurar indicadores desde el módulo de planificación.
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Paper>
          </Grid>

          {/* Indicadores Independientes */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ChartIcon sx={{ mr: 1 }} />
                Indicadores Independientes ({assignments.directIndicators.length})
              </Typography>
              
              {assignments.directIndicators.length === 0 ? (
                <Alert severity="info">No tienes indicadores independientes asignados</Alert>
              ) : (
                assignments.directIndicators.map((indicator) => (
                  <Card key={indicator.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {indicator.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {indicator.description}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenCreateDialog(indicator, 'indicator')}
                        >
                          Reportar
                        </Button>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Meta Anual:</strong> {indicator.annualTarget} {indicator.measurementUnit}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            <strong>Línea Base:</strong> {indicator.baseline} {indicator.measurementUnit}
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Metas Trimestrales:
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={3}>
                            <Chip label={`Q1: ${indicator.q1Target}`} size="small" variant="outlined" />
                          </Grid>
                          <Grid item xs={3}>
                            <Chip label={`Q2: ${indicator.q2Target}`} size="small" variant="outlined" />
                          </Grid>
                          <Grid item xs={3}>
                            <Chip label={`Q3: ${indicator.q3Target}`} size="small" variant="outlined" />
                          </Grid>
                          <Grid item xs={3}>
                            <Chip label={`Q4: ${indicator.q4Target}`} size="small" variant="outlined" />
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Informes de Avances */}
      {tabValue === 1 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Elemento</TableCell>
                  <TableCell>Período</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Reportado por</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No hay informes de avances
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {report.activity?.name || report.indicator?.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {report.activity ? 'Actividad' : 'Indicador'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${report.periodType} ${report.period}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(report.executionPercentage, 100)}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                            color={report.executionPercentage >= 100 ? 'success' : 'primary'}
                          />
                          <Typography variant="body2" sx={{ minWidth: 50 }}>
                            {report.executionPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {report.currentValue} / {report.targetValue}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1, fontSize: '0.8rem' }}>
                            {report.reportedBy.firstName.charAt(0)}{report.reportedBy.lastName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">
                              {report.reportedBy.firstName} {report.reportedBy.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {report.reportedBy.department?.name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={getStatusIcon(report.status)}
                          label={getStatusLabel(report.status)}
                          color={getStatusColor(report.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewReport(report)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {canEditReport(report) && (
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => {/* TODO: Implementar edición */}}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canReviewReport(report) && (
                            <Tooltip title="Revisar">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReviewDialog(report)}
                                color="primary"
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Dialog para crear reporte */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Nuevo Informe de Avances - {selectedAssignment?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Período</InputLabel>
                  <Select
                    name="periodType"
                    value={formData.periodType}
                    label="Tipo de Período"
                    disabled={true}
                    sx={{ 
                      backgroundColor: '#f5f5f5',
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#666'
                      }
                    }}
                  >
                    <MenuItem value="trimestral">Trimestral</MenuItem>
                    <MenuItem value="mensual">Mensual</MenuItem>
                  </Select>
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      * Tipo determinado automáticamente por el indicador
                    </Typography>
                  </Box>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    name="period"
                    value={formData.period}
                    label="Período"
                    onChange={handleInputChange}
                  >
                    {getPeriodOptions(formData.periodType).map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="currentValue"
                  label="Valor Actual"
                  type="number"
                  fullWidth
                  value={formData.currentValue}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="targetValue"
                  label="Meta"
                  type="number"
                  fullWidth
                  value={formData.targetValue}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  name="executionPercentage"
                  label="% Ejecución"
                  type="number"
                  fullWidth
                  value={formData.executionPercentage}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.01, readOnly: true }}
                  helperText="Se calcula automáticamente"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="qualitativeComments"
                  label="Comentarios Cualitativos"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.qualitativeComments}
                  onChange={handleInputChange}
                  placeholder="Describe los logros, actividades realizadas y aspectos cualitativos del avance"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="challenges"
                  label="Desafíos y Dificultades"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.challenges}
                  onChange={handleInputChange}
                  placeholder="Describe los principales desafíos enfrentados"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="nextSteps"
                  label="Próximos Pasos"
                  multiline
                  rows={3}
                  fullWidth
                  value={formData.nextSteps}
                  onChange={handleInputChange}
                  placeholder="Describe las actividades planificadas para el siguiente período"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                    >
                      Adjuntar Archivos de Evidencia
                    </Button>
                  </label>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    PDF, Word, Excel, Imágenes (máx. 10MB cada uno)
                  </Typography>
                  {selectedFiles.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="medium">
                        Archivos seleccionados:
                      </Typography>
                      {selectedFiles.map((file, index) => (
                        <Chip
                          key={index}
                          label={file.name}
                          onDelete={() => {
                            setSelectedFiles(files => files.filter((_, i) => i !== index));
                          }}
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancelar</Button>
          <Button onClick={handleSubmitReport} variant="contained">
            Crear Informe
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver reporte */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles del Informe - {selectedReport?.activity?.name || selectedReport?.indicator?.name}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Período</Typography>
                  <Typography variant="body1">{selectedReport.periodType} {selectedReport.period}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary">Estado</Typography>
                  <Chip
                    icon={getStatusIcon(selectedReport.status)}
                    label={getStatusLabel(selectedReport.status)}
                    color={getStatusColor(selectedReport.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Valor Actual</Typography>
                  <Typography variant="h6">{selectedReport.currentValue}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">Meta</Typography>
                  <Typography variant="h6">{selectedReport.targetValue}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="textSecondary">% Ejecución</Typography>
                  <Typography variant="h6" color={selectedReport.executionPercentage >= 100 ? 'success.main' : 'primary.main'}>
                    {selectedReport.executionPercentage.toFixed(1)}%
                  </Typography>
                </Grid>
                
                {selectedReport.qualitativeComments && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Comentarios Cualitativos</Typography>
                    <Typography variant="body1">{selectedReport.qualitativeComments}</Typography>
                  </Grid>
                )}
                
                {selectedReport.challenges && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Desafíos</Typography>
                    <Typography variant="body1">{selectedReport.challenges}</Typography>
                  </Grid>
                )}
                
                {selectedReport.nextSteps && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>Próximos Pasos</Typography>
                    <Typography variant="body1">{selectedReport.nextSteps}</Typography>
                  </Grid>
                )}
                
                {selectedReport.reviewComments && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="textSecondary" gutterBottom>Comentarios de Revisión</Typography>
                    <Typography variant="body1">{selectedReport.reviewComments}</Typography>
                  </Grid>
                )}
                
                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="textSecondary" gutterBottom>Archivos Adjuntos</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {selectedReport.attachments.map((attachment) => (
                        <Chip
                          key={attachment.id}
                          icon={<AttachIcon />}
                          label={attachment.filename}
                          onClick={() => {
                            // TODO: Implementar descarga
                            window.open(`/api/progress-reports/download/${attachment.id}`, '_blank');
                          }}
                          clickable
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para revisar reporte */}
      <Dialog open={openReviewDialog} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Revisar Informe - {selectedReport?.activity?.name || selectedReport?.indicator?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Decisión</InputLabel>
              <Select
                value={reviewData.action}
                label="Decisión"
                onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
              >
                <MenuItem value="aprobar">Aprobar</MenuItem>
                <MenuItem value="rechazar">Rechazar</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Comentarios de Revisión"
              multiline
              rows={4}
              fullWidth
              value={reviewData.reviewComments}
              onChange={(e) => setReviewData(prev => ({ ...prev, reviewComments: e.target.value }))}
              placeholder="Agregue comentarios sobre la revisión del informe"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmitReview} 
            variant="contained"
            color={reviewData.action === 'aprobar' ? 'success' : 'error'}
          >
            {reviewData.action === 'aprobar' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProgressTracking;
