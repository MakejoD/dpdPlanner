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
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const IndicatorManagement = () => {
  const { user, token } = useAuth();
  const [indicators, setIndicators] = useState([]);
  const [levelOptions, setLevelOptions] = useState({
    strategicAxes: [],
    objectives: [],
    products: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Crear cliente API
  const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    type: '',
    level: '',
    levelId: '',
    isActive: true,
    search: ''
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'PRODUCT',
    measurementUnit: '',
    baseline: 0,
    annualTarget: 0,
    reportingFrequency: 'QUARTERLY',
    // Metas trimestrales
    q1Target: 0,
    q2Target: 0,
    q3Target: 0,
    q4Target: 0,
    // Metas mensuales
    janTarget: 0,
    febTarget: 0,
    marTarget: 0,
    aprTarget: 0,
    mayTarget: 0,
    junTarget: 0,
    julTarget: 0,
    augTarget: 0,
    sepTarget: 0,
    octTarget: 0,
    novTarget: 0,
    decTarget: 0,
    level: '', // strategicAxis, objective, product, activity
    levelId: '',
    isActive: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    byType: { PRODUCT: 0, RESULT: 0 },
    byLevel: {},
    avgProgress: 0
  });

  // Load data
  useEffect(() => {
    loadIndicators();
    loadLevelOptions();
  }, [filters]);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de filtro
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('search', filters.search);
      if (filters.isActive !== null) params.append('isActive', filters.isActive);
      
      // Filtrar por nivel específico
      if (filters.level && filters.levelId) {
        switch (filters.level) {
          case 'strategicAxis':
            params.append('strategicAxisId', filters.levelId);
            break;
          case 'objective':
            params.append('objectiveId', filters.levelId);
            break;
          case 'product':
            params.append('productId', filters.levelId);
            break;
          case 'activity':
            params.append('activityId', filters.levelId);
            break;
        }
      }

      const response = await apiClient.get(`/indicators?${params.toString()}`);
      console.log('🔍 Debug loadIndicators response:', response.data);
      
      // La respuesta del backend tiene estructura: { success: true, data: {indicators: [...], pagination: {...}} }
      const indicatorsData = response.data?.data?.indicators || [];
      setIndicators(indicatorsData);
      
      // Calcular estadísticas
      const totalIndicators = indicatorsData.length;
      const typeStats = indicatorsData.reduce((acc, indicator) => {
        acc[indicator.type] = (acc[indicator.type] || 0) + 1;
        return acc;
      }, { PRODUCT: 0, RESULT: 0 });
      
      const levelStats = indicatorsData.reduce((acc, indicator) => {
        let level = 'Sin asignar';
        if (indicator.strategicAxis) level = 'Eje Estratégico';
        else if (indicator.objective) level = 'Objetivo';
        else if (indicator.product) level = 'Producto';
        else if (indicator.activity) level = 'Actividad';
        
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});
      
      const avgProgress = totalIndicators > 0 
        ? indicatorsData.reduce((sum, ind) => sum + (ind.currentProgress?.progressPercent || 0), 0) / totalIndicators
        : 0;

      setStats({
        total: totalIndicators,
        byType: typeStats,
        byLevel: levelStats,
        avgProgress: Math.round(avgProgress * 100) / 100
      });

    } catch (error) {
      console.error('❌ Error al cargar indicadores:', error);
      setError('Error al cargar los indicadores');
      setIndicators([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const loadLevelOptions = async () => {
    try {
      console.log('🔍 Cargando opciones de niveles...');
      const response = await apiClient.get(`/indicators/levels/options?year=${filters.year}`);
      console.log('📊 Respuesta de opciones:', response.data);
      
      // La respuesta puede tener diferentes estructuras
      const optionsData = response.data?.data || response.data || { strategicAxes: [], objectives: [], products: [], activities: [] };
      setLevelOptions(optionsData);
      console.log('✅ Opciones de niveles cargadas');
    } catch (error) {
      console.error('❌ Error al cargar opciones de niveles:', error);
      setLevelOptions({ strategicAxes: [], objectives: [], products: [], activities: [] });
    }
  };

  const handleOpenDialog = (mode, indicator = null) => {
    setDialogMode(mode);
    setSelectedIndicator(indicator);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        type: 'PRODUCT',
        measurementUnit: '',
        baseline: 0,
        annualTarget: 0,
        reportingFrequency: 'trimestral',
        // Metas trimestrales
        q1Target: 0,
        q2Target: 0,
        q3Target: 0,
        q4Target: 0,
        // Metas mensuales
        janTarget: 0,
        febTarget: 0,
        marTarget: 0,
        aprTarget: 0,
        mayTarget: 0,
        junTarget: 0,
        julTarget: 0,
        augTarget: 0,
        sepTarget: 0,
        octTarget: 0,
        novTarget: 0,
        decTarget: 0,
        level: '',
        levelId: '',
        isActive: true
      });
    } else if (mode === 'edit' && indicator) {
      // Determinar el nivel del indicador
      let level = '';
      let levelId = '';
      
      if (indicator.strategicAxisId) {
        level = 'strategicAxis';
        levelId = indicator.strategicAxisId;
      } else if (indicator.objectiveId) {
        level = 'objective';
        levelId = indicator.objectiveId;
      } else if (indicator.productId) {
        level = 'product';
        levelId = indicator.productId;
      } else if (indicator.activityId) {
        level = 'activity';
        levelId = indicator.activityId;
      }

      setFormData({
        name: indicator.name,
        description: indicator.description || '',
        type: indicator.type,
        measurementUnit: indicator.measurementUnit,
        baseline: indicator.baseline || 0,
        annualTarget: indicator.annualTarget,
        reportingFrequency: indicator.reportingFrequency || 'trimestral',
        // Metas trimestrales
        q1Target: indicator.q1Target || 0,
        q2Target: indicator.q2Target || 0,
        q3Target: indicator.q3Target || 0,
        q4Target: indicator.q4Target || 0,
        // Metas mensuales
        janTarget: indicator.janTarget || 0,
        febTarget: indicator.febTarget || 0,
        marTarget: indicator.marTarget || 0,
        aprTarget: indicator.aprTarget || 0,
        mayTarget: indicator.mayTarget || 0,
        junTarget: indicator.junTarget || 0,
        julTarget: indicator.julTarget || 0,
        augTarget: indicator.augTarget || 0,
        sepTarget: indicator.sepTarget || 0,
        octTarget: indicator.octTarget || 0,
        novTarget: indicator.novTarget || 0,
        decTarget: indicator.decTarget || 0,
        level,
        levelId,
        isActive: indicator.isActive
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedIndicator(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    // Validación de campos obligatorios
    if (!formData.name || !formData.measurementUnit || !formData.annualTarget || !formData.level || !formData.levelId) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    // Normalizar reportingFrequency
    let reportingFrequency = formData.reportingFrequency;
    if (reportingFrequency === 'trimestral' || reportingFrequency === 'QUARTERLY') {
      reportingFrequency = 'QUARTERLY';
    } else if (reportingFrequency === 'mensual' || reportingFrequency === 'MONTHLY') {
      reportingFrequency = 'MONTHLY';
    }

    try {
      setLoading(true);
      // Preparar datos para envío
      const submitData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        measurementUnit: formData.measurementUnit,
        baseline: parseFloat(formData.baseline) || 0,
        annualTarget: parseFloat(formData.annualTarget),
        reportingFrequency,
        // Metas trimestrales
        q1Target: parseFloat(formData.q1Target) || 0,
        q2Target: parseFloat(formData.q2Target) || 0,
        q3Target: parseFloat(formData.q3Target) || 0,
        q4Target: parseFloat(formData.q4Target) || 0,
        // Metas mensuales
        janTarget: parseFloat(formData.janTarget) || 0,
        febTarget: parseFloat(formData.febTarget) || 0,
        marTarget: parseFloat(formData.marTarget) || 0,
        aprTarget: parseFloat(formData.aprTarget) || 0,
        mayTarget: parseFloat(formData.mayTarget) || 0,
        junTarget: parseFloat(formData.junTarget) || 0,
        julTarget: parseFloat(formData.julTarget) || 0,
        augTarget: parseFloat(formData.augTarget) || 0,
        sepTarget: parseFloat(formData.sepTarget) || 0,
        octTarget: parseFloat(formData.octTarget) || 0,
        novTarget: parseFloat(formData.novTarget) || 0,
        decTarget: parseFloat(formData.decTarget) || 0,
        isActive: formData.isActive
      };

      // Agregar el ID del nivel correspondiente
      if (formData.level && formData.levelId) {
        switch (formData.level) {
          case 'strategicAxis':
            submitData.strategicAxisId = formData.levelId;
            break;
          case 'objective':
            submitData.objectiveId = formData.levelId;
            break;
          case 'product':
            submitData.productId = formData.levelId;
            break;
          case 'activity':
            submitData.activityId = formData.levelId;
            break;
        }
      }

      if (dialogMode === 'create') {
        await apiClient.post('/indicators', submitData);
        setSuccess('Indicador creado exitosamente');
      } else if (dialogMode === 'edit') {
        await apiClient.put(`/indicators/${selectedIndicator.id}`, submitData);
        setSuccess('Indicador actualizado exitosamente');
      }

      handleCloseDialog();
      loadIndicators();
    } catch (error) {
      setError(error.response?.data?.message || 'Error al guardar el indicador');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (indicator) => {
    if (!window.confirm(`¿Está seguro de eliminar el indicador "${indicator.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.delete(`/indicators/${indicator.id}`);
      setSuccess('Indicador eliminado exitosamente');
      loadIndicators();
    } catch (error) {
      console.error('Error al eliminar indicador:', error);
      setError(error.response?.data?.message || 'Error al eliminar el indicador');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 90) return 'success';
    if (percent >= 70) return 'warning';
    return 'error';
  };

  const getLevelDisplay = (indicator) => {
    if (indicator.strategicAxis) {
      return `Eje: ${indicator.strategicAxis.code} - ${indicator.strategicAxis.name}`;
    }
    if (indicator.objective) {
      return `Objetivo: ${indicator.objective.code} - ${indicator.objective.name}`;
    }
    if (indicator.product) {
      return `Producto: ${indicator.product.code} - ${indicator.product.name}`;
    }
    if (indicator.activity) {
      return `Actividad: ${indicator.activity.code} - ${indicator.activity.name}`;
    }
    return 'Sin asignar';
  };

  const getLevelOptions = () => {
    switch (formData.level) {
      case 'strategicAxis':
        return levelOptions.strategicAxes;
      case 'objective':
        return levelOptions.objectives;
      case 'product':
        return levelOptions.products;
      case 'activity':
        return levelOptions.activities;
      default:
        return [];
    }
  };

  if (loading && indicators.length === 0) {
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
          <TimelineIcon sx={{ mr: 2, color: 'primary.main' }} />
          Gestión de Indicadores
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure y gestione los indicadores de desempeño del POA
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
          Nuevo Indicador
        </Button>
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
                Total Indicadores
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
                Progreso Promedio
              </Typography>
              <Typography variant="h4" color={getProgressColor(stats.avgProgress)}>
                {stats.avgProgress}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Indicadores de Producto
              </Typography>
              <Typography variant="h4">
                {stats.byType.PRODUCT}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Indicadores de Resultado
              </Typography>
              <Typography variant="h4">
                {stats.byType.RESULT}
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
            <Grid item xs={12} md={3}>
              <TextField
                label="Buscar"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nombre o descripción..."
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="PRODUCT">Producto</MenuItem>
                  <MenuItem value="RESULT">Resultado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Nivel</InputLabel>
                <Select
                  value={filters.level}
                  onChange={(e) => setFilters({ ...filters, level: e.target.value, levelId: '' })}
                  label="Nivel"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="strategicAxis">Eje Estratégico</MenuItem>
                  <MenuItem value="objective">Objetivo</MenuItem>
                  <MenuItem value="product">Producto</MenuItem>
                  <MenuItem value="activity">Actividad</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {filters.level && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Elemento</InputLabel>
                  <Select
                    value={filters.levelId}
                    onChange={(e) => setFilters({ ...filters, levelId: e.target.value })}
                    label="Elemento"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {getLevelOptions().map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.code} - {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.isActive}
                    onChange={(e) => setFilters({ ...filters, isActive: e.target.checked })}
                  />
                }
                label="Solo activos"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Tabla de indicadores */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Indicador</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Nivel</TableCell>
                <TableCell>Unidad de Medida</TableCell>
                <TableCell>Meta Anual</TableCell>
                <TableCell>Progreso</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {indicators.map((indicator) => (
                <TableRow key={indicator.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{indicator.name}</Typography>
                    {indicator.description && (
                      <Typography variant="body2" color="text.secondary">
                        {indicator.description.length > 50 
                          ? `${indicator.description.substring(0, 50)}...` 
                          : indicator.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={indicator.type}
                      color={indicator.type === 'PRODUCT' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getLevelDisplay(indicator)}
                    </Typography>
                  </TableCell>
                  <TableCell>{indicator.measurementUnit}</TableCell>
                  <TableCell>{indicator.annualTarget}</TableCell>
                  <TableCell>
                    {indicator.currentProgress && (
                      <Box>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {indicator.currentProgress.progressPercent}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({indicator.currentProgress.totalAchieved}/{indicator.annualTarget})
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(indicator.currentProgress.progressPercent, 100)}
                          color={getProgressColor(indicator.currentProgress.progressPercent)}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={indicator.isActive ? 'Activo' : 'Inactivo'}
                      color={indicator.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton onClick={() => handleOpenDialog('view', indicator)}>
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenDialog('edit', indicator)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(indicator)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {indicators.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron indicadores
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* FAB para agregar indicador - Solo móviles */}
      <Fab
        color="primary"
        aria-label="agregar indicador"
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

      {/* Dialog para crear/editar/ver indicador */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' && 'Crear Nuevo Indicador'}
          {dialogMode === 'edit' && 'Editar Indicador'}
          {dialogMode === 'view' && 'Detalles del Indicador'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre del Indicador"
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
                rows={2}
                disabled={dialogMode === 'view'}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Indicador</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Tipo de Indicador"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="PRODUCT">Producto</MenuItem>
                  <MenuItem value="RESULT">Resultado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Unidad de Medida"
                value={formData.measurementUnit}
                onChange={(e) => setFormData({ ...formData, measurementUnit: e.target.value })}
                fullWidth
                required
                disabled={dialogMode === 'view'}
                placeholder="Ej: Unidades, Porcentaje, Documentos..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Periodicidad de Reporte</InputLabel>
                <Select
                  value={formData.reportingFrequency}
                  onChange={(e) => setFormData({ ...formData, reportingFrequency: e.target.value })}
                  label="Periodicidad de Reporte"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="QUARTERLY">Trimestral</MenuItem>
                  <MenuItem value="MONTHLY">Mensual</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Nivel de Vinculación</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value, levelId: '' })}
                  label="Nivel de Vinculación"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="strategicAxis">Eje Estratégico</MenuItem>
                  <MenuItem value="objective">Objetivo</MenuItem>
                  <MenuItem value="product">Producto</MenuItem>
                  <MenuItem value="activity">Actividad</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.level && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Elemento</InputLabel>
                  <Select
                    value={formData.levelId}
                    onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                    label="Elemento"
                    disabled={dialogMode === 'view'}
                  >
                    {getLevelOptions().map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.code} - {option.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                label="Línea Base"
                type="number"
                value={formData.baseline}
                onChange={(e) => setFormData({ ...formData, baseline: e.target.value })}
                fullWidth
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Meta Anual"
                type="number"
                value={formData.annualTarget}
                onChange={(e) => setFormData({ ...formData, annualTarget: e.target.value })}
                fullWidth
                required
                disabled={dialogMode === 'view'}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {formData.reportingFrequency === 'MONTHLY' ? 'Metas Mensuales' : 'Metas Trimestrales'}
              </Typography>
            </Grid>

            {formData.reportingFrequency === 'MONTHLY' ? (
              // Metas mensuales
              <>
                {[
                  { key: 'janTarget', label: 'Enero' },
                  { key: 'febTarget', label: 'Febrero' },
                  { key: 'marTarget', label: 'Marzo' },
                  { key: 'aprTarget', label: 'Abril' },
                  { key: 'mayTarget', label: 'Mayo' },
                  { key: 'junTarget', label: 'Junio' },
                  { key: 'julTarget', label: 'Julio' },
                  { key: 'augTarget', label: 'Agosto' },
                  { key: 'sepTarget', label: 'Septiembre' },
                  { key: 'octTarget', label: 'Octubre' },
                  { key: 'novTarget', label: 'Noviembre' },
                  { key: 'decTarget', label: 'Diciembre' }
                ].map((month) => (
                  <Grid item xs={12} md={3} key={month.key}>
                    <TextField
                      label={month.label}
                      type="number"
                      value={formData[month.key] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [month.key]: e.target.value
                      })}
                      fullWidth
                      disabled={dialogMode === 'view'}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                ))}
              </>
            ) : (
              // Metas trimestrales
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Meta Q1"
                    type="number"
                    value={formData.q1Target}
                    onChange={(e) => setFormData({ ...formData, q1Target: e.target.value })}
                    fullWidth
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Meta Q2"
                    type="number"
                    value={formData.q2Target}
                    onChange={(e) => setFormData({ ...formData, q2Target: e.target.value })}
                    fullWidth
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Meta Q3"
                    type="number"
                    value={formData.q3Target}
                    onChange={(e) => setFormData({ ...formData, q3Target: e.target.value })}
                    fullWidth
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Meta Q4"
                    type="number"
                    value={formData.q4Target}
                    onChange={(e) => setFormData({ ...formData, q4Target: e.target.value })}
                    fullWidth
                    disabled={dialogMode === 'view'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </>
            )}

            {dialogMode !== 'view' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Indicador activo"
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
    </Box>
  );
};

export default IndicatorManagement;
