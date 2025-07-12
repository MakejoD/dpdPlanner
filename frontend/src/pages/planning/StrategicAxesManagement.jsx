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
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StrategicAxesManagement = () => {
  const { user, token } = useAuth();
  const [strategicAxes, setStrategicAxes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedAxis, setSelectedAxis] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    departmentId: '',
    isActive: true
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    year: new Date().getFullYear(),
    departmentId: '',
    isActive: true
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byDepartment: {}
  });

  const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Load data
  useEffect(() => {
    loadStrategicAxes();
    loadDepartments();
  }, [filters]);

  const loadStrategicAxes = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      if (filters.isActive !== null) params.append('isActive', filters.isActive);
      
      const response = await apiClient.get(`/strategic-axes?${params}`);
      setStrategicAxes(response.data);
      
      // Calculate statistics
      const total = response.data.length;
      const active = response.data.filter(axis => axis.isActive).length;
      const byDepartment = response.data.reduce((acc, axis) => {
        const deptName = axis.department?.name || 'Sin departamento';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {});
      
      setStats({ total, active, byDepartment });
    } catch (error) {
      console.error('Error loading strategic axes:', error);
      setError('Error al cargar los ejes estratégicos');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleOpenDialog = (mode, axis = null) => {
    setDialogMode(mode);
    setSelectedAxis(axis);
    
    if (mode === 'create') {
      setFormData({
        name: '',
        description: '',
        code: '',
        year: filters.year || new Date().getFullYear(),
        departmentId: '',
        isActive: true
      });
    } else if (mode === 'edit' && axis) {
      setFormData({
        name: axis.name,
        description: axis.description || '',
        code: axis.code,
        year: axis.year,
        departmentId: axis.departmentId || '',
        isActive: axis.isActive
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAxis(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      year: new Date().getFullYear(),
      departmentId: '',
      isActive: true
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (!formData.name.trim()) {
        setError('El nombre del eje estratégico es requerido');
        return;
      }
      
      if (!formData.code.trim()) {
        setError('El código del eje estratégico es requerido');
        return;
      }

      const submitData = {
        ...formData,
        departmentId: formData.departmentId || null
      };

      if (dialogMode === 'create') {
        await apiClient.post('/strategic-axes', submitData);
        setSuccess('Eje estratégico creado exitosamente');
      } else if (dialogMode === 'edit') {
        await apiClient.put(`/strategic-axes/${selectedAxis.id}`, submitData);
        setSuccess('Eje estratégico actualizado exitosamente');
      }

      handleCloseDialog();
      loadStrategicAxes();
    } catch (error) {
      console.error('Error saving strategic axis:', error);
      setError(error.response?.data?.message || 'Error al guardar el eje estratégico');
    }
  };

  const handleDelete = async (axis) => {
    if (!window.confirm(`¿Está seguro de eliminar el eje estratégico "${axis.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/strategic-axes/${axis.id}`);
      setSuccess('Eje estratégico eliminado exitosamente');
      loadStrategicAxes();
    } catch (error) {
      console.error('Error deleting strategic axis:', error);
      setError(error.response?.data?.message || 'Error al eliminar el eje estratégico');
    }
  };

  const generateNextCode = () => {
    const currentYear = formData.year;
    const existingCodes = strategicAxes
      .filter(axis => axis.year === currentYear)
      .map(axis => axis.code)
      .sort();
    
    let nextNumber = 1;
    const prefix = 'EE-';
    
    while (existingCodes.includes(`${prefix}${nextNumber.toString().padStart(3, '0')}`)) {
      nextNumber++;
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  const handleGenerateCode = () => {
    const newCode = generateNextCode();
    setFormData(prev => ({ ...prev, code: newCode }));
  };

  if (loading && strategicAxes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎯 Gestión de Ejes Estratégicos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administra los ejes estratégicos del Plan Operativo Anual
        </Typography>
      </Box>

      {/* Alerts */}
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.total}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Ejes
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
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.active}
                  </Typography>
                  <Typography color="text.secondary">
                    Activos
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
                <BusinessIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {Object.keys(stats.byDepartment).length}
                  </Typography>
                  <Typography color="text.secondary">
                    Departamentos
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
                <FilterIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {filters.year}
                  </Typography>
                  <Typography color="text.secondary">
                    Año Actual
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Año"
              type="number"
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) || '' }))}
              fullWidth
              size="small"
            />
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
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.isActive}
                  onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.checked }))}
                />
              }
              label="Solo activos"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog('create')}
              fullWidth
            >
              Nuevo Eje
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Departamento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {strategicAxes.map((axis) => (
              <TableRow key={axis.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {axis.code}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {axis.name}
                    </Typography>
                    {axis.description && (
                      <Typography variant="caption" color="text.secondary">
                        {axis.description.length > 100 
                          ? `${axis.description.substring(0, 100)}...`
                          : axis.description
                        }
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{axis.year}</TableCell>
                <TableCell>
                  {axis.department ? (
                    <Chip 
                      label={axis.department.name} 
                      size="small" 
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin asignar
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={axis.isActive ? 'Activo' : 'Inactivo'}
                    color={axis.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('view', axis)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog('edit', axis)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(axis)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {strategicAxes.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No se encontraron ejes estratégicos con los filtros aplicados
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' && 'Crear Nuevo Eje Estratégico'}
          {dialogMode === 'edit' && 'Editar Eje Estratégico'}
          {dialogMode === 'view' && 'Detalles del Eje Estratégico'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Nombre del Eje Estratégico"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Código"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  required
                  disabled={dialogMode === 'view'}
                  sx={{ flexGrow: 1 }}
                />
                {dialogMode !== 'view' && (
                  <Button
                    variant="outlined"
                    onClick={handleGenerateCode}
                    sx={{ minWidth: 'auto' }}
                  >
                    Auto
                  </Button>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Año"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || '' }))}
                fullWidth
                required
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Departamento Responsable</InputLabel>
                <Select
                  value={formData.departmentId}
                  label="Departamento Responsable"
                  onChange={(e) => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {dialogMode !== 'view' && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label="Activo"
                />
              </Grid>
            )}
            
            {dialogMode === 'view' && selectedAxis && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Creado: {new Date(selectedAxis.createdAt).toLocaleString()}
                  </Typography>
                  {selectedAxis.updatedAt !== selectedAxis.createdAt && (
                    <Typography variant="body2" color="text.secondary">
                      Actualizado: {new Date(selectedAxis.updatedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleSubmit}>
              {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
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

export default StrategicAxesManagement;
