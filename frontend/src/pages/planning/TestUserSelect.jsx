import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const TestUserSelect = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);

  const apiClient = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('🧪 TestUserSelect: Cargando datos...');
      
      // Cargar usuarios
      const usersResponse = await apiClient.get('/users?isActive=true');
      console.log('👥 Usuarios recibidos:', usersResponse.data);
      setUsers(usersResponse.data.data || []);
      
      // Cargar actividades
      const activitiesResponse = await apiClient.get('/activities');
      console.log('📋 Actividades recibidas:', activitiesResponse.data);
      setActivities(activitiesResponse.data.data || []);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDialog = (activity) => {
    console.log('🎯 Abriendo diálogo para actividad:', activity);
    setSelectedActivity(activity);
    setSelectedUser('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedActivity(null);
    setSelectedUser('');
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedActivity) return;
    
    try {
      setLoading(true);
      await apiClient.post(`/activities/${selectedActivity.id}/assignments`, {
        userId: selectedUser,
        isMain: false
      });
      alert('Usuario asignado exitosamente');
      handleCloseDialog();
      loadData(); // Recargar datos
    } catch (error) {
      console.error('❌ Error asignando usuario:', error);
      alert('Error al asignar usuario: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        🧪 Test de Selección de Usuarios
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>
        📊 Estadísticas:
      </Typography>
      <Typography>• Usuarios cargados: {users.length}</Typography>
      <Typography>• Actividades cargadas: {activities.length}</Typography>
      
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          👥 Lista de Usuarios:
        </Typography>
        {users.map((user, index) => (
          <Typography key={user.id}>
            {index + 1}. {user.firstName} {user.lastName} ({user.email})
          </Typography>
        ))}
      </Box>
      
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          📋 Actividades disponibles:
        </Typography>
        {activities.slice(0, 5).map((activity) => (
          <Box key={activity.id} mb={1}>
            <Button 
              variant="outlined" 
              onClick={() => handleOpenDialog(activity)}
              size="small"
            >
              Asignar a: {activity.name}
            </Button>
            <Typography variant="caption" display="block">
              Asignaciones actuales: {activity.assignments?.length || 0}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Dialog de prueba */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          🧪 Test: Asignar Usuario
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Actividad: {selectedActivity?.name}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Usuarios ya asignados: {selectedActivity?.assignments?.length || 0}
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }} required>
            <InputLabel>Seleccionar Usuario</InputLabel>
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              label="Seleccionar Usuario"
            >
              {users.map((user) => {
                const isAssigned = selectedActivity?.assignments?.some(
                  assignment => assignment.userId === user.id
                );
                
                return (
                  <MenuItem 
                    key={user.id} 
                    value={user.id}
                    disabled={isAssigned}
                  >
                    {user.firstName} {user.lastName} 
                    {isAssigned ? ' (Ya asignado)' : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAssign} 
            variant="contained" 
            disabled={!selectedUser || loading}
          >
            {loading ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestUserSelect;
