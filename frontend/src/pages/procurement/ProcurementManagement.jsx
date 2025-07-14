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
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Link as LinkIcon,
  LocalShipping as ShippingIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const ProcurementManagement = () => {
  const { hasPermission, user } = useAuth();
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    status: '',
    departmentId: '',
    procurementMethod: '',
    search: ''
  });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProcess, setSelectedProcess] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    cuciCode: '',
    description: '',
    measurementUnit: 'Unidad',
    quantity: '',
    unitCost: '',
    procurementMethod: 'Comparación de Precios',
    fundingSource: 'Fondos Propios',
    plannedStartDate: '',
    plannedAwardDate: '',
    fiscalYear: new Date().getFullYear(),
    notes: '',
    departmentId: ''
  });

  const procurementMethods = [
    'Licitación Pública',
    'Comparación de Precios', 
    'Compras Menores',
    'Sorteo de Obras',
    'Contratación Directa',
    'Subasta Inversa'
  ];

  const fundingSources = [
    'Fondos Propios',
    'Préstamo Externo',
    'Donación',
    'Fondos del Tesoro Nacional'
  ];

  const measurementUnits = [
    'Unidad',
    'Servicio',
    'Global',
    'Quintal',
    'Metro',
    'Litro',
    'Kilogramo',
    'Otro'
  ];

  const statusColors = {
    'PLANIFICADO': 'default',
    'EN_PROCESO': 'primary',
    'ADJUDICADO': 'success',
    'DESIERTO': 'warning',
    'CANCELADO': 'error'
  };

  const statusLabels = {
    'PLANIFICADO': 'Planificado',
    'EN_PROCESO': 'En Proceso',
    'ADJUDICADO': 'Adjudicado',
    'DESIERTO': 'Desierto',
    'CANCELADO': 'Cancelado'
  };

  useEffect(() => {
    loadData();
    loadDepartments();
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
        limit: pagination.rowsPerPage,
        includeLinks: 'true'
      });

      // Agregar filtros si están definidos
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await httpClient.get(`/procurement-processes?${params.toString()}`);
      
      if (response.success) {
        setProcesses(response.data.processes);
        setStats(response.data.stats);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('Error cargando procesos:', error);
      showAlert('Error al cargar procesos de compra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await httpClient.get('/departments');
      const data = response.data || response;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
    }
  };

  const handleOpenDialog = (process = null) => {
    if (process) {
      setEditingProcess(process);
      setFormData({
        cuciCode: process.cuciCode,
        description: process.description,
        measurementUnit: process.measurementUnit,
        quantity: process.quantity.toString(),
        unitCost: process.unitCost.toString(),
        procurementMethod: process.procurementMethod,
        fundingSource: process.fundingSource,
        plannedStartDate: process.plannedStartDate ? process.plannedStartDate.split('T')[0] : '',
        plannedAwardDate: process.plannedAwardDate ? process.plannedAwardDate.split('T')[0] : '',
        fiscalYear: process.fiscalYear,
        notes: process.notes || '',
        departmentId: process.departmentId || ''
      });
    } else {
      setEditingProcess(null);
      setFormData({
        cuciCode: '',
        description: '',
        measurementUnit: 'Unidad',
        quantity: '',
        unitCost: '',
        procurementMethod: 'Comparación de Precios',
        fundingSource: 'Fondos Propios',
        plannedStartDate: '',
        plannedAwardDate: '',
        fiscalYear: new Date().getFullYear(),
        notes: '',
        departmentId: user?.departmentId || ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProcess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!formData.cuciCode.trim()) {
        showAlert('El código CUCI es requerido', 'error');
        return;
      }

      if (!formData.description.trim()) {
        showAlert('La descripción es requerida', 'error');
        return;
      }

      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        showAlert('La cantidad debe ser mayor a 0', 'error');
        return;
      }

      if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) {
        showAlert('El costo unitario debe ser mayor a 0', 'error');
        return;
      }

      const dataToSend = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
        plannedStartDate: formData.plannedStartDate || null,
        plannedAwardDate: formData.plannedAwardDate || null
      };

      let response;
      if (editingProcess) {
        response = await httpClient.put(`/procurement-processes/${editingProcess.id}`, dataToSend);
      } else {
        response = await httpClient.post('/procurement-processes', dataToSend);
      }

      if (response.success) {
        showAlert(response.message || (editingProcess ? 'Proceso actualizado exitosamente' : 'Proceso creado exitosamente'), 'success');
        handleCloseDialog();
        loadData();
      }
    } catch (error) {
      console.error('Error guardando proceso:', error);
      const message = error.response?.data?.message || 'Error al guardar proceso';
      showAlert(message, 'error');
    }
  };

  const handleDelete = async (process) => {
    if (!window.confirm(`¿Está seguro de eliminar el proceso "${process.cuciCode}"?`)) {
      return;
    }

    try {
      const response = await httpClient.delete(`/procurement-processes/${process.id}`);
      if (response.success) {
        showAlert(response.message || 'Proceso eliminado exitosamente', 'success');
        loadData();
      }
    } catch (error) {
      console.error('Error eliminando proceso:', error);
      const message = error.response?.data?.message || 'Error al eliminar proceso';
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

  const handleMenuClick = (event, process) => {
    setAnchorEl(event.currentTarget);
    setSelectedProcess(process);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProcess(null);
  };

  const getTotalCost = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitCost = parseFloat(formData.unitCost) || 0;
    return quantity * unitCost;
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
            <ShoppingCartIcon sx={{ mr: 2 }} />
            Plan Anual de Compras (PAC)
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión completa de procesos de compra y contrataciones alineados con el POA
          </Typography>
        </Box>
        {hasPermission('create', 'procurement_process') && (
          <Fab
            variant="extended"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            <AddIcon sx={{ mr: 1 }} />
            Nuevo Proceso
          </Fab>
        )}
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Procesos
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalProcesses || 0}
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
                <MoneyIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Monto Total
                  </Typography>
                  <Typography variant="h4">
                    RD${(stats.totalAmount || 0).toLocaleString()}
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
                <CheckCircleIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    En Proceso
                  </Typography>
                  <Typography variant="h4">
                    {stats.byStatus?.EN_PROCESO?.count || 0}
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
                <ScheduleIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Adjudicados
                  </Typography>
                  <Typography variant="h4">
                    {stats.byStatus?.ADJUDICADO?.count || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filtros</Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Año Fiscal"
              type="number"
              value={filters.fiscalYear}
              onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Modalidad</InputLabel>
              <Select
                value={filters.procurementMethod}
                onChange={(e) => handleFilterChange('procurementMethod', e.target.value)}
                label="Modalidad"
              >
                <MenuItem value="">Todas</MenuItem>
                {procurementMethods.map(method => (
                  <MenuItem key={method} value={method}>{method}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {hasPermission('read', 'department') && (
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  label="Departamento"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Buscar (código, descripción, proveedor)"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de procesos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código CUCI</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center">Modalidad</TableCell>
                <TableCell align="right">Costo Total</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Vínculos POA</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {process.cuciCode}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {process.fiscalYear}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {process.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {process.quantity} {process.measurementUnit} × RD${parseFloat(process.unitCost).toLocaleString()}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Typography variant="caption">
                      {process.procurementMethod}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      RD${parseFloat(process.totalCost).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {process.fundingSource}
                    </Typography>
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={statusLabels[process.status]}
                      color={statusColors[process.status]}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <Chip
                      label={`${process.activityLinks?.length || 0} vínculos`}
                      size="small"
                      color={process.activityLinks?.length > 0 ? "primary" : "default"}
                      icon={<LinkIcon />}
                    />
                  </TableCell>
                  
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, process)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {processes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay procesos de compra registrados
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

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleOpenDialog(selectedProcess); handleMenuClose(); }}>
          <ListItemIcon><ViewIcon /></ListItemIcon>
          <ListItemText>Ver/Editar</ListItemText>
        </MenuItem>
        
        {hasPermission('delete', 'procurement_process') && (
          <MenuItem onClick={() => { handleDelete(selectedProcess); handleMenuClose(); }}>
            <ListItemIcon><DeleteIcon /></ListItemIcon>
            <ListItemText>Eliminar</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Diálogo de formulario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProcess ? 'Editar Proceso de Compra' : 'Nuevo Proceso de Compra'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="cuciCode"
                  label="Código CUCI"
                  fullWidth
                  required
                  value={formData.cuciCode}
                  onChange={handleInputChange}
                  placeholder="Ej: 2024-001-DPP"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="fiscalYear"
                  label="Año Fiscal"
                  type="number"
                  fullWidth
                  required
                  value={formData.fiscalYear}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descripción del Bien/Servicio"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Unidad de Medida</InputLabel>
                  <Select
                    name="measurementUnit"
                    value={formData.measurementUnit}
                    onChange={handleInputChange}
                    label="Unidad de Medida"
                  >
                    {measurementUnits.map(unit => (
                      <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  fullWidth
                  required
                  value={formData.quantity}
                  onChange={handleInputChange}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="unitCost"
                  label="Costo Unitario (RD$)"
                  type="number"
                  fullWidth
                  required
                  value={formData.unitCost}
                  onChange={handleInputChange}
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Costo Total Estimado: RD${getTotalCost().toLocaleString()}</strong>
                  </Typography>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Modalidad de Compra</InputLabel>
                  <Select
                    name="procurementMethod"
                    value={formData.procurementMethod}
                    onChange={handleInputChange}
                    label="Modalidad de Compra"
                  >
                    {procurementMethods.map(method => (
                      <MenuItem key={method} value={method}>{method}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Fuente de Financiamiento</InputLabel>
                  <Select
                    name="fundingSource"
                    value={formData.fundingSource}
                    onChange={handleInputChange}
                    label="Fuente de Financiamiento"
                  >
                    {fundingSources.map(source => (
                      <MenuItem key={source} value={source}>{source}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="plannedStartDate"
                  label="Fecha Prevista de Inicio"
                  type="date"
                  fullWidth
                  value={formData.plannedStartDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="plannedAwardDate"
                  label="Fecha Prevista de Adjudicación"
                  type="date"
                  fullWidth
                  value={formData.plannedAwardDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {hasPermission('read', 'department') && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                      label="Departamento"
                    >
                      {departments.map(dept => (
                        <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Observaciones"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained">
            {editingProcess ? 'Actualizar' : 'Crear'}
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

export default ProcurementManagement;
