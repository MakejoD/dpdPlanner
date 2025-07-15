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
  CircularProgress,
  Avatar,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  // Estado del formulario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
    departmentId: '',
    isActive: true
  });

  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Cargando datos de usuarios...');
      
      const [usersResponse, rolesResponse, departmentsResponse] = await Promise.all([
        httpClient.get('/users'),
        httpClient.get('/roles'),
        httpClient.get('/departments')
      ]);
      
      console.log('Respuesta de usuarios:', usersResponse);
      console.log('Respuesta de roles:', rolesResponse);
      console.log('Respuesta de departamentos:', departmentsResponse);
      
      // Usar la estructura correcta de respuesta de las APIs
      setUsers(usersResponse?.data || []);
      setRoles(rolesResponse?.data || []);
      setDepartments(departmentsResponse?.data || []);
      
      // Debug logging para departamentos
      console.log('Departamentos cargados:', departmentsResponse?.data);
      console.log('Primer usuario departmentId:', usersResponse?.data?.[0]?.departmentId);
      console.log('Primer usuario department:', usersResponse?.data?.[0]?.department);
      
      if (!usersResponse?.success) {
        showAlert(usersResponse?.message || 'Error al cargar usuarios', 'error');
      }
      if (!rolesResponse?.success) {
        showAlert(rolesResponse?.message || 'Error al cargar roles', 'error');
      }
      if (!departmentsResponse?.success) {
        showAlert(departmentsResponse?.message || 'Error al cargar departamentos', 'error');
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Asegurar que siempre tengamos arrays vacíos en caso de error
      setUsers([]);
      setRoles([]);
      setDepartments([]);
      showAlert(error.response?.data?.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        password: '',
        roleId: user.roleId,
        departmentId: user.departmentId || '',
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: '',
        departmentId: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: '',
      departmentId: '',
      isActive: true
    });
    setShowPassword(false);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Crear o actualizar usuario
  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        showAlert('El nombre y apellido son requeridos', 'error');
        return;
      }

      if (!formData.email.trim()) {
        showAlert('El email es requerido', 'error');
        return;
      }

      if (!formData.roleId) {
        showAlert('Debe seleccionar un rol', 'error');
        return;
      }

      if (!editingUser && !formData.password.trim()) {
        showAlert('La contraseña es requerida para usuarios nuevos', 'error');
        return;
      }

      const dataToSend = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        roleId: formData.roleId,
        departmentId: formData.departmentId || null,
        isActive: formData.isActive
      };

      // Solo incluir password si se está creando un usuario o si se proporcionó
      if (!editingUser || formData.password.trim()) {
        dataToSend.password = formData.password;
      }

      let response;
      if (editingUser) {
        response = await httpClient.put(`/users/${editingUser.id}`, dataToSend);
        showAlert(response.data.message || 'Usuario actualizado exitosamente', 'success');
      } else {
        response = await httpClient.post('/users', dataToSend);
        showAlert(response.data.message || 'Usuario creado exitosamente', 'success');
      }

      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      const message = error.response?.data?.message || 'Error al guardar usuario';
      showAlert(message, 'error');
    }
  };

  // Eliminar usuario
  const handleDelete = async (user) => {
    if (!window.confirm(`¿Está seguro de eliminar el usuario "${user.firstName} ${user.lastName}"?`)) {
      return;
    }

    try {
      const response = await httpClient.delete(`/users/${user.id}`);
      showAlert(response.data.message || 'Usuario eliminado exitosamente', 'success');
      loadData();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      const message = error.response?.data?.message || 'Error al eliminar usuario';
      showAlert(message, 'error');
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'Administrador': 'error',
      'Director de Planificación': 'primary',
      'Director de Área': 'secondary',
      'Técnico Registrador': 'success',
      'Auditor': 'warning'
    };
    return colors[roleName] || 'default';
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
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <PeopleIcon sx={{ mr: 2 }} />
          Gestión de Usuarios
        </Typography>
        {hasPermission('create', 'user') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Usuarios
              </Typography>
              <Typography variant="h4">
                {(users || []).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuarios Activos
              </Typography>
              <Typography variant="h4">
                {Array.isArray(users) ? users.filter(user => user.isActive).length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Con Departamento
              </Typography>
              <Typography variant="h4">
                {Array.isArray(users) ? users.filter(user => user.departmentId).length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Roles Únicos
              </Typography>
              <Typography variant="h4">
                {roles.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Búsqueda */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar usuarios por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Tabla de usuarios */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {getInitials(user.firstName, user.lastName)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Creado: {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role?.name || 'Sin rol'}
                      size="small"
                      color={getRoleColor(user.role?.name)}
                      icon={<SecurityIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    {user.department ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {user.department.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Sin departamento
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.isActive ? 'Activo' : 'Inactivo'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user)}
                          color="error"
                          disabled={user.id === user.id} // No eliminar a sí mismo
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo para crear/editar usuario */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="firstName"
                  label="Nombre"
                  fullWidth
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="lastName"
                  label="Apellido"
                  fullWidth
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="password"
                  label={editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required={!editingUser}
                  value={formData.password}
                  onChange={handleInputChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    name="roleId"
                    value={formData.roleId}
                    label="Rol"
                    onChange={handleInputChange}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    name="departmentId"
                    value={formData.departmentId}
                    label="Departamento"
                    onChange={handleInputChange}
                  >
                    <MenuItem value="">Sin departamento</MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>
                        {dept.name} {dept.code && `(${dept.code})`}
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
                  label="Usuario Activo"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingUser ? 'Actualizar' : 'Crear'}
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

export default UserManagement;
