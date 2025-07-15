import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  History,
  Assessment,
  Pending,
  Archive
} from '@mui/icons-material';
import { httpClient } from '../../utils/api';

const ApprovalManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingReports, setPendingReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [actionType, setActionType] = useState('');
  const [comments, setComments] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    console.log('🎯 ApprovalManagement montado, cargando datos...');
    console.log('📋 Tab activo:', activeTab);
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadPendingReports(),
        loadMyReports(),
        loadStats()
      ]);
    } catch (error) {
      showSnackbar('Error al cargar datos: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReports = async () => {
    try {
      console.log('🔄 Cargando reportes pendientes...');
      const response = await httpClient.get('/approvals/pending');
      console.log('📥 Respuesta de /approvals/pending:', response);
      console.log('📊 Data completa:', response.data);
      console.log('📋 Reportes:', response.data?.data?.reports);
      console.log('📋 Data directa:', response.data);
      
      // Intentar ambas estructuras
      const reports = response.data?.data?.reports || response.data?.reports || response.data || [];
      console.log('✅ Reportes finales:', reports);
      setPendingReports(reports);
    } catch (error) {
      console.error('❌ Error loading pending reports:', error);
    }
  };

  const loadMyReports = async () => {
    try {
      console.log('🔄 Cargando mis reportes...');
      const response = await httpClient.get('/approvals/my-reports');
      console.log('📥 Respuesta de /approvals/my-reports:', response);
      console.log('📊 Data completa:', response.data);
      
      // Intentar ambas estructuras
      const reports = response.data?.data || response.data || [];
      console.log('✅ Mis reportes finales:', reports);
      setMyReports(reports);
    } catch (error) {
      console.error('❌ Error loading my reports:', error);
    }
  };

  const loadStats = async () => {
    try {
      console.log('🔄 Cargando estadísticas...');
      const response = await httpClient.get('/approvals/stats');
      console.log('📥 Respuesta de /approvals/stats:', response);
      console.log('📊 Data completa:', response.data);
      console.log('📈 Stats:', response.data?.data?.summary);
      
      // Intentar ambas estructuras
      const stats = response.data?.data?.summary || response.data?.summary || response.data || {};
      console.log('✅ Stats finales:', stats);
      setStats(stats);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
    }
  };

  const handleApprovalAction = async () => {
    if (!selectedReport || !actionType) return;

    // Validación para rechazo
    if (actionType === 'reject' && comments.trim().length < 10) {
      showSnackbar('La razón del rechazo debe tener al menos 10 caracteres', 'error');
      return;
    }

    try {
      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      const payload = {};
      
      if (actionType === 'approve') {
        payload.comments = comments.trim();
      } else {
        payload.rejectionReason = comments.trim();
        payload.comments = comments.trim(); // También como comentario adicional
      }
      
      await httpClient.post(`/approvals/${selectedReport.id}/${endpoint}`, payload);

      showSnackbar(`Reporte ${actionType === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`, 'success');
      
      setDialogOpen(false);
      setComments('');
      setSelectedReport(null);
      setActionType('');
      
      // Recargar datos
      loadData();
    } catch (error) {
      showSnackbar('Error al procesar la acción: ' + error.message, 'error');
    }
  };

  const loadApprovalHistory = async (reportId) => {
    try {
      const response = await httpClient.get(`/approvals/${reportId}/history`);
      setApprovalHistory(response.data.data || []);
      setHistoryDialogOpen(true);
    } catch (error) {
      showSnackbar('Error al cargar historial: ' + error.message, 'error');
    }
  };

  const openApprovalDialog = (report, action) => {
    setSelectedReport(report);
    setActionType(action);
    setDialogOpen(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      DRAFT: { label: 'Borrador', color: 'default' },
      SUBMITTED: { label: 'Enviado', color: 'warning' },
      APPROVED: { label: 'Aprobado', color: 'success' },
      REJECTED: { label: 'Rechazado', color: 'error' },
      WITHDRAWN: { label: 'Retirado', color: 'default' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Pending color="warning" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.pending || 0}
                </Typography>
                <Typography color="text.secondary">
                  Pendientes
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <CheckCircle color="success" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.approved || 0}
                </Typography>
                <Typography color="text.secondary">
                  Aprobados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Cancel color="error" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.rejected || 0}
                </Typography>
                <Typography color="text.secondary">
                  Rechazados
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center">
              <Assessment color="primary" sx={{ mr: 2 }} />
              <Box>
                <Typography variant="h4" component="div">
                  {stats.approvalRate || 0}%
                </Typography>
                <Typography color="text.secondary">
                  Tasa de Aprobación
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const PendingReportsTable = () => {
    console.log('🏗️ Renderizando PendingReportsTable');
    console.log('📊 pendingReports:', pendingReports);
    console.log('📏 pendingReports length:', pendingReports?.length);
    console.log('🔍 Es array?:', Array.isArray(pendingReports));
    
    return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Actividad/Indicador</TableCell>
            <TableCell>Reportado por</TableCell>
            <TableCell>Período</TableCell>
            <TableCell>Enviado</TableCell>
            <TableCell>Progreso</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(pendingReports) ? pendingReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {report.activity?.name || report.indicator?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {report.activity ? 'Actividad' : 'Indicador'}
                </Typography>
              </TableCell>
              <TableCell>
                {report.reportedBy?.firstName} {report.reportedBy?.lastName}
              </TableCell>
              <TableCell>{report.period}</TableCell>
              <TableCell>
                {report.submittedAt ? formatDate(report.submittedAt) : '-'}
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {report.currentValue} / {report.targetValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({report.executionPercentage}%)
                </Typography>
              </TableCell>
              <TableCell>{getStatusChip(report.status)}</TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <Tooltip title="Aprobar">
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => openApprovalDialog(report, 'approve')}
                    >
                      <CheckCircle />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rechazar">
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => openApprovalDialog(report, 'reject')}
                    >
                      <Cancel />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver historial">
                    <IconButton 
                      size="small"
                      onClick={() => loadApprovalHistory(report.id)}
                    >
                      <History />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          )) : []}
          {(!Array.isArray(pendingReports) || pendingReports.length === 0) && (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography color="text.secondary">
                  No hay reportes pendientes de aprobación
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
    );
  };

  const MyReportsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Actividad/Indicador</TableCell>
            <TableCell>Período</TableCell>
            <TableCell>Creado</TableCell>
            <TableCell>Progreso</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.isArray(myReports) ? myReports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  {report.activity?.name || report.indicator?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {report.activity ? 'Actividad' : 'Indicador'}
                </Typography>
              </TableCell>
              <TableCell>{report.period}</TableCell>
              <TableCell>{formatDate(report.createdAt)}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {report.currentValue} / {report.targetValue}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({report.executionPercentage}%)
                </Typography>
              </TableCell>
              <TableCell>{getStatusChip(report.status)}</TableCell>
              <TableCell>
                <Tooltip title="Ver historial">
                  <IconButton 
                    size="small"
                    onClick={() => loadApprovalHistory(report.id)}
                  >
                    <History />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          )) : []}
          {Array.isArray(myReports) && myReports.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography color="text.secondary">
                  No tienes reportes
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Aprobaciones
      </Typography>

      <StatsCards />

      <Card>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab 
              label={
                <Badge badgeContent={stats.pending || 0} color="warning">
                  Reportes Pendientes
                </Badge>
              } 
            />
            <Tab label="Mis Reportes" />
          </Tabs>

          <Box role="tabpanel" hidden={activeTab !== 0}>
            {activeTab === 0 && <PendingReportsTable />}
          </Box>
          
          <Box role="tabpanel" hidden={activeTab !== 1}>
            {activeTab === 1 && <MyReportsTable />}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog de Aprobación/Rechazo */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Aprobar Reporte' : 'Rechazar Reporte'}
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <>
              <Typography variant="body2" gutterBottom>
                <strong>Actividad:</strong> {selectedReport.activity?.name || selectedReport.indicator?.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Período:</strong> {selectedReport.period}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Progreso:</strong> {selectedReport.currentValue} / {selectedReport.targetValue} ({selectedReport.executionPercentage}%)
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label={actionType === 'approve' ? 'Comentarios (opcional)' : 'Razón del rechazo (requerido)'}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={actionType === 'approve' 
                  ? 'Ingresa comentarios para la aprobación...' 
                  : 'Explica detalladamente la razón del rechazo (mínimo 10 caracteres)...'
                }
                required={actionType === 'reject'}
                error={actionType === 'reject' && comments.length > 0 && comments.length < 10}
                helperText={
                  actionType === 'reject' && comments.length > 0 && comments.length < 10
                    ? `Mínimo 10 caracteres (actual: ${comments.length})`
                    : actionType === 'reject' 
                      ? 'La razón del rechazo es obligatoria'
                      : ''
                }
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApprovalAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
          >
            {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Historial */}
      <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Aprobaciones</DialogTitle>
        <DialogContent>
          {approvalHistory.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Acción</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Comentarios</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.isArray(approvalHistory) ? approvalHistory.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {getStatusChip(entry.action)}
                      </TableCell>
                      <TableCell>
                        {entry.actionBy?.firstName} {entry.actionBy?.lastName}
                      </TableCell>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                      <TableCell>{entry.comments || '-'}</TableCell>
                    </TableRow>
                  )) : []}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary">
              No hay historial disponible
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApprovalManagement;
