import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  LinearProgress,
  CircularProgress,
  Alert,
  Tooltip,
  Fab,
  Paper,
  Stack,
  Avatar,
  Badge,
  Divider,
  CardHeader,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  AssignmentTurnedIn as TaskIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const statusColors = {
  NOT_STARTED: 'default',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error'
};

const statusLabels = {
  NOT_STARTED: 'No Iniciado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado'
};

const statusIcons = {
  NOT_STARTED: <ScheduleIcon />,
  IN_PROGRESS: <StartIcon />,
  COMPLETED: <CompleteIcon />,
  CANCELLED: <CancelIcon />
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ActivityManagementEnhanced = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit, assign, progress
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    productId: '',
    status: '',
    responsibleId: '',
    search: ''
  });

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '', // Agregar campo código
    productId: '',
    startDate: null,
    endDate: null,
    estimatedHours: '',
    priority: 'MEDIUM',
    isActive: true
  });

  // Assignment form data
  const [assignmentData, setAssignmentData] = useState({
    userId: '',
    role: 'RESPONSIBLE',
    estimatedHours: '',
    startDate: null,
    endDate: null
  });

  // Progress form data
  const [progressData, setProgressData] = useState({
    status: 'NOT_STARTED',
    progress: 0,
    comments: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      const params = new URLSearchParams();
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.status) params.append('status', filters.status);
      if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
      if (filters.search) params.append('search', filters.search);

      const [activitiesData, productsData, usersData] = await Promise.all([
        api.get(`/activities?${params.toString()}`),
        api.get('/products'),
        api.get('/users')
      ]);

      // Asegurar que los datos sean arrays válidos
      const activities = Array.isArray(activitiesData.data) ? activitiesData.data : 
                        Array.isArray(activitiesData) ? activitiesData : [];
      const products = Array.isArray(productsData.data) ? productsData.data : 
                      Array.isArray(productsData) ? productsData : [];
      const users = Array.isArray(usersData.data) ? usersData.data : 
                   Array.isArray(usersData) ? usersData : [];

      setActivities(activities);
      setProducts(products);
      setUsers(users);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Error al cargar los datos');
      // En caso de error, asegurar que los estados sean arrays vacíos
      setActivities([]);
      setProducts([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, activity = null, assignment = null) => {
    setDialogMode(mode);
    setSelectedActivity(activity);
    setSelectedAssignment(assignment);
    
    if (mode === 'edit' && activity) {
      setFormData({
        name: activity.name || '',
        description: activity.description || '',
        productId: activity.productId || '',
        startDate: activity.startDate ? new Date(activity.startDate) : null,
        endDate: activity.endDate ? new Date(activity.endDate) : null,
        estimatedHours: activity.estimatedHours || '',
        priority: activity.priority || 'MEDIUM',
        isActive: activity.isActive !== false
      });
    } else if (mode === 'assign' && activity) {
      setAssignmentData({
        userId: '',
        role: 'RESPONSIBLE',
        estimatedHours: '',
        startDate: activity.startDate ? new Date(activity.startDate) : null,
        endDate: activity.endDate ? new Date(activity.endDate) : null
      });
    } else if (mode === 'progress' && assignment) {
      setProgressData({
        status: assignment.status || 'NOT_STARTED',
        progress: assignment.progress || 0,
        comments: assignment.comments || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        productId: '',
        startDate: null,
        endDate: null,
        estimatedHours: '',
        priority: 'MEDIUM',
        isActive: true
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActivity(null);
    setSelectedAssignment(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      
      if (dialogMode === 'create' || dialogMode === 'edit') {
        const data = {
          ...formData,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null
        };

        if (dialogMode === 'create') {
          await api.post('/activities', data);
          setSuccess('Actividad creada exitosamente');
        } else {
          await api.put(`/activities/${selectedActivity.id}`, data);
          setSuccess('Actividad actualizada exitosamente');
        }
      } else if (dialogMode === 'assign') {
        const data = {
          ...assignmentData,
          startDate: assignmentData.startDate?.toISOString(),
          endDate: assignmentData.endDate?.toISOString(),
          estimatedHours: assignmentData.estimatedHours ? parseInt(assignmentData.estimatedHours) : null
        };

        await api.post(`/activities/${selectedActivity.id}/assign`, data);
        setSuccess('Usuario asignado exitosamente');
      } else if (dialogMode === 'progress') {
        await api.put(`/activities/${selectedActivity.id}/assignments/${selectedAssignment.id}/status`, progressData);
        setSuccess('Progreso actualizado exitosamente');
      }

      await loadData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta actividad?')) {
      try {
        await api.delete(`/activities/${activityId}`);
        setSuccess('Actividad eliminada exitosamente');
        await loadData();
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Error al eliminar la actividad');
      }
    }
  };

  const handleRemoveAssignment = async (activityId, assignmentId) => {
    if (window.confirm('¿Está seguro de que desea remover esta asignación?')) {
      try {
        await api.delete(`/activities/${activityId}/assignments/${assignmentId}`);
        setSuccess('Asignación removida exitosamente');
        await loadData();
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Error al remover la asignación');
      }
    }
  };

  const getActivityProgress = (activity) => {
    if (!activity.assignments || activity.assignments.length === 0) return 0;
    
    const totalProgress = activity.assignments.reduce((sum, assignment) => {
      return sum + (assignment.progress || 0);
    }, 0);
    
    return Math.round(totalProgress / activity.assignments.length);
  };

  const getActivityStatus = (activity) => {
    if (!activity.assignments || activity.assignments.length === 0) return 'NOT_STARTED';
    
    const statuses = activity.assignments.map(a => a.status);
    
    if (statuses.every(s => s === 'COMPLETED')) return 'COMPLETED';
    if (statuses.some(s => s === 'IN_PROGRESS')) return 'IN_PROGRESS';
    if (statuses.some(s => s === 'CANCELLED')) return 'CANCELLED';
    
    return 'NOT_STARTED';
  };

  const renderActivitiesList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Actividad</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>Asignados</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Progreso</TableCell>
            <TableCell>Fechas</TableCell>
            <TableCell>Indicadores</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {activities.map((activity) => {
            const progress = getActivityProgress(activity);
            const status = getActivityStatus(activity);
            
            return (
              <TableRow key={activity.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {activity.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activity.code}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.product?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.product?.code} • {activity.product?.type === 'PRODUCT' ? '📦 Producto' : '🔧 Servicio'}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Badge badgeContent={activity._count?.assignments || 0} color="primary">
                      <GroupIcon />
                    </Badge>
                    {activity.assignments?.slice(0, 3).map((assignment) => (
                      <Tooltip key={assignment.id} title={`${assignment.user.firstName} ${assignment.user.lastName}`}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {assignment.user.firstName[0]}{assignment.user.lastName[0]}
                        </Avatar>
                      </Tooltip>
                    ))}
                    {activity.assignments?.length > 3 && (
                      <Typography variant="caption">+{activity.assignments.length - 3}</Typography>
                    )}
                  </Stack>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={statusIcons[status]}
                    label={statusLabels[status]}
                    color={statusColors[status]}
                    size="small"
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ width: 100 }}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      color={progress === 100 ? 'success' : 'primary'}
                    />
                    <Typography variant="caption">{progress}%</Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2">
                    {activity.startDate && format(new Date(activity.startDate), 'dd/MM/yyyy')}
                    {activity.startDate && activity.endDate && ' - '}
                    {activity.endDate && format(new Date(activity.endDate), 'dd/MM/yyyy')}
                  </Typography>
                </TableCell>
                
                <TableCell>
                  <Chip
                    icon={<AnalyticsIcon />}
                    label={activity._count?.indicators || 0}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Asignar Usuario">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('assign', activity)}
                      >
                        <PersonIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', activity)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(activity.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderAssignmentsList = () => (
    <Grid container spacing={3}>
      {activities.map((activity) => (
        activity.assignments?.length > 0 && (
          <Grid item xs={12} md={6} lg={4} key={activity.id}>
            <Card>
              <CardHeader
                title={
                  <Typography variant="h6" noWrap>
                    {activity.name}
                  </Typography>
                }
                subheader={activity.code}
                action={
                  <Chip
                    label={`${activity._count?.assignments || 0} asignados`}
                    size="small"
                  />
                }
              />
              <CardContent>
                <List dense>
                  {activity.assignments.map((assignment) => (
                    <ListItem key={assignment.id}>
                      <ListItemAvatar>
                        <Avatar>
                          {assignment.user.firstName[0]}{assignment.user.lastName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={`${assignment.user.firstName} ${assignment.user.lastName}`}
                        secondary={
                          `${statusLabels[assignment.status]}${assignment.progress > 0 ? ` • Progreso: ${assignment.progress}%` : ''}`
                        }
                      />
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mr: 6 }}>
                        <Chip
                          label={statusLabels[assignment.status]}
                          color={statusColors[assignment.status]}
                          size="small"
                        />
                      </Box>
                      
                      <ListItemSecondaryAction>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Actualizar Progreso">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog('progress', activity, assignment)}
                            >
                              <TrendingUpIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Remover Asignación">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveAssignment(activity.id, assignment.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )
      ))}
    </Grid>
  );

  const renderDialog = () => {
    let title, content;
    
    switch (dialogMode) {
      case 'create':
        title = 'Crear Nueva Actividad';
        content = (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Actividad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Producto/Servicio</InputLabel>
                <Select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Baja</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                  <MenuItem value="URGENT">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Fin"
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horas Estimadas"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </Grid>
          </Grid>
        );
        break;
        
      case 'edit':
        title = 'Editar Actividad';
        content = (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Actividad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Producto/Servicio</InputLabel>
                <Select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Baja</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                  <MenuItem value="URGENT">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={formData.startDate}
                  onChange={(date) => setFormData({ ...formData, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Fin"
                  value={formData.endDate}
                  onChange={(date) => setFormData({ ...formData, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horas Estimadas"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              />
            </Grid>
          </Grid>
        );
        break;
        
      case 'assign':
        title = 'Asignar Usuario a Actividad';
        content = (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {selectedActivity?.name}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                options={Array.isArray(users) ? users : []}
                getOptionLabel={(user) => `${user.firstName} ${user.lastName} (${user.email})`}
                value={Array.isArray(users) ? (users.find(u => u.id === assignmentData.userId) || null) : null}
                onChange={(event, newValue) => {
                  setAssignmentData({ ...assignmentData, userId: newValue?.id || '' });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Seleccionar Usuario" required />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Rol en la Actividad</InputLabel>
                <Select
                  value={assignmentData.role}
                  onChange={(e) => setAssignmentData({ ...assignmentData, role: e.target.value })}
                >
                  <MenuItem value="RESPONSIBLE">Responsable</MenuItem>
                  <MenuItem value="COLLABORATOR">Colaborador</MenuItem>
                  <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Horas Estimadas"
                type="number"
                value={assignmentData.estimatedHours}
                onChange={(e) => setAssignmentData({ ...assignmentData, estimatedHours: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Inicio"
                  value={assignmentData.startDate}
                  onChange={(date) => setAssignmentData({ ...assignmentData, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha de Fin"
                  value={assignmentData.endDate}
                  onChange={(date) => setAssignmentData({ ...assignmentData, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        );
        break;
        
      case 'progress':
        title = 'Actualizar Progreso';
        content = (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {selectedActivity?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Usuario: {selectedAssignment?.user.firstName} {selectedAssignment?.user.lastName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={progressData.status}
                  onChange={(e) => setProgressData({ ...progressData, status: e.target.value })}
                >
                  <MenuItem value="NOT_STARTED">No Iniciado</MenuItem>
                  <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                  <MenuItem value="COMPLETED">Completado</MenuItem>
                  <MenuItem value="CANCELLED">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Progreso: {progressData.progress}%
              </Typography>
              <Slider
                value={progressData.progress}
                onChange={(e, value) => setProgressData({ ...progressData, progress: value })}
                min={0}
                max={100}
                step={5}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 25, label: '25%' },
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentarios"
                multiline
                rows={3}
                value={progressData.comments}
                onChange={(e) => setProgressData({ ...progressData, comments: e.target.value })}
                placeholder="Describe el progreso, obstáculos o logros..."
              />
            </Grid>
          </Grid>
        );
        break;
        
      default:
        title = '';
        content = null;
    }
    
    return (
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {title}
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          {content}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
          Gestión de Actividades
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure y administre las actividades del Plan Operativo Anual
        </Typography>
      </Box>

      {/* Barra de herramientas */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Nueva Actividad
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Producto/Servicio</InputLabel>
                <Select
                  value={filters.productId}
                  onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <Typography>Todos los productos</Typography>
                  </MenuItem>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      <Box sx={{ py: 0.5 }}>
                        <Typography variant="body2" component="div">
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" component="div">
                          {product.code} • {product.type === 'PRODUCT' ? '📦' : '🔧'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="NOT_STARTED">No Iniciado</MenuItem>
                  <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                  <MenuItem value="COMPLETED">Completado</MenuItem>
                  <MenuItem value="CANCELLED">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={Array.isArray(users) ? users : []}
                getOptionLabel={(user) => `${user.firstName} ${user.lastName}`}
                value={Array.isArray(users) ? (users.find(u => u.id === filters.responsibleId) || null) : null}
                onChange={(event, newValue) => {
                  setFilters({ ...filters, responsibleId: newValue?.id || '' });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Responsable" />
                )}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nombre de actividad..."
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab
            label="Lista de Actividades"
            icon={<TaskIcon />}
            iconPosition="start"
          />
          <Tab
            label="Asignaciones"
            icon={<GroupIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderActivitiesList()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderAssignmentsList()}
      </TabPanel>

      {/* Dialog */}
      {renderDialog()}

      {/* FAB para crear nueva actividad - Solo móviles */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => handleOpenDialog('create')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ActivityManagementEnhanced;
