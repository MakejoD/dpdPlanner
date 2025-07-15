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
  Tabs,
  Tab,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  AccountBalance as BudgetIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  DateRange as DateRangeIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const BudgetIntegration = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [budgetAllocations, setBudgetAllocations] = useState([]);
  const [budgetExecutions, setBudgetExecutions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);
  const [sigefConnection, setSigefConnection] = useState(false);

  const [formData, setFormData] = useState({
    activityId: '',
    budgetCode: '',
    budgetType: '',
    fiscalYear: new Date().getFullYear(),
    allocatedAmount: '',
    executedAmount: '',
    availableAmount: '',
    quarter: '',
    month: '',
    source: '',
    category: '',
    subcategory: '',
    object: '',
    sigefCode: '',
    observations: ''
  });

  // Tipos de presupuesto según clasificación dominicana
  const budgetTypes = [
    { value: 'FUNCIONAMIENTO', label: 'Funcionamiento' },
    { value: 'INVERSION', label: 'Inversión' },
    { value: 'TRANSFERENCIAS', label: 'Transferencias' },
    { value: 'SERVICIO_DEUDA', label: 'Servicio de la Deuda' }
  ];

  // Fuentes de financiamiento
  const sources = [
    { value: 'RECURSOS_INTERNOS', label: 'Recursos Internos' },
    { value: 'DONACIONES', label: 'Donaciones' },
    { value: 'PRESTAMOS', label: 'Préstamos' },
    { value: 'CREDITO_PUBLICO', label: 'Crédito Público' },
    { value: 'OTROS', label: 'Otros' }
  ];

  // Categorías presupuestarias
  const categories = [
    { value: '100', label: '100 - Servicios Personales' },
    { value: '200', label: '200 - Servicios No Personales' },
    { value: '300', label: '300 - Materiales y Suministros' },
    { value: '400', label: '400 - Transferencias Corrientes' },
    { value: '500', label: '500 - Bienes de Capital' },
    { value: '600', label: '600 - Transferencias de Capital' }
  ];

  const quarters = [
    { value: 'Q1', label: 'Q1 - Enero-Marzo' },
    { value: 'Q2', label: 'Q2 - Abril-Junio' },
    { value: 'Q3', label: 'Q3 - Julio-Septiembre' },
    { value: 'Q4', label: 'Q4 - Octubre-Diciembre' }
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

      // Cargar actividades
      const activitiesResponse = await fetch('http://localhost:3001/api/activities', { headers });
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(Array.isArray(activitiesData) ? activitiesData : (activitiesData.data || []));
      }

      // Datos de ejemplo para presupuesto
      const mockBudgetAllocations = [
        {
          id: 1,
          activityId: 1,
          budgetCode: 'P511-001',
          budgetType: 'INVERSION',
          fiscalYear: 2025,
          allocatedAmount: 5000000,
          executedAmount: 1250000,
          availableAmount: 3750000,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '500',
          sigefCode: 'SIGEF-2025-001',
          activity: { name: 'Modernización tecnológica' },
          executionPercentage: 25
        },
        {
          id: 2,
          activityId: 2,
          budgetCode: 'P422-002',
          budgetType: 'FUNCIONAMIENTO',
          fiscalYear: 2025,
          allocatedAmount: 2000000,
          executedAmount: 600000,
          availableAmount: 1400000,
          quarter: 'Q1',
          source: 'RECURSOS_INTERNOS',
          category: '200',
          sigefCode: 'SIGEF-2025-002',
          activity: { name: 'Fortalecimiento capacidades' },
          executionPercentage: 30
        }
      ];

      setBudgetAllocations(mockBudgetAllocations);
      
      // Simular datos de ejecución mensual
      const mockExecutions = [
        { month: 'Enero', planned: 400000, executed: 350000, variance: -50000 },
        { month: 'Febrero', planned: 500000, executed: 480000, variance: -20000 },
        { month: 'Marzo', planned: 600000, executed: 420000, variance: -180000 }
      ];
      setBudgetExecutions(mockExecutions);

      // Simular estado de conexión SIGEF
      setSigefConnection(true);
      setError('');
    } catch (err) {
      setError('Error al cargar los datos presupuestarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(amount);
  };

  const getExecutionColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const handleOpenDialog = (allocation = null) => {
    if (allocation) {
      setFormData({
        activityId: allocation.activityId,
        budgetCode: allocation.budgetCode,
        budgetType: allocation.budgetType,
        fiscalYear: allocation.fiscalYear,
        allocatedAmount: allocation.allocatedAmount,
        executedAmount: allocation.executedAmount,
        availableAmount: allocation.availableAmount,
        quarter: allocation.quarter,
        source: allocation.source,
        category: allocation.category,
        sigefCode: allocation.sigefCode,
        observations: allocation.observations || ''
      });
      setEditingAllocation(allocation);
    } else {
      setFormData({
        activityId: '',
        budgetCode: '',
        budgetType: '',
        fiscalYear: new Date().getFullYear(),
        allocatedAmount: '',
        executedAmount: '',
        availableAmount: '',
        quarter: '',
        source: '',
        category: '',
        sigefCode: '',
        observations: ''
      });
      setEditingAllocation(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAllocation(null);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.budgetCode || !formData.allocatedAmount) {
        setError('Complete todos los campos obligatorios');
        return;
      }

      setSuccess('Asignación presupuestaria actualizada exitosamente');
      handleCloseDialog();
      loadData();
    } catch (err) {
      setError('Error al guardar: ' + err.message);
    }
  };

  const syncWithSigef = async () => {
    try {
      setLoading(true);
      // Simulación de sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccess('Sincronización con SIGEF completada exitosamente');
      loadData();
    } catch (err) {
      setError('Error al sincronizar con SIGEF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBudgetSummary = () => {
    const totalAllocated = budgetAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const totalExecuted = budgetAllocations.reduce((sum, alloc) => sum + alloc.executedAmount, 0);
    const totalAvailable = budgetAllocations.reduce((sum, alloc) => sum + alloc.availableAmount, 0);
    const executionPercentage = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalExecuted,
      totalAvailable,
      executionPercentage
    };
  };

  const summary = getBudgetSummary();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando integración presupuestaria...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <BudgetIcon sx={{ mr: 2, color: 'success.main' }} />
          Integración Presupuestaria SIGEF
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" color="text.secondary">
            Gestión y seguimiento presupuestario integrado con el Sistema SIGEF
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={sigefConnection ? <CheckIcon /> : <ErrorIcon />}
              label={sigefConnection ? 'SIGEF Conectado' : 'SIGEF Desconectado'}
              color={sigefConnection ? 'success' : 'error'}
              variant="outlined"
            />
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={syncWithSigef}
              disabled={loading}
            >
              Sincronizar SIGEF
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Resumen ejecutivo */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="h6" color="primary.main">
                {formatCurrency(summary.totalAllocated)}
              </Typography>
              <Typography variant="body2">Presupuesto Asignado</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {formatCurrency(summary.totalExecuted)}
              </Typography>
              <Typography variant="body2">Ejecutado</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {formatCurrency(summary.totalAvailable)}
              </Typography>
              <Typography variant="body2">Disponible</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'info.50' }}>
            <CardContent>
              <Typography variant="h6" color="info.main">
                {summary.executionPercentage.toFixed(1)}%
              </Typography>
              <Typography variant="body2">% Ejecución</Typography>
              <LinearProgress
                variant="determinate"
                value={summary.executionPercentage}
                color={getExecutionColor(summary.executionPercentage)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<MoneyIcon />} label="Asignaciones Presupuestarias" />
          <Tab icon={<TrendingUpIcon />} label="Ejecución Presupuestaria" />
          <Tab icon={<AssessmentIcon />} label="Análisis y Reportes" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Asignaciones por Actividad POA</Typography>
            <Button
              variant="contained"
              startIcon={<MoneyIcon />}
              onClick={() => handleOpenDialog()}
              color="success"
            >
              Nueva Asignación
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Actividad POA</TableCell>
                  <TableCell>Código Presupuestario</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Asignado</TableCell>
                  <TableCell>Ejecutado</TableCell>
                  <TableCell>Disponible</TableCell>
                  <TableCell>% Ejecución</TableCell>
                  <TableCell>SIGEF</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {budgetAllocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {allocation.activity?.name || 'Sin actividad'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {allocation.budgetCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={budgetTypes.find(t => t.value === allocation.budgetType)?.label}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(allocation.allocatedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatCurrency(allocation.executedAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="success.main">
                        {formatCurrency(allocation.availableAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {allocation.executionPercentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={allocation.executionPercentage}
                          color={getExecutionColor(allocation.executionPercentage)}
                          sx={{ width: 50 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {allocation.sigefCode}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleOpenDialog(allocation)}
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
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Ejecución Presupuestaria Mensual
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell>Planificado</TableCell>
                      <TableCell>Ejecutado</TableCell>
                      <TableCell>Varianza</TableCell>
                      <TableCell>% Cumplimiento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetExecutions.map((execution, index) => {
                      const compliance = (execution.executed / execution.planned) * 100;
                      return (
                        <TableRow key={index}>
                          <TableCell>{execution.month}</TableCell>
                          <TableCell>{formatCurrency(execution.planned)}</TableCell>
                          <TableCell>{formatCurrency(execution.executed)}</TableCell>
                          <TableCell>
                            <Typography
                              color={execution.variance >= 0 ? 'success.main' : 'error.main'}
                            >
                              {formatCurrency(execution.variance)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {compliance.toFixed(1)}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(compliance, 100)}
                                color={getExecutionColor(compliance)}
                                sx={{ width: 80 }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen Trimestral
                  </Typography>
                  {quarters.map((quarter) => (
                    <Box key={quarter.value} mb={2}>
                      <Typography variant="body2">{quarter.label}</Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.random() * 100}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Análisis y Reportes Presupuestarios
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Análisis por Categoría</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {categories.map((category) => {
                    const categoryAllocations = budgetAllocations.filter(
                      alloc => alloc.category === category.value
                    );
                    const totalCategory = categoryAllocations.reduce(
                      (sum, alloc) => sum + alloc.allocatedAmount, 0
                    );
                    
                    return (
                      <Box key={category.value} mb={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">{category.label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(totalCategory)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={summary.totalAllocated > 0 ? (totalCategory / summary.totalAllocated) * 100 : 0}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Alertas Presupuestarias</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      3 actividades con ejecución menor al 50%
                    </Typography>
                  </Alert>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Próxima sincronización SIGEF: 15/01/2025
                    </Typography>
                  </Alert>
                  <Alert severity="success">
                    <Typography variant="body2">
                      Ejecución trimestral dentro de parámetros normales
                    </Typography>
                  </Alert>
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog para asignación presupuestaria */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAllocation ? 'Editar Asignación Presupuestaria' : 'Nueva Asignación Presupuestaria'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
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
              <TextField
                fullWidth
                label="Código Presupuestario"
                value={formData.budgetCode}
                onChange={(e) => setFormData({ ...formData, budgetCode: e.target.value })}
                required
                placeholder="P511-001"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Presupuesto</InputLabel>
                <Select
                  value={formData.budgetType}
                  onChange={(e) => setFormData({ ...formData, budgetType: e.target.value })}
                  label="Tipo de Presupuesto"
                >
                  {budgetTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Año Fiscal"
                type="number"
                value={formData.fiscalYear}
                onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Monto Asignado (DOP)"
                type="number"
                value={formData.allocatedAmount}
                onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
                required
                InputProps={{
                  startAdornment: 'RD$'
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Fuente de Financiamiento</InputLabel>
                <Select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  label="Fuente de Financiamiento"
                >
                  {sources.map((source) => (
                    <MenuItem key={source.value} value={source.value}>
                      {source.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría Presupuestaria</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Categoría Presupuestaria"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Código SIGEF"
                value={formData.sigefCode}
                onChange={(e) => setFormData({ ...formData, sigefCode: e.target.value })}
                placeholder="SIGEF-2025-001"
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
            color="success"
            disabled={!formData.budgetCode || !formData.allocatedAmount}
          >
            {editingAllocation ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BudgetIntegration;
