import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress,
  Button
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { httpClient } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const ApprovalsDashboard = () => {
  const [stats, setStats] = useState({});
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadApprovalData();
  }, []);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, pendingResponse] = await Promise.all([
        httpClient.get('/approvals/stats'),
        httpClient.get('/approvals/pending')
      ]);

      setStats(statsResponse.data?.data?.summary || {});
      setPendingReports(pendingResponse.data?.data?.reports?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      SUBMITTED: { label: 'Pendiente', color: 'warning' },
      APPROVED: { label: 'Aprobado', color: 'success' },
      REJECTED: { label: 'Rechazado', color: 'error' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Estadísticas de Aprobación */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="div">
                Estado de Aprobaciones
              </Typography>
              <Button 
                size="small"
                onClick={() => navigate('/approvals')}
              >
                Ver Todas
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Pending color="warning" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div">
                    {stats.pending || 0}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Pendientes
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div">
                    {stats.approved || 0}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Aprobados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Cancel color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div">
                    {stats.rejected || 0}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Rechazados
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <TrendingUp color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4" component="div">
                    {stats.approvalRate || 0}%
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Tasa Aprobación
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Barra de Progreso */}
            <Box mt={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progreso de Aprobaciones ({stats.total || 0} reportes totales)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={parseFloat(stats.approvalRate) || 0}
                color="primary"
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Reportes Pendientes Recientes */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Assignment sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                Reportes Pendientes
              </Typography>
            </Box>
            
            {pendingReports.length > 0 ? (
              <Box>
                {pendingReports.map((report, index) => (
                  <Box 
                    key={report.id}
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    py={1}
                    borderBottom={index < pendingReports.length - 1 ? 1 : 0}
                    borderColor="divider"
                  >
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {report.activity?.name || report.indicator?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {report.reportedBy?.firstName} {report.reportedBy?.lastName} - {formatDate(report.submittedAt)}
                      </Typography>
                    </Box>
                    <Box ml={1}>
                      {getStatusChip(report.status)}
                    </Box>
                  </Box>
                ))}
                
                <Box mt={2} textAlign="center">
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => navigate('/approvals')}
                  >
                    Gestionar Aprobaciones
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box textAlign="center" py={3}>
                <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                <Typography color="text.secondary">
                  ¡No hay reportes pendientes!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ApprovalsDashboard;
