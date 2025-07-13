import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Alert,
  Snackbar,
  Grid,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const DepartmentManagement = () => {
  const { user, hasPermission } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    parentId: '',
    isActive: true
  });

  // Cargar departamentos
  const loadDepartments = async () => {
    try {
      setLoading(true);
      console.log('Cargando departamentos...');
      const response = await httpClient.get('/departments');
      console.log('Respuesta de departamentos:', response);
      setDepartments(response || []);
    } catch (error) {
      console.error('Error cargando departamentos:', error);
      setDepartments([]); // Asegurar que siempre sea un array
      showAlert('Error al cargar departamentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        code: department.code || '',
        parentId: department.parentId || '',
        isActive: department.isActive
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: '',
        description: '',
        code: '',
        parentId: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDepartment(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      parentId: '',
      isActive: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Crear o actualizar departamento
  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        showAlert('El nombre del departamento es requerido', 'error');
        return;
      }

      const dataToSend = {
        ...formData,
        parentId: formData.parentId || null
      };

      if (editingDepartment) {
        await httpClient.put(`/departments/${editingDepartment.id}`, dataToSend);
        showAlert('Departamento actualizado exitosamente', 'success');
      } else {
        await httpClient.post('/departments', dataToSend);
        showAlert('Departamento creado exitosamente', 'success');
      }

      handleCloseDialog();
      loadDepartments();
    } catch (error) {
      console.error('Error guardando departamento:', error);
      const message = error.response?.data?.message || 'Error al guardar departamento';
      showAlert(message, 'error');
    }
  };

  // Eliminar departamento
  const handleDelete = async (department) => {
    if (!window.confirm(`¿Está seguro de eliminar el departamento "${department.name}"?`)) {
      return;
    }

    try {
      await httpClient.delete(`/departments/${department.id}`);
      showAlert('Departamento eliminado exitosamente', 'success');
      loadDepartments();
    } catch (error) {
      console.error('Error eliminando departamento:', error);
      const message = error.response?.data?.message || 'Error al eliminar departamento';
      showAlert(message, 'error');
    }
  };

  // Obtener departamentos raíz (sin padre) para el select
  const rootDepartments = (departments || []).filter(dept => !dept.parentId);

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
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountTreeIcon sx={{ mr: 2 }} />
          Gestión de Departamentos
        </Typography>
        {hasPermission('create', 'department') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Departamento
          </Button>
        )}
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Departamentos
              </Typography>
              <Typography variant="h4">
                {(departments || []).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Departamentos Raíz
              </Typography>
              <Typography variant="h4">
                {rootDepartments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuarios Asignados
              </Typography>
              <Typography variant="h4">
                {(departments || []).reduce((sum, dept) => sum + (dept._count?.users || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Departamentos Activos
              </Typography>
              <Typography variant="h4">
                {(departments || []).filter(dept => dept.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de departamentos */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Departamento</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Departamento Padre</TableCell>
                <TableCell align="center">Usuarios</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(departments || []).map((department) => (
                <TableRow key={department.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {department.name}
                        </Typography>
                        {department.description && (
                          <Typography variant="caption" color="textSecondary">
                            {department.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {department.code ? (
                      <Chip label={department.code} size="small" variant="outlined" />
                    ) : (
                      <Typography variant="body2" color="textSecondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {department.parent?.name || 
                      <Typography variant="body2" color="textSecondary">Departamento raíz</Typography>
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={<PeopleIcon />}
                      label={department._count?.users || 0}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={department.isActive ? 'Activo' : 'Inactivo'}
                      color={department.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(department)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(department)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {(departments || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay departamentos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo para crear/editar departamento */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Editar Departamento' : 'Nuevo Departamento'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Nombre del Departamento"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="code"
                  label="Código"
                  fullWidth
                  value={formData.code}
                  onChange={handleInputChange}
                  helperText="Código único para identificar el departamento"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Departamento Padre</InputLabel>
                  <Select
                    name="parentId"
                    value={formData.parentId}
                    label="Departamento Padre"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">Sin padre (Departamento raíz)</MenuItem>
                    {rootDepartments
                      .filter(dept => dept.id !== editingDepartment?.id)
                      .map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code || 'Sin código'})
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                  }
                  label="Departamento Activo"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingDepartment ? 'Actualizar' : 'Crear'}
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

export default DepartmentManagement;
