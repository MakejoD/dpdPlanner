import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Security as SecurityIcon,
  Group as GroupIcon,
  Key as KeyIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const RoleManagement = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos de roles y permisos...');
      
      const [rolesResponse, permissionsResponse] = await Promise.all([
        httpClient.get('/roles?includePermissions=true'),
        httpClient.get('/permissions')
      ]);
      
      console.log('Respuesta de roles:', rolesResponse);
      console.log('Respuesta de permisos:', permissionsResponse);
      
      setRoles(rolesResponse || []);
      setPermissions(permissionsResponse || []);
      setError('');
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos del sistema');
      setRoles([]);
      setPermissions([]);
      showAlert('Error al cargar datos del sistema', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo para crear/editar rol
  const handleOpenDialog = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions?.map(p => p.id) || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  // Crear o actualizar rol
  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.name.trim()) {
        showAlert('El nombre del rol es requerido', 'error');
        return;
      }

      if (!formData.description.trim()) {
        showAlert('La descripción del rol es requerida', 'error');
        return;
      }

      if (formData.permissions.length === 0) {
        showAlert('Debe asignar al menos un permiso al rol', 'error');
        return;
      }

      const dataToSend = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions
      };

      if (editingRole) {
        await httpClient.put(`/roles/${editingRole.id}`, dataToSend);
        showAlert('Rol actualizado exitosamente', 'success');
      } else {
        await httpClient.post('/roles', dataToSend);
        showAlert('Rol creado exitosamente', 'success');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error guardando rol:', error);
      const message = error.response?.data?.message || 'Error al guardar rol';
      showAlert(message, 'error');
    }
  };

  // Eliminar rol
  const handleDelete = async (role) => {
    if (!window.confirm(`¿Está seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      await httpClient.delete(`/roles/${role.id}`);
      showAlert('Rol eliminado exitosamente', 'success');
      loadData();
    } catch (error) {
      console.error('Error eliminando rol:', error);
      const message = error.response?.data?.message || 'Error al eliminar rol';
      showAlert(message, 'error');
    }
  };

  // Agrupar permisos por recurso
  const groupPermissionsByResource = () => {
    const grouped = {};
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
  };

  const getPermissionBadgeColor = (action) => {
    const colors = {
      'create': 'success',
      'read': 'info', 
      'update': 'warning',
      'delete': 'error',
      'approve': 'secondary',
      'reject': 'secondary',
      'lock': 'default',
      'export': 'primary'
    };
    return colors[action] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const groupedPermissions = groupPermissionsByResource();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 2 }} />
            Gestión de Roles y Permisos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sistema RBAC para configurar roles y asignar permisos granulares por recurso y acción
          </Typography>
        </Box>
        {hasPermission('create', 'role') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Rol
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Roles
                  </Typography>
                  <Typography variant="h4">
                    {roles.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <KeyIcon sx={{ mr: 2, color: 'secondary.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Permisos
                  </Typography>
                  <Typography variant="h4">
                    {permissions.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ShieldIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Recursos Protegidos
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(groupedPermissions).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Usuarios con Roles
                  </Typography>
                  <Typography variant="h4">
                    {roles.reduce((sum, role) => sum + (role.userCount || 0), 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Roles */}
      <Paper sx={{ mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rol</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="center">Permisos</TableCell>
                <TableCell align="center">Usuarios</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {role.name}
                      </Typography>
                      <Chip
                        label={role.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${role.permissions?.length || 0} permisos`}
                      size="small"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${role.userCount || 0} usuarios`}
                      size="small"
                      color={role.userCount > 0 ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Ver permisos">
                        <IconButton
                          size="small"
                          onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Tooltip>
                      {hasPermission('update', 'role') && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(role)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {hasPermission('delete', 'role') && (
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(role)}
                            color="error"
                            disabled={role.userCount > 0} // No eliminar roles con usuarios
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {roles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No hay roles registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Detalle de Permisos por Rol */}
      {expandedRole && (
        <Paper sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Permisos del Rol: {roles.find(r => r.id === expandedRole)?.name}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {roles
                .find(r => r.id === expandedRole)
                ?.permissions?.map((permission) => (
                  <Grid item key={permission.id}>
                    <Chip
                      label={`${permission.action}:${permission.resource}`}
                      size="small"
                      color={getPermissionBadgeColor(permission.action)}
                    />
                  </Grid>
                )) || (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No hay permisos asignados a este rol
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Diálogo para crear/editar rol */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Nombre del Rol"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Administrador, Editor, etc."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="description"
                  label="Descripción"
                  fullWidth
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe las responsabilidades del rol"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Permisos del Rol
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selecciona los permisos que tendrá este rol. Los permisos están agrupados por recurso.
                </Typography>
                
                {Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => (
                  <Accordion key={resource} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                        {resource.replace('_', ' ')} 
                        <Chip 
                          label={`${resourcePermissions.filter(p => formData.permissions.includes(p.id)).length}/${resourcePermissions.length}`}
                          size="small" 
                          sx={{ ml: 2 }}
                        />
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <FormGroup>
                        <Grid container spacing={1}>
                          {resourcePermissions.map((permission) => (
                            <Grid item xs={12} sm={6} md={4} key={permission.id}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={formData.permissions.includes(permission.id)}
                                    onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Chip
                                      label={permission.action}
                                      size="small"
                                      color={getPermissionBadgeColor(permission.action)}
                                      sx={{ mr: 1 }}
                                    />
                                    <Typography variant="body2">
                                      {permission.action}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </FormGroup>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<SaveIcon />}
          >
            {editingRole ? 'Actualizar' : 'Crear'}
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

export default RoleManagement;
