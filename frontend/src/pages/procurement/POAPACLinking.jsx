import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Autocomplete,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const POAPACLinking = () => {
  const { hasPermission, user } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [activities, setActivities] = useState([]);
  const [procurementProcesses, setProcurementProcesses] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    departmentId: '',
    activityId: '',
    procurementProcessId: ''
  });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityAlerts, setActivityAlerts] = useState(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    activityId: '',
    procurementProcessId: '',
    linkReason: '',
    isEssential: true
  });

  useEffect(() => {
    loadData();
    loadActivities();
    loadProcurementProcesses();
  }, [pagination.page, pagination.rowsPerPage, filters]);

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page + 1,
        limit: pagination.rowsPerPage
      });

      // Agregar filtros si están definidos
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await httpClient.get(`/activity-procurement-links?${params.toString()}`);
      
      if (response.success) {
        setLinks(response.data.links);
        setStats(response.data.stats);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error cargando vinculaciones:', error);
      showAlert('Error al cargar vinculaciones POA-PAC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await httpClient.get('/activities?includeHierarchy=true');
      const data = response.data || response;
      setActivities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando actividades:', error);
    }
  };

  const loadProcurementProcesses = async () => {
    try {
      const response = await httpClient.get('/procurement-processes?status=PLANIFICADO&status=EN_PROCESO');
      if (response.success) {
        setProcurementProcesses(response.data.processes || []);
      }
    } catch (error) {
      console.error('Error cargando procesos de compra:', error);
    }
  };

  const loadActivityAlerts = async (activityId) => {
    try {
      setLoadingAlerts(true);
      const response = await httpClient.get(`/activity-procurement-links/activity/${activityId}/alerts`);
      if (response.success) {
        setActivityAlerts(response.data);
      }
    } catch (error) {
      console.error('Error cargando alertas:', error);
      showAlert('Error al cargar alertas de la actividad', 'error');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleOpenDialog = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        activityId: link.activityId,
        procurementProcessId: link.procurementProcessId,
        linkReason: link.linkReason || '',
        isEssential: link.isEssential
      });
    } else {
      setEditingLink(null);
      setFormData({
        activityId: '',
        procurementProcessId: '',
        linkReason: '',
        isEssential: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLink(null);
    setSelectedActivity(null);
    setActivityAlerts(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Si se selecciona una actividad, cargar sus alertas
    if (field === 'activityId' && value) {
      const activity = activities.find(a => a.id === value);
      setSelectedActivity(activity);
      loadActivityAlerts(value);
    }
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!formData.activityId) {
        showAlert('Debe seleccionar una actividad', 'error');
        return;
      }

      if (!formData.procurementProcessId) {
        showAlert('Debe seleccionar un proceso de compra', 'error');
        return;
      }

      let response;
      if (editingLink) {
        response = await httpClient.put(`/activity-procurement-links/${editingLink.id}`, formData);
      } else {
        response = await httpClient.post('/activity-procurement-links', formData);
      }

      if (response.success) {
        showAlert(response.message || (editingLink ? 'Vinculación actualizada exitosamente' : 'Vinculación creada exitosamente'), 'success');
        
        // Mostrar alerta de inconsistencia si existe
        if (response.alert) {
          setTimeout(() => {
            showAlert(response.alert.message, 'warning');
          }, 2000);
        }

        handleCloseDialog();
        loadData();
      }
    } catch (error) {
      console.error('Error guardando vinculación:', error);
      const message = error.response?.data?.message || 'Error al guardar vinculación';
      showAlert(message, 'error');
    }
  };

  const handleDelete = async (link) => {
    if (!window.confirm(`¿Está seguro de eliminar la vinculación entre "${link.activity.name}" y "${link.procurementProcess.description}"?`)) {
      return;
    }

    try {
      const response = await httpClient.delete(`/activity-procurement-links/${link.id}`);
      if (response.success) {
        showAlert(response.message || 'Vinculación eliminada exitosamente', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error eliminando vinculación:', error);
      const message = error.response?.data?.message || 'Error al eliminar vinculación';
      showAlert(message, 'error');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const getActivityLabel = (activity) => {
    if (!activity) return 'Actividad no encontrada';
    const objective = activity.product?.objective;
    const strategicAxis = objective?.strategicAxis;
    return `${strategicAxis?.code || ''}.${objective?.code || ''}.${activity.product?.code || ''}.${activity.code} - ${activity.name}`;
  };

  const getProcurementLabel = (process) => {
    if (!process) return 'Proceso no encontrado';
    return `${process.cuciCode} - ${process.description} (RD$${parseFloat(process.totalCost).toLocaleString()})`;
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LinkIcon sx={{ mr: 2 }} />
            Vinculación POA-PAC
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de vínculos entre actividades del POA y procesos de compra del PAC
          </Typography>
        </Box>
        {hasPermission('create', 'activity_procurement_link') && (
          <Fab
            variant="extended"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nueva Vinculación
          </Fab>
        )}
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LinkIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Vínculos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalLinks || 0}
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
                <CheckCircleIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Esenciales
                  </Typography>
                  <Typography variant="h4">
                    {stats.essentialLinks || 0}
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
                <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    No Esenciales
                  </Typography>
                  <Typography variant="h4">
                    {stats.nonEssentialLinks || 0}
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
                <BusinessIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Departamentos
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(stats.byDepartment || {}).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de vinculaciones */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Actividad POA</TableCell>
                <TableCell>Proceso de Compra</TableCell>
                <TableCell align="center">Tipo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Estado Proceso</TableCell>
                <TableCell align="center">Vinculado por</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {link.activity?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {link.activity?.product?.objective?.strategicAxis?.code || ''}.
                      {link.activity?.product?.objective?.code || ''}.
                      {link.activity?.product?.code || ''}.
                      {link.activity?.code || ''}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {link.procurementProcess?.description || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {link.procurementProcess?.cuciCode || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={link.isEssential ? 'Esencial' : 'No Esencial'}
                      color={link.isEssential ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      RD${parseFloat(link.procurementProcess?.totalCost || 0).toLocaleString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={link.procurementProcess?.status || 'N/A'}
                      color={
                        link.procurementProcess?.status === 'ADJUDICADO' ? 'success' :
                        link.procurementProcess?.status === 'EN_PROCESO' ? 'primary' :
                        link.procurementProcess?.status === 'CANCELADO' ? 'error' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="caption">
                      {link.linkedBy?.firstName} {link.linkedBy?.lastName}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {hasPermission('update', 'activity_procurement_link') && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(link)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {hasPermission('delete', 'activity_procurement_link') && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(link)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              
              {links.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay vinculaciones POA-PAC registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.rowsPerPage}
          page={pagination.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo de formulario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingLink ? 'Editar Vinculación POA-PAC' : 'Nueva Vinculación POA-PAC'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={activities}
                  getOptionLabel={getActivityLabel}
                  value={activities.find(a => a.id === formData.activityId) || null}
                  onChange={(event, newValue) => handleInputChange('activityId', newValue?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Actividad del POA"
                      required
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getActivityLabel(option)}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={procurementProcesses}
                  getOptionLabel={getProcurementLabel}
                  value={procurementProcesses.find(p => p.id === formData.procurementProcessId) || null}
                  onChange={(event, newValue) => handleInputChange('procurementProcessId', newValue?.id || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Proceso de Compra"
                      required
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2">
                          {option.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.cuciCode} - RD${parseFloat(option.totalCost).toLocaleString()} - {option.status}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Razón de la Vinculación"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.linkReason}
                  onChange={(e) => handleInputChange('linkReason', e.target.value)}
                  placeholder="Explique por qué este proceso de compra es necesario para la actividad..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isEssential}
                      onChange={(e) => handleInputChange('isEssential', e.target.checked)}
                    />
                  }
                  label="Es esencial para la actividad"
                />
              </Grid>

              {/* Alertas de consistencia presupuestaria */}
              {activityAlerts && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Análisis de Consistencia Presupuestaria
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Presupuesto Actividad
                          </Typography>
                          <Typography variant="h6">
                            RD${activityAlerts.activityBudget?.toLocaleString() || '0'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Costo Total Procesos
                          </Typography>
                          <Typography variant="h6">
                            RD${activityAlerts.totalProcurementCost?.toLocaleString() || '0'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            Consistencia
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {activityAlerts.budgetConsistency ? (
                              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                            ) : (
                              <ErrorIcon color="error" sx={{ mr: 1 }} />
                            )}
                            <Typography variant="h6">
                              {activityAlerts.budgetConsistency ? 'Consistente' : 'Inconsistente'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {activityAlerts.alerts && activityAlerts.alerts.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Alertas Detectadas
                      </Typography>
                      <List>
                        {activityAlerts.alerts.map((alert, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <WarningIcon color={getAlertSeverityColor(alert.severity)} />
                            </ListItemIcon>
                            <ListItemText
                              primary={alert.message}
                              secondary={`Severidad: ${alert.severity}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Grid>
              )}

              {loadingAlerts && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                    <Typography sx={{ ml: 2 }}>Cargando análisis de consistencia...</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained">
            {editingLink ? 'Actualizar' : 'Crear Vinculación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para alertas */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POAPACLinking;
