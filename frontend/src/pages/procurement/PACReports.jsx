import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import httpClient from '../../utils/api';

const PACReports = () => {
  const { hasPermission, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({});
  const [selectedReport, setSelectedReport] = useState('overview');
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    departmentId: user?.departmentId || ''
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadReportData();
    loadDepartments();
  }, [selectedReport, filters]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      
      const response = await httpClient.get(`/procurement-processes/reports/${selectedReport}?${params.toString()}`);
      
      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
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

  const handleReportChange = (event, newReport) => {
    if (newReport !== null) {
      setSelectedReport(newReport);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);
      
      const response = await httpClient.get(`/procurement-processes/reports/${selectedReport}/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_pac_${selectedReport}_${filters.fiscalYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exportando reporte:', error);
    }
  };

  const formatCurrency = (amount) => {
    return `RD$${parseFloat(amount || 0).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANIFICADO': return 'default';
      case 'EN_PROCESO': return 'primary';
      case 'ADJUDICADO': return 'success';
      case 'EJECUTADO': return 'info';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };

  const renderOverviewReport = () => {
    const { summary, byStatus, byDepartment, timeline } = reportData;

    return (
      <Grid container spacing={3}>
        {/* Resumen General */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Resumen General del PAC {filters.fiscalYear}
          </Typography>
        </Grid>

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
                    {summary?.totalProcesses || 0}
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
                    Valor Total
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summary?.totalValue)}
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
                <TrendingUpIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ejecutado
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(summary?.executedValue)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(summary?.executedValue / summary?.totalValue) * 100 || 0}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Departamentos
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(byDepartment || {}).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Distribución por Estado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Estado
            </Typography>
            <List>
              {Object.entries(byStatus || {}).map(([status, data]) => (
                <ListItem key={status}>
                  <ListItemIcon>
                    <Chip 
                      label={status} 
                      color={getStatusColor(status)} 
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${data.count} procesos`}
                    secondary={formatCurrency(data.value)}
                  />
                  <Typography variant="body2">
                    {((data.count / summary?.totalProcesses) * 100 || 0).toFixed(1)}%
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Distribución por Departamento */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top Departamentos por Valor
            </Typography>
            <List>
              {Object.entries(byDepartment || {})
                .sort(([,a], [,b]) => b.value - a.value)
                .slice(0, 5)
                .map(([deptName, data]) => (
                <ListItem key={deptName}>
                  <ListItemIcon>
                    <BusinessIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={deptName}
                    secondary={`${data.count} procesos`}
                  />
                  <Typography variant="body2">
                    {formatCurrency(data.value)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Cronograma de Ejecución */}
        {timeline && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Cronograma de Ejecución por Mes
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell align="center">Procesos Programados</TableCell>
                      <TableCell align="center">Procesos Ejecutados</TableCell>
                      <TableCell align="right">Valor Programado</TableCell>
                      <TableCell align="right">Valor Ejecutado</TableCell>
                      <TableCell align="center">% Avance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeline.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(2024, index, 1).toLocaleDateString('es-DO', { month: 'long' })}
                        </TableCell>
                        <TableCell align="center">{month.planned}</TableCell>
                        <TableCell align="center">{month.executed}</TableCell>
                        <TableCell align="right">{formatCurrency(month.plannedValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(month.executedValue)}</TableCell>
                        <TableCell align="center">
                          <LinearProgress 
                            variant="determinate" 
                            value={(month.executed / month.planned) * 100 || 0}
                            sx={{ width: 60 }}
                          />
                          {((month.executed / month.planned) * 100 || 0).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderBudgetAnalysis = () => {
    const { budgetComparison, alerts, inconsistencies } = reportData;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Análisis Presupuestario PAC vs POA
          </Typography>
        </Grid>

        {/* Alertas de Inconsistencia */}
        {alerts && alerts.length > 0 && (
          <Grid item xs={12}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Se han detectado {alerts.length} inconsistencias presupuestarias
            </Alert>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Alertas de Inconsistencia
              </Typography>
              <List>
                {alerts.map((alert, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={`Actividad: ${alert.activityName} | Diferencia: ${formatCurrency(alert.difference)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        )}

        {/* Comparación Presupuestaria */}
        {budgetComparison && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Comparación Presupuestaria por Departamento
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Departamento</TableCell>
                      <TableCell align="right">Presupuesto POA</TableCell>
                      <TableCell align="right">Costo PAC</TableCell>
                      <TableCell align="right">Diferencia</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {budgetComparison.map((dept, index) => (
                      <TableRow key={index}>
                        <TableCell>{dept.departmentName}</TableCell>
                        <TableCell align="right">{formatCurrency(dept.poaBudget)}</TableCell>
                        <TableCell align="right">{formatCurrency(dept.pacCost)}</TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={dept.difference >= 0 ? 'success.main' : 'error.main'}
                          >
                            {formatCurrency(dept.difference)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {dept.difference >= 0 ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
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
            <BarChartIcon sx={{ mr: 2 }} />
            Informes y Reportes PAC
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Análisis y reportes del Plan Anual de Compras
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadReportData}
            variant="outlined"
          >
            Actualizar
          </Button>
          {hasPermission('export', 'procurement_process') && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={exportReport}
              variant="contained"
            >
              Exportar
            </Button>
          )}
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Año Fiscal</InputLabel>
              <Select
                value={filters.fiscalYear}
                onChange={(e) => handleFilterChange('fiscalYear', e.target.value)}
              >
                {[2023, 2024, 2025].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Departamento</InputLabel>
              <Select
                value={filters.departmentId}
                onChange={(e) => handleFilterChange('departmentId', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Selector de Reporte */}
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={selectedReport}
          exclusive
          onChange={handleReportChange}
          aria-label="tipo de reporte"
        >
          <ToggleButton value="overview" aria-label="resumen general">
            <PieChartIcon sx={{ mr: 1 }} />
            Resumen General
          </ToggleButton>
          <ToggleButton value="budget-analysis" aria-label="análisis presupuestario">
            <BarChartIcon sx={{ mr: 1 }} />
            Análisis Presupuestario
          </ToggleButton>
          <ToggleButton value="timeline" aria-label="cronograma">
            <ScheduleIcon sx={{ mr: 1 }} />
            Cronograma
          </ToggleButton>
          <ToggleButton value="compliance" aria-label="cumplimiento">
            <CheckCircleIcon sx={{ mr: 1 }} />
            Cumplimiento
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Contenido del Reporte */}
      {selectedReport === 'overview' && renderOverviewReport()}
      {selectedReport === 'budget-analysis' && renderBudgetAnalysis()}
      {selectedReport === 'timeline' && (
        <Box>
          <Typography variant="h6">Cronograma de Ejecución</Typography>
          <Typography variant="body2" color="text.secondary">
            Reporte en desarrollo...
          </Typography>
        </Box>
      )}
      {selectedReport === 'compliance' && (
        <Box>
          <Typography variant="h6">Reporte de Cumplimiento</Typography>
          <Typography variant="body2" color="text.secondary">
            Reporte en desarrollo...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PACReports;
