import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Fab,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  AvatarGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const ActivityManagement = () => {
  const { user, token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // Assignment dialog
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [selectedActivityForAssignment, setSelectedActivityForAssignment] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    productId: '',
    responsibleId: '',
    isActive: true,
    search: ''
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    productId: '',
    startDate: null,
    endDate: null,
    order: 0,
    isActive: true
  });

  // Assignment form
  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    isMain: false
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withAssignments: 0,
    withIndicators: 0
  });

  const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Agregar interceptor para debugging
  apiClient.interceptors.response.use(
    (response) => {
      if (response.config.url?.includes('/users')) {
        console.log(`✅ Usuarios cargados: ${response.data.users?.length || 0}`);
      }
      return response;
    },
    (error) => {
      if (error.config?.url?.includes('/users')) {
        console.error(`❌ Error cargando usuarios:`, error.response?.data);
      }
      return Promise.reject(error);
    }
  );

  // Load data
  useEffect(() => {
    console.log('🚀 ActivityManagement: Iniciando carga de datos...');
    loadActivities();
    loadProducts();
    loadUsers();
  }, [filters]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de filtro
      const params = new URLSearchParams();
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== null) params.append('isActive', filters.isActive);

      const response = await apiClient.get(`/activities?${params.toString()}`);
      setActivities(response.data.data || []); // Cambio aquí: usar response.data.data
      
      // Calcular estadísticas
      const total = response.data.data?.length || 0;
      const active = response.data.data?.filter(a => a.isActive).length || 0;
      const withAssignments = response.data.data?.filter(a => a.assignments?.length > 0).length || 0;
      const withIndicators = response.data.data?.filter(a => a._count?.indicators > 0).length || 0;

      setStats({
        total,
        active,
        withAssignments,
        withIndicators
      });

    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setError('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get('/products?isActive=true');
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Cargando usuarios...');
      const response = await apiClient.get('/users?isActive=true');
      console.log('📊 Respuesta de usuarios:', response.data);
      console.log('👥 Total de usuarios encontrados:', response.data.users?.length || 0);
      
      setUsers(response.data.users || []);
      
      if (response.data.users?.length > 0) {
        console.log('✅ Usuarios cargados exitosamente:', response.data.users.map(u => `${u.firstName} ${u.lastName}`));
      } else {
        console.log('⚠️ No se encontraron usuarios');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      setError('Error al cargar la lista de usuarios');
    }
  };

  const handleOpenDialog = (mode, activity = null) => {
    setDialogMode(mode);
    setSelectedActivity(activity);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        code: '',
        productId: '',
        startDate: null,
        endDate: null,
        order: 0,
        isActive: true
      });
    } else if (mode === 'edit' && activity) {
      setFormData({
        name: activity.name,
        description: activity.description || '',
        code: activity.code,
        productId: activity.productId,
        startDate: activity.startDate ? new Date(activity.startDate) : null,
        endDate: activity.endDate ? new Date(activity.endDate) : null,
        order: activity.order || 0,
        isActive: activity.isActive
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActivity(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        order: parseInt(formData.order) || 0
      };

      if (dialogMode === 'create') {
        await apiClient.post('/activities', submitData);
        setSuccess('Actividad creada exitosamente');
      } else if (dialogMode === 'edit') {
        await apiClient.put(`/activities/${selectedActivity.id}`, submitData);
        setSuccess('Actividad actualizada exitosamente');
      }

      handleCloseDialog();
      loadActivities();
      
    } catch (error) {
      console.error('Error al guardar actividad:', error);
      setError(error.response?.data?.message || 'Error al guardar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activity) => {
    if (!window.confirm(`¿Está seguro de eliminar la actividad "${activity.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.delete(`/activities/${activity.id}`);
      setSuccess('Actividad eliminada exitosamente');
      loadActivities();
    } catch (error) {
      console.error('Error al eliminar actividad:', error);
      setError(error.response?.data?.message || 'Error al eliminar la actividad');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignmentDialog = (activity) => {
    console.log('🎯 Abriendo diálogo de asignación...');
    console.log('📋 Actividad seleccionada:', activity.name);
    console.log('👥 Estado actual de usuarios:', users);
    console.log('📊 Total usuarios disponibles:', users.length);
    console.log('🔗 Asignaciones actuales de la actividad:', activity.assignments);
    
    setSelectedActivityForAssignment(activity);
    setAssignmentData({
      userId: '',
      isMain: false
    });
    setOpenAssignmentDialog(true);
  };

  const handleAssignUser = async () => {
    try {
      setLoading(true);
      
      await apiClient.post(`/activities/${selectedActivityForAssignment.id}/assign`, assignmentData);
      setSuccess('Usuario asignado exitosamente');
      setOpenAssignmentDialog(false);
      loadActivities();
      
    } catch (error) {
      console.error('Error al asignar usuario:', error);
      setError(error.response?.data?.message || 'Error al asignar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (activityId, userId) => {
    if (!window.confirm('¿Está seguro de quitar esta asignación?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.delete(`/activities/${activityId}/assignments/${userId}`);
      setSuccess('Asignación removida exitosamente');
      loadActivities();
    } catch (error) {
      console.error('Error al remover asignación:', error);
      setError(error.response?.data?.message || 'Error al remover la asignación');
    } finally {
      setLoading(false);
    }
  };

  const getProductDisplay = (activity) => {
    if (activity.product) {
      return `${activity.product.code} - ${activity.product.name}`;
    }
    return 'Sin producto asignado';
  };

  const getDateDisplay = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const getStatusColor = (activity) => {
    if (!activity.isActive) return 'default';
    
    const now = new Date();
    const startDate = activity.startDate ? new Date(activity.startDate) : null;
    const endDate = activity.endDate ? new Date(activity.endDate) : null;
    
    if (startDate && now < startDate) return 'info'; // Pendiente
    if (endDate && now > endDate) return 'error'; // Atrasada
    if (startDate && endDate && now >= startDate && now <= endDate) return 'success'; // En progreso
    
    return 'warning'; // Sin fechas definidas
  };

  const getStatusText = (activity) => {
    if (!activity.isActive) return 'Inactiva';
    
    const now = new Date();
    const startDate = activity.startDate ? new Date(activity.startDate) : null;
    const endDate = activity.endDate ? new Date(activity.endDate) : null;
    
    if (startDate && now < startDate) return 'Pendiente';
    if (endDate && now > endDate) return 'Atrasada';
    if (startDate && endDate && now >= startDate && now <= endDate) return 'En Progreso';
    
    return 'Sin Fechas';
  };

  if (loading && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box>
        <Box mb={3}>
          <Typography variant="h4" gutterBottom display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 2 }} />
            Gestión de Actividades
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure y gestione las actividades específicas del POA
          </Typography>
        </Box>

        {/* Alertas */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Estadísticas */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Actividades
                </Typography>
                <Typography variant="h4">
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Activas
                </Typography>
                <Typography variant="h4" color="success.main">
                  {stats.active}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Con Asignaciones
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {stats.withAssignments}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Con Indicadores
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {stats.withIndicators}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography>Filtros de Búsqueda</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Buscar"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Nombre, código o descripción..."
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={filters.productId}
                    onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                    label="Producto"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={filters.isActive}
                      onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
                    />
                  }
                  label="Solo activas"
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Tabla de actividades */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Actividad</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Fechas</TableCell>
                  <TableCell>Responsables</TableCell>
                  <TableCell>Indicadores</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{activity.code}</Typography>
                      <Typography variant="body2" fontWeight="bold">{activity.name}</Typography>
                      {activity.description && (
                        <Typography variant="body2" color="text.secondary">
                          {activity.description.length > 60 
                            ? `${activity.description.substring(0, 60)}...` 
                            : activity.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getProductDisplay(activity)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          <strong>Inicio:</strong> {getDateDisplay(activity.startDate)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Fin:</strong> {getDateDisplay(activity.endDate)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <AvatarGroup max={3} sx={{ mr: 1 }}>
                          {activity.assignments?.map((assignment) => (
                            <Tooltip 
                              key={assignment.id} 
                              title={`${assignment.user.firstName} ${assignment.user.lastName}${assignment.isMain ? ' (Principal)' : ''}`}
                            >
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {assignment.user.firstName[0]}{assignment.user.lastName[0]}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenAssignmentDialog(activity)}
                        >
                          <PersonIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={activity._count?.indicators || 0}
                        color={activity._count?.indicators > 0 ? 'primary' : 'default'}
                        size="small"
                        icon={<TrendingUpIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(activity)}
                        color={getStatusColor(activity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalles">
                        <IconButton onClick={() => handleOpenDialog('view', activity)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton onClick={() => handleOpenDialog('edit', activity)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton onClick={() => handleDelete(activity)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No se encontraron actividades
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Botón flotante para agregar */}
        <Fab
          color="primary"
          aria-label="agregar actividad"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => handleOpenDialog('create')}
        >
          <AddIcon />
        </Fab>

        {/* Dialog para crear/editar/ver actividad */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {dialogMode === 'create' && 'Crear Nueva Actividad'}
            {dialogMode === 'edit' && 'Editar Actividad'}
            {dialogMode === 'view' && 'Detalles de la Actividad'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Código"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <TextField
                  label="Nombre de la Actividad"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Producto</InputLabel>
                  <Select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    label="Producto"
                    disabled={dialogMode === 'view'}
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Orden"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  fullWidth
                  disabled={dialogMode === 'view'}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  disabled={dialogMode === 'view'}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha de Fin"
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  disabled={dialogMode === 'view'}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              {dialogMode !== 'view' && (
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    }
                    label="Actividad activa"
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              {dialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
            </Button>
            {dialogMode !== 'view' && (
              <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={20} /> : (dialogMode === 'create' ? 'Crear' : 'Actualizar')}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Dialog para asignaciones */}
        <Dialog open={openAssignmentDialog} onClose={() => setOpenAssignmentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Asignar Usuario a Actividad
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Usuario</InputLabel>
                  <Select
                    value={assignmentData.userId}
                    onChange={(e) => setAssignmentData({ ...assignmentData, userId: e.target.value })}
                    label="Usuario"
                  >
                    {(() => {
                      console.log('🔍 Evaluando usuarios para el Select...');
                      console.log('👥 Total usuarios cargados:', users.length);
                      console.log('📋 Actividad seleccionada:', selectedActivityForAssignment?.name);
                      console.log('🔗 Asignaciones de la actividad:', selectedActivityForAssignment?.assignments);
                      
                      const filteredUsers = users.filter(user => {
                        // Si no hay actividad seleccionada, mostrar todos los usuarios
                        if (!selectedActivityForAssignment?.assignments) {
                          console.log(`✅ Usuario ${user.firstName} ${user.lastName} - Sin restricciones de asignación`);
                          return true;
                        }
                        // Filtrar usuarios ya asignados
                        const isAlreadyAssigned = selectedActivityForAssignment.assignments.some(assignment => 
                          assignment.userId === user.id
                        );
                        
                        if (isAlreadyAssigned) {
                          console.log(`❌ Usuario ${user.firstName} ${user.lastName} - Ya está asignado`);
                        } else {
                          console.log(`✅ Usuario ${user.firstName} ${user.lastName} - Disponible para asignar`);
                        }
                        
                        return !isAlreadyAssigned;
                      });
                      
                      console.log('📊 Usuarios filtrados finales:', filteredUsers.length);
                      
                      return filteredUsers.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} - {user.email}
                        </MenuItem>
                      ));
                    })()}
                  </Select>
                </FormControl>
                {users.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No hay usuarios disponibles
                  </Typography>
                )}
                {users.length > 0 && users.filter(user => {
                  if (!selectedActivityForAssignment?.assignments) return true;
                  return !selectedActivityForAssignment.assignments.some(assignment => 
                    assignment.userId === user.id
                  );
                }).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Todos los usuarios ya están asignados a esta actividad
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={assignmentData.isMain}
                      onChange={(e) => setAssignmentData({ ...assignmentData, isMain: e.target.checked })}
                    />
                  }
                  label="Responsable principal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAssignmentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignUser} variant="contained" disabled={loading || !assignmentData.userId}>
              {loading ? <CircularProgress size={20} /> : 'Asignar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ActivityManagement;
