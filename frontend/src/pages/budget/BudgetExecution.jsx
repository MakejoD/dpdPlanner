import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  Tooltip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Divider,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as ReportIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const BudgetExecution = () => {
  // Estados principales
  const [budgetExecutions, setBudgetExecutions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [executionToDelete, setExecutionToDelete] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    budgetCode: '',
    budgetName: '',
    description: '',
    assignedAmount: '',
    committedAmount: '',
    accruedAmount: '',
    paidAmount: '',
    fiscalYear: new Date().getFullYear(),
    quarter: '',
    month: '',
    activityId: '',
    departmentId: '',
    responsibleId: ''
  });

  // Estados de filtros
  const [filters, setFilters] = useState({
    activityId: '',
    fiscalYear: '',
    departmentId: '',
    budgetCode: '',
    isActive: true
  });

  // Estados de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const { user } = useAuth();

  // Cargar datos iniciales
  useEffect(() => {
    loadBudgetExecutions();
    loadActivities();
    loadDepartments();
  }, [filters]);

  // Función para cargar ejecuciones presupuestarias
  const loadBudgetExecutions = async () => {
    try {
      setLoading(true);
      
      // Construir query params para filtros
      const queryParams = new URLSearchParams();
      if (filters.activityId) queryParams.append('activityId', filters.activityId);
      if (filters.fiscalYear) queryParams.append('fiscalYear', filters.fiscalYear);
      if (filters.departmentId) queryParams.append('departmentId', filters.departmentId);
      if (filters.budgetCode) queryParams.append('budgetCode', filters.budgetCode);
      if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive);

      const response = await httpClient.get(`/budget-execution?${queryParams.toString()}`);
      
      if (response.data.success) {
        setBudgetExecutions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar ejecuciones presupuestarias:', error);
      showSnackbar('Error al cargar las ejecuciones presupuestarias', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar actividades
  const loadActivities = async () => {
    try {
      const response = await httpClient.get('activities');
      if (response.data?.success) {
        setActivities(response.data?.data || []);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error al cargar actividades:', error);
    }
  };

  // Función para cargar departamentos
  const loadDepartments = async () => {
    try {
      const response = await httpClient.get('departments');
      if (response.data?.success) {
        setDepartments(response.data?.data || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
    }
  };

  // Función para mostrar notificaciones
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Manejar apertura del diálogo
  const handleOpenDialog = (execution = null) => {
    if (execution) {
      setSelectedExecution(execution);
      setFormData({
        budgetCode: execution.budgetCode,
        budgetName: execution.budgetName,
        description: execution.description || '',
        assignedAmount: execution.assignedAmount.toString(),
        committedAmount: execution.committedAmount.toString(),
        accruedAmount: execution.accruedAmount.toString(),
        paidAmount: execution.paidAmount.toString(),
        fiscalYear: execution.fiscalYear,
        quarter: execution.quarter || '',
        month: execution.month || '',
        activityId: execution.activityId,
        departmentId: execution.departmentId || '',
        responsibleId: execution.responsibleId || ''
      });
      setIsEditing(true);
    } else {
      setSelectedExecution(null);
      setFormData({
        budgetCode: '',
        budgetName: '',
        description: '',
        assignedAmount: '',
        committedAmount: '0',
        accruedAmount: '0',
        paidAmount: '0',
        fiscalYear: new Date().getFullYear(),
        quarter: '',
        month: '',
        activityId: '',
        departmentId: '',
        responsibleId: ''
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedExecution(null);
    setIsEditing(false);
  };

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    try {
      // Validaciones básicas
      if (!formData.budgetCode || !formData.budgetName || !formData.assignedAmount || !formData.activityId) {
        showSnackbar('Por favor complete todos los campos obligatorios', 'error');
        return;
      }

      // Validar que los montos sean números válidos
      const assigned = parseFloat(formData.assignedAmount);
      const committed = parseFloat(formData.committedAmount || 0);
      const accrued = parseFloat(formData.accruedAmount || 0);
      const paid = parseFloat(formData.paidAmount || 0);

      if (isNaN(assigned) || assigned <= 0) {
        showSnackbar('El monto asignado debe ser un número válido mayor a 0', 'error');
        return;
      }

      if (committed > assigned) {
        showSnackbar('El monto comprometido no puede ser mayor al asignado', 'error');
        return;
      }

      if (accrued > committed) {
        showSnackbar('El monto devengado no puede ser mayor al comprometido', 'error');
        return;
      }

      if (paid > accrued) {
        showSnackbar('El monto pagado no puede ser mayor al devengado', 'error');
        return;
      }

      const requestData = {
        ...formData,
        assignedAmount: assigned,
        committedAmount: committed,
        accruedAmount: accrued,
        paidAmount: paid,
        quarter: formData.quarter ? parseInt(formData.quarter) : null,
        month: formData.month ? parseInt(formData.month) : null
      };

      let response;
      if (isEditing) {
        response = await httpClient.put(`/budget-execution/${selectedExecution.id}`, requestData);
      } else {
        response = await httpClient.post('/budget-execution', requestData);
      }

      if (response.data.success) {
        showSnackbar(
          isEditing 
            ? 'Ejecución presupuestaria actualizada exitosamente' 
            : 'Ejecución presupuestaria creada exitosamente'
        );
        handleCloseDialog();
        loadBudgetExecutions();
      }
    } catch (error) {
      console.error('Error al guardar ejecución presupuestaria:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar la ejecución presupuestaria';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Manejar eliminación
  const handleDelete = async () => {
    try {
      const response = await httpClient.delete(`/budget-execution/${executionToDelete.id}`);
      
      if (response.data.success) {
        showSnackbar('Ejecución presupuestaria eliminada exitosamente');
        setDeleteDialogOpen(false);
        setExecutionToDelete(null);
        loadBudgetExecutions();
      }
    } catch (error) {
      console.error('Error al eliminar ejecución presupuestaria:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar la ejecución presupuestaria';
      showSnackbar(errorMessage, 'error');
    }
  };

  // Función para formatear montos
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para obtener color del porcentaje
  const getPercentageColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  // Calcular resumen
  const calculateSummary = () => {
    const totals = Array.isArray(budgetExecutions) ? budgetExecutions.reduce((acc, execution) => {
      acc.assigned += parseFloat(execution.assignedAmount);
      acc.committed += parseFloat(execution.committedAmount);
      acc.accrued += parseFloat(execution.accruedAmount);
      acc.paid += parseFloat(execution.paidAmount);
      return acc;
    }, { assigned: 0, committed: 0, accrued: 0, paid: 0 }) : { assigned: 0, committed: 0, accrued: 0, paid: 0 };

    return {
      ...totals,
      commitmentPercent: totals.assigned > 0 ? (totals.committed / totals.assigned) * 100 : 0,
      accruedPercent: totals.assigned > 0 ? (totals.accrued / totals.assigned) * 100 : 0,
      executionPercent: totals.assigned > 0 ? (totals.paid / totals.assigned) * 100 : 0
    };
  };

  const summary = calculateSummary();

  return (
    <Box>
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Ejecución Presupuestaria
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ minWidth: 200 }}
        >
          Nueva Ejecución
        </Button>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Asignado</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {formatCurrency(summary.assigned)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total presupuestado
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Comprometido</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {formatCurrency(summary.committed)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.commitmentPercent.toFixed(1)}% del total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ReportIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Devengado</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {formatCurrency(summary.accrued)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.accruedPercent.toFixed(1)}% del total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalanceIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Ejecutado</Typography>
              </Box>
              <Typography variant="h4" color="success.main">
                {formatCurrency(summary.paid)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.executionPercent.toFixed(1)}% del total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Año Fiscal</InputLabel>
              <Select
                value={filters.fiscalYear}
                label="Año Fiscal"
                onChange={(e) => setFilters(prev => ({ ...prev, fiscalYear: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="2024">2024</MenuItem>
                <MenuItem value="2025">2025</MenuItem>
                <MenuItem value="2026">2026</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Actividad</InputLabel>
              <Select
                value={filters.activityId}
                label="Actividad"
                onChange={(e) => setFilters(prev => ({ ...prev, activityId: e.target.value }))}
              >
                <MenuItem value="">Todas</MenuItem>
                {Array.isArray(activities) ? activities.map((activity) => (
                  <MenuItem key={activity.id} value={activity.id}>
                    {activity.code} - {activity.name}
                  </MenuItem>
                )) : []}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select
                value={filters.departmentId}
                label="Departamento"
                onChange={(e) => setFilters(prev => ({ ...prev, departmentId: e.target.value }))}
              >
                <MenuItem value="">Todos</MenuItem>
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.code} - {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Código Presupuestario"
              value={filters.budgetCode}
              onChange={(e) => setFilters(prev => ({ ...prev, budgetCode: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de ejecuciones presupuestarias */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Partida</TableCell>
                <TableCell>Actividad</TableCell>
                <TableCell align="right">Asignado</TableCell>
                <TableCell align="right">Comprometido</TableCell>
                <TableCell align="right">Devengado</TableCell>
                <TableCell align="right">Pagado</TableCell>
                <TableCell align="center">% Ejecución</TableCell>
                <TableCell align="center">Año</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Box display="flex" justifyContent="center" py={3}>
                      <LinearProgress sx={{ width: '50%' }} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : budgetExecutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No se encontraron ejecuciones presupuestarias
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(budgetExecutions) ? budgetExecutions.map((execution) => (
                  <TableRow key={execution.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {execution.budgetCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {execution.budgetName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {execution.activity?.code} - {execution.activity?.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(execution.assignedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(execution.committedAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({execution.commitmentPercent}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(execution.accruedAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({execution.accruedPercent}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(execution.paidAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({execution.executionPercent}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${execution.executionPercent}%`}
                        color={getPercentageColor(execution.executionPercent)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {execution.fiscalYear}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" onClick={() => handleOpenDialog(execution)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleOpenDialog(execution)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setExecutionToDelete(execution);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )) : []
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de formulario */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Editar Ejecución Presupuestaria' : 'Nueva Ejecución Presupuestaria'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Código y Nombre */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código Presupuestario *"
                value={formData.budgetCode}
                onChange={(e) => handleFormChange('budgetCode', e.target.value)}
                disabled={isEditing}
                helperText="Ej: PART-410.11.01"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre de la Partida *"
                value={formData.budgetName}
                onChange={(e) => handleFormChange('budgetName', e.target.value)}
              />
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </Grid>

            {/* Actividad */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Actividad</InputLabel>
                <Select
                  value={formData.activityId}
                  label="Actividad *"
                  onChange={(e) => handleFormChange('activityId', e.target.value)}
                >
                  {Array.isArray(activities) ? activities.map((activity) => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.code} - {activity.name}
                    </MenuItem>
                  )) : []}
                </Select>
              </FormControl>
            </Grid>

            {/* Año fiscal */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Año Fiscal *"
                value={formData.fiscalYear}
                onChange={(e) => handleFormChange('fiscalYear', parseInt(e.target.value))}
                inputProps={{ min: 2020, max: 2030 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Montos Presupuestarios
                </Typography>
              </Divider>
            </Grid>

            {/* Montos */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monto Asignado *"
                value={formData.assignedAmount}
                onChange={(e) => handleFormChange('assignedAmount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monto Comprometido"
                value={formData.committedAmount}
                onChange={(e) => handleFormChange('committedAmount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monto Devengado"
                value={formData.accruedAmount}
                onChange={(e) => handleFormChange('accruedAmount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Monto Pagado"
                value={formData.paidAmount}
                onChange={(e) => handleFormChange('paidAmount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            {/* Período */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Trimestre</InputLabel>
                <Select
                  value={formData.quarter}
                  label="Trimestre"
                  onChange={(e) => handleFormChange('quarter', e.target.value)}
                >
                  <MenuItem value="">N/A</MenuItem>
                  <MenuItem value="1">Q1 (Ene-Mar)</MenuItem>
                  <MenuItem value="2">Q2 (Abr-Jun)</MenuItem>
                  <MenuItem value="3">Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value="4">Q4 (Oct-Dic)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={formData.month}
                  label="Mes"
                  onChange={(e) => handleFormChange('month', e.target.value)}
                >
                  <MenuItem value="">N/A</MenuItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString('es', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la ejecución presupuestaria "{executionToDelete?.budgetName}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetExecution;
