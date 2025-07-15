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
  Grid,
  FormControlLabel,
  Switch,
  Fab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as PACCIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Assignment as DocumentIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const PACCManagement = () => {
  const [procurements, setProcurements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProcurement, setEditingProcurement] = useState(null);
  const [groupByCategory, setGroupByCategory] = useState(true);

  const [formData, setFormData] = useState({
    activityId: '',
    description: '',
    procurementType: '',
    procurementMethod: '',
    estimatedAmount: '',
    currency: 'DOP',
    plannedStartDate: '',
    plannedEndDate: '',
    quarter: '',
    month: '',
    status: 'PLANIFICADO',
    observations: '',
    budgetCode: '',
    isRecurrent: false,
    legalFramework: 'LEY_340_06',
    priority: 'MEDIA'
  });

  // Tipos de contratación según normativa dominicana
  const procurementTypes = [
    { value: 'BIENES', label: 'Bienes' },
    { value: 'SERVICIOS', label: 'Servicios' },
    { value: 'OBRAS', label: 'Obras' },
    { value: 'CONSULTORIA', label: 'Consultoría' },
    { value: 'ARRENDAMIENTO', label: 'Arrendamiento' },
    { value: 'SEGURO', label: 'Seguros' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento' }
  ];

  // Métodos de contratación según Ley 340-06
  const procurementMethods = [
    { value: 'LICITACION_PUBLICA', label: 'Licitación Pública' },
    { value: 'LICITACION_RESTRINGIDA', label: 'Licitación Restringida' },
    { value: 'COMPARACION_PRECIOS', label: 'Comparación de Precios' },
    { value: 'COMPRA_MENOR', label: 'Compra Menor' },
    { value: 'SUBASTA_INVERSA', label: 'Subasta Inversa' },
    { value: 'CONTRATACION_DIRECTA', label: 'Contratación Directa' },
    { value: 'EMERGENCIA', label: 'Emergencia' }
  ];

  const quarters = [
    { value: 'Q1', label: 'Primer Trimestre' },
    { value: 'Q2', label: 'Segundo Trimestre' },
    { value: 'Q3', label: 'Tercer Trimestre' },
    { value: 'Q4', label: 'Cuarto Trimestre' }
  ];

  const priorities = [
    { value: 'ALTA', label: 'Alta', color: 'error' },
    { value: 'MEDIA', label: 'Media', color: 'warning' },
    { value: 'BAJA', label: 'Baja', color: 'info' }
  ];

  const statuses = [
    { value: 'PLANIFICADO', label: 'Planificado', color: 'info' },
    { value: 'EN_PROCESO', label: 'En Proceso', color: 'warning' },
    { value: 'ADJUDICADO', label: 'Adjudicado', color: 'success' },
    { value: 'EJECUTADO', label: 'Ejecutado', color: 'primary' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'error' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Cargar actividades para vincular con el PACC
      const activitiesResponse = await fetch('http://localhost:3001/api/activities', { headers });
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(Array.isArray(activitiesData) ? activitiesData : (activitiesData.data || []));
      }

      // Cargar procesos de compras (simulado por ahora)
      const mockProcurements = [
        {
          id: 1,
          activityId: 1,
          description: 'Adquisición de equipos informáticos',
          procurementType: 'BIENES',
          procurementMethod: 'LICITACION_PUBLICA',
          estimatedAmount: 2500000,
          currency: 'DOP',
          plannedStartDate: '2025-03-01',
          plannedEndDate: '2025-05-30',
          quarter: 'Q2',
          month: 'Marzo',
          status: 'PLANIFICADO',
          priority: 'ALTA',
          budgetCode: 'P511-001',
          isRecurrent: false,
          activity: { name: 'Modernización tecnológica' }
        },
        {
          id: 2,
          activityId: 2,
          description: 'Contratación servicios de capacitación',
          procurementType: 'SERVICIOS',
          procurementMethod: 'COMPARACION_PRECIOS',
          estimatedAmount: 850000,
          currency: 'DOP',
          plannedStartDate: '2025-02-15',
          plannedEndDate: '2025-04-15',
          quarter: 'Q1',
          month: 'Febrero',
          status: 'EN_PROCESO',
          priority: 'MEDIA',
          budgetCode: 'P422-002',
          isRecurrent: true,
          activity: { name: 'Fortalecimiento capacidades' }
        }
      ];

      setProcurements(mockProcurements);
      setError('');
    } catch (err) {
      setError('Error al cargar los datos del PACC: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (procurement = null) => {
    if (procurement) {
      setFormData({
        activityId: procurement.activityId,
        description: procurement.description,
        procurementType: procurement.procurementType,
        procurementMethod: procurement.procurementMethod,
        estimatedAmount: procurement.estimatedAmount,
        currency: procurement.currency,
        plannedStartDate: procurement.plannedStartDate,
        plannedEndDate: procurement.plannedEndDate,
        quarter: procurement.quarter,
        month: procurement.month,
        status: procurement.status,
        observations: procurement.observations || '',
        budgetCode: procurement.budgetCode,
        isRecurrent: procurement.isRecurrent,
        legalFramework: procurement.legalFramework || 'LEY_340_06',
        priority: procurement.priority
      });
      setEditingProcurement(procurement);
    } else {
      setFormData({
        activityId: '',
        description: '',
        procurementType: '',
        procurementMethod: '',
        estimatedAmount: '',
        currency: 'DOP',
        plannedStartDate: '',
        plannedEndDate: '',
        quarter: '',
        month: '',
        status: 'PLANIFICADO',
        observations: '',
        budgetCode: '',
        isRecurrent: false,
        legalFramework: 'LEY_340_06',
        priority: 'MEDIA'
      });
      setEditingProcurement(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProcurement(null);
  };

  const handleSubmit = async () => {
    try {
      // Validaciones
      if (!formData.description || !formData.procurementType || !formData.estimatedAmount) {
        setError('Complete todos los campos obligatorios');
        return;
      }

      // Simulación de guardado
      setSuccess(editingProcurement ? 'Proceso de compra actualizado exitosamente' : 'Proceso de compra creado exitosamente');
      handleCloseDialog();
      loadData();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getProcurementsByCategory = () => {
    const grouped = {};
    procurementTypes.forEach(type => {
      grouped[type.value] = {
        type: type,
        procurements: procurements.filter(proc => proc.procurementType === type.value)
      };
    });
    return grouped;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando Plan Anual de Compras y Contrataciones...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <PACCIcon sx={{ mr: 2, color: 'warning.main' }} />
          Plan Anual de Compras y Contrataciones (PACC)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestión del PACC según Ley 340-06 de Compras y Contrataciones de la República Dominicana
        </Typography>
      </Box>

      {/* Estadísticas resumidas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.50' }}>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {procurements.length}
              </Typography>
              <Typography variant="body2">Total Procesos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {formatCurrency(procurements.reduce((sum, proc) => sum + proc.estimatedAmount, 0))}
              </Typography>
              <Typography variant="body2">Monto Total Estimado</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {procurements.filter(p => p.status === 'EN_PROCESO').length}
              </Typography>
              <Typography variant="body2">En Proceso</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'error.50' }}>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {procurements.filter(p => p.priority === 'ALTA').length}
              </Typography>
              <Typography variant="body2">Alta Prioridad</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controles */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <FormControlLabel
          control={
            <Switch
              checked={groupByCategory}
              onChange={(e) => setGroupByCategory(e.target.checked)}
            />
          }
          label="Agrupar por Tipo de Contratación"
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
        >
          Nuevo Proceso PACC
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

      {/* Lista de procesos */}
      {groupByCategory ? (
        // Vista agrupada por tipo
        <Box>
          {Object.entries(getProcurementsByCategory()).map(([typeKey, group]) => (
            group.procurements.length > 0 && (
              <Accordion key={typeKey} defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <BusinessIcon color="warning" />
                    <Typography variant="h6">
                      {group.type.label}
                    </Typography>
                    <Chip 
                      label={`${group.procurements.length} procesos`} 
                      size="small" 
                      variant="outlined"
                      color="warning"
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Actividad POA</TableCell>
                          <TableCell>Método</TableCell>
                          <TableCell>Monto Estimado</TableCell>
                          <TableCell>Trimestre</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Prioridad</TableCell>
                          <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {group.procurements.map((procurement) => (
                          <TableRow key={procurement.id}>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {procurement.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Código: {procurement.budgetCode}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {procurement.activity?.name || 'Sin actividad'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={procurementMethods.find(m => m.value === procurement.procurementMethod)?.label}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatCurrency(procurement.estimatedAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={procurement.quarter}
                                size="small"
                                color="info"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={statuses.find(s => s.value === procurement.status)?.label}
                                size="small"
                                color={statuses.find(s => s.value === procurement.status)?.color}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={priorities.find(p => p.value === procurement.priority)?.label}
                                size="small"
                                color={priorities.find(p => p.value === procurement.priority)?.color}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                onClick={() => handleOpenDialog(procurement)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )
          ))}
        </Box>
      ) : (
        // Vista de tabla simple
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Monto Estimado</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Prioridad</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {procurements.map((procurement) => (
                <TableRow key={procurement.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {procurement.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={procurementTypes.find(t => t.value === procurement.procurementType)?.label}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {procurementMethods.find(m => m.value === procurement.procurementMethod)?.label}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(procurement.estimatedAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={statuses.find(s => s.value === procurement.status)?.label}
                      size="small"
                      color={statuses.find(s => s.value === procurement.status)?.color}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={priorities.find(p => p.value === procurement.priority)?.label}
                      size="small"
                      color={priorities.find(p => p.value === procurement.priority)?.color}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleOpenDialog(procurement)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar proceso */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingProcurement ? 'Editar Proceso PACC' : 'Nuevo Proceso PACC'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción del Proceso"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Actividad POA</InputLabel>
                <Select
                  value={formData.activityId}
                  onChange={(e) => setFormData({ ...formData, activityId: e.target.value })}
                  label="Actividad POA"
                >
                  {activities.map((activity) => (
                    <MenuItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Contratación</InputLabel>
                <Select
                  value={formData.procurementType}
                  onChange={(e) => setFormData({ ...formData, procurementType: e.target.value })}
                  label="Tipo de Contratación"
                >
                  {procurementTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Método de Contratación</InputLabel>
                <Select
                  value={formData.procurementMethod}
                  onChange={(e) => setFormData({ ...formData, procurementMethod: e.target.value })}
                  label="Método de Contratación"
                >
                  {procurementMethods.map((method) => (
                    <MenuItem key={method.value} value={method.value}>
                      {method.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monto Estimado (DOP)"
                type="number"
                value={formData.estimatedAmount}
                onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                required
                InputProps={{
                  startAdornment: 'RD$'
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trimestre</InputLabel>
                <Select
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  label="Trimestre"
                >
                  {quarters.map((quarter) => (
                    <MenuItem key={quarter.value} value={quarter.value}>
                      {quarter.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Estado"
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Prioridad"
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código Presupuestario"
                value={formData.budgetCode}
                onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                placeholder="Ej: P511-001"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecurrent}
                    onChange={(e) => setFormData({ ...formData, isRecurrent: e.target.checked })}
                  />
                }
                label="Contratación Recurrente"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            sx={{ bgcolor: 'warning.main', '&:hover': { bgcolor: 'warning.dark' } }}
            disabled={!formData.description || !formData.procurementType || !formData.estimatedAmount}
          >
            {editingProcurement ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear nuevo proceso - Solo móviles */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
          bgcolor: 'warning.main',
          '&:hover': { bgcolor: 'warning.dark' }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default PACCManagement;
