import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControlLabel,
  Switch,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  TrackChanges as TargetIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { httpClient } from '../../utils/api';

const ObjectiveManagement = () => {
  const { user, hasPermission } = useAuth();
  const [objectives, setObjectives] = useState([]);
  const [strategicAxes, setStrategicAxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [selectedAxisId, setSelectedAxisId] = useState('');
  const [groupByAxis, setGroupByAxis] = useState(true);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    strategicAxisId: '',
    order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const showAlert = (message, severity = 'info') => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ open: false, message: '', severity: 'info' });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Cargando datos de objetivos...');
      
      // Cargar ejes estratégicos y objetivos
      const [axesResponse, objectivesResponse] = await Promise.all([
        httpClient.get('/strategic-axes'),
        httpClient.get('/objectives')
      ]);
      
      console.log('Respuesta de ejes estratégicos:', axesResponse);
      console.log('Respuesta de objetivos:', objectivesResponse);
      
      // Usar la nueva estructura de respuesta de las APIs
      setStrategicAxes(axesResponse?.data || []);
      setObjectives(objectivesResponse?.data || []);
      
      if (!axesResponse?.success) {
        showAlert(axesResponse?.message || 'Error al cargar ejes estratégicos', 'error');
      }
      
      if (!objectivesResponse?.success) {
        showAlert(objectivesResponse?.message || 'Error al cargar objetivos', 'error');
      }
      
      setError('');
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos del sistema');
      showAlert(err.message || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (objective = null) => {
    if (objective) {
      setFormData({
        name: objective.name,
        description: objective.description,
        code: objective.code,
        strategicAxisId: objective.strategicAxisId,
        order: objective.order
      });
      setEditingObjective(objective);
    } else {
      setFormData({
        name: '',
        description: '',
        code: '',
        strategicAxisId: selectedAxisId || '',
        order: 0
      });
      setEditingObjective(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingObjective(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      strategicAxisId: '',
      order: 0
    });
  };

  const handleSubmit = async () => {
    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        code: formData.code,
        strategicAxisId: formData.strategicAxisId,
        order: formData.order || 0
      };

      let response;
      if (editingObjective) {
        response = await httpClient.put(`/objectives/${editingObjective.id}`, dataToSend);
        showAlert(response.message || 'Objetivo actualizado exitosamente', 'success');
      } else {
        response = await httpClient.post('/objectives', dataToSend);
        showAlert(response.message || 'Objetivo creado exitosamente', 'success');
      }

      handleCloseDialog();
      loadData();
    } catch (err) {
      console.error('Error guardando objetivo:', err);
      showAlert(err.message || 'Error al guardar el objetivo', 'error');
    }
  };

  const handleDelete = async (objective) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el objetivo "${objective.name}"?`)) {
      return;
    }

    try {
      const response = await httpClient.delete(`/objectives/${objective.id}`);
      showAlert(response.message || 'Objetivo eliminado exitosamente', 'success');
      loadData();
    } catch (err) {
      console.error('Error eliminando objetivo:', err);
      showAlert(err.message || 'Error al eliminar el objetivo', 'error');
    }
  };

  const getFilteredObjectives = () => {
    if (selectedAxisId) {
      return objectives.filter(obj => obj.strategicAxisId === selectedAxisId);
    }
    return objectives;
  };

  const getObjectivesByAxis = () => {
    const grouped = {};
    strategicAxes.forEach(axis => {
      grouped[axis.id] = {
        axis: axis,
        objectives: objectives.filter(obj => obj.strategicAxisId === axis.id)
      };
    });
    return grouped;
  };

  const generateCode = (axisCode) => {
    const axisObjectives = objectives.filter(obj => 
      obj.strategicAxis?.code === axisCode
    );
    const nextNumber = axisObjectives.length + 1;
    return `OBJ-${axisCode.split('-')[1]}-${nextNumber.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando objetivos...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <TargetIcon sx={{ mr: 2, color: 'primary.main' }} />
          Gestión de Objetivos Estratégicos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure y administre los objetivos estratégicos del POA
        </Typography>
      </Box>

      {/* Barra de herramientas */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Nuevo Objetivo
        </Button>
      </Box>

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

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Eje Estratégico</InputLabel>
                <Select
                  value={selectedAxisId}
                  onChange={(e) => setSelectedAxisId(e.target.value)}
                  label="Filtrar por Eje Estratégico"
                >
                  <MenuItem value="">Todos los ejes</MenuItem>
                  {strategicAxes.map((axis) => (
                    <MenuItem key={axis.id} value={axis.id}>
                      {axis.code} - {axis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={groupByAxis}
                    onChange={(e) => setGroupByAxis(e.target.checked)}
                  />
                }
                label="Agrupar por Eje Estratégico"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Objetivos */}
      {groupByAxis ? (
        // Vista agrupada por eje estratégico
        <Box>
          {Object.entries(getObjectivesByAxis()).map(([axisId, group]) => (
            <Accordion key={axisId} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Chip label={group.axis.code} color="primary" />
                  <Typography variant="h6">
                    {group.axis.name}
                  </Typography>
                  <Chip 
                    label={`${group.objectives.length} objetivos`} 
                    size="small" 
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Productos</TableCell>
                        <TableCell>Indicadores</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.objectives.map((objective) => (
                        <TableRow key={objective.id}>
                          <TableCell>
                            <Chip label={objective.code} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {objective.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {objective.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={objective._count.products} 
                              size="small" 
                              color="secondary"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={objective._count.indicators} 
                              size="small" 
                              color="info"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleOpenDialog(objective)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(objective)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {group.objectives.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography color="textSecondary">
                              No hay objetivos definidos para este eje estratégico
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        // Vista de tabla simple
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Eje Estratégico</TableCell>
                <TableCell>Productos</TableCell>
                <TableCell>Indicadores</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredObjectives().map((objective) => (
                <TableRow key={objective.id}>
                  <TableCell>
                    <Chip label={objective.code} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {objective.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {objective.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${objective.strategicAxis?.code} - ${objective.strategicAxis?.name}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={objective._count.products} 
                      size="small" 
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={objective._count.indicators} 
                      size="small" 
                      color="info"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleOpenDialog(objective)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(objective)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {getFilteredObjectives().length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No hay objetivos disponibles
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar objetivo */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingObjective ? 'Editar Objetivo' : 'Crear Nuevo Objetivo'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Objetivo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Ej: OBJ-001-01"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth required>
                <InputLabel>Eje Estratégico</InputLabel>
                <Select
                  value={formData.strategicAxisId}
                  onChange={(e) => {
                    const selectedAxis = strategicAxes.find(axis => axis.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      strategicAxisId: e.target.value,
                      code: selectedAxis ? generateCode(selectedAxis.code) : formData.code
                    });
                  }}
                  label="Eje Estratégico"
                >
                  {strategicAxes.map((axis) => (
                    <MenuItem key={axis.id} value={axis.id}>
                      {axis.code} - {axis.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Orden"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.description || !formData.code || !formData.strategicAxisId}
          >
            {editingObjective ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear nuevo objetivo - Solo móviles */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ObjectiveManagement;
