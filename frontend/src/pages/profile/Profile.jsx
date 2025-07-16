
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Avatar, Chip, Divider, TextField, Button, Grid, Alert, Stack, FormControl, Select, MenuItem } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

import httpClient from '../../utils/api';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    departmentId: user?.department?.id || '',
  });
  useEffect(() => {
    // Cargar departamentos para el select
    const fetchDepartments = async () => {
      try {
        const response = await httpClient.get('/departments');
        setDepartments(response.data || []);
      } catch (error) {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, []);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      department: user?.department?.name || '',
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile(form);
      setSuccess('Perfil actualizado correctamente');
      setEditMode(false);
    } catch (err) {
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas nuevas no coinciden');
      setLoading(false);
      return;
    }
    try {
      await changePassword(passwords.current, passwords.new);
      setSuccess('Contraseña cambiada correctamente');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError('Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ width: 64, height: 64 }} src={user?.avatarUrl}>
            {user?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{user?.firstName} {user?.lastName}</Typography>
            <Typography color="text.secondary">{user?.email}</Typography>
            <Chip label={user?.role?.name} color="primary" sx={{ mt: 1 }} />
            {user?.department && (
              <Chip label={user.department.name} color="secondary" sx={{ ml: 1 }} />
            )}
          </Box>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Datos personales</Typography>
            <TextField
              label="Nombre"
              value={form.firstName}
              onChange={e => setForm({ ...form, firstName: e.target.value })}
              fullWidth
              disabled={!editMode}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Apellido"
              value={form.lastName}
              onChange={e => setForm({ ...form, lastName: e.target.value })}
              fullWidth
              disabled={!editMode}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              fullWidth
              disabled={!editMode}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>Departamento</Typography>
              <Select
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
                disabled={!editMode}
                displayEmpty
              >
                <MenuItem value="">Sin departamento</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} {dept.code ? `(${dept.code})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!editMode ? (
              <Button variant="outlined" onClick={handleEdit} sx={{ mt: 1 }}>Editar perfil</Button>
            ) : (
              <Box>
                <Button variant="contained" color="primary" onClick={handleSave} disabled={loading} sx={{ mr: 1 }}>Guardar</Button>
                <Button variant="outlined" onClick={handleCancel} disabled={loading}>Cancelar</Button>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Cambiar contraseña</Typography>
            <TextField
              label="Contraseña actual"
              type="password"
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Nueva contraseña"
              type="password"
              value={passwords.new}
              onChange={e => setPasswords({ ...passwords, new: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="secondary" onClick={handlePasswordChange} disabled={loading}>Cambiar contraseña</Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Permisos asignados</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {user?.role?.rolePermissions?.map((rp, idx) => (
            <Chip key={idx} label={rp.permission.action + ':' + rp.permission.resource} size="small" />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default Profile
