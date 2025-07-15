import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastCheck, setLastCheck] = useState(null);

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const response = await api.get('/health');
      if (response.status === 'OK') {
        setStatus('connected');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setStatus('disconnected');
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'success',
          icon: <CheckIcon />,
          message: 'Conectado al servidor',
          severity: 'success'
        };
      case 'disconnected':
        return {
          color: 'error',
          icon: <ErrorIcon />,
          message: 'Servidor no disponible',
          severity: 'error'
        };
      case 'checking':
        return {
          color: 'info',
          icon: <CircularProgress size={16} />,
          message: 'Verificando conexión...',
          severity: 'info'
        };
      default:
        return {
          color: 'warning',
          icon: <WarningIcon />,
          message: 'Estado desconocido',
          severity: 'warning'
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (status === 'connected') {
    return (
      <Tooltip title={`Última verificación: ${lastCheck?.toLocaleTimeString()}`}>
        <Chip
          icon={statusInfo.icon}
          label="Conectado"
          color={statusInfo.color}
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={statusInfo.severity}
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={checkConnection}
            disabled={status === 'checking'}
          >
            <RefreshIcon />
          </IconButton>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {statusInfo.icon}
          <Typography sx={{ ml: 1 }}>
            {statusInfo.message}
          </Typography>
        </Box>
        {status === 'disconnected' && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Asegúrese de que el servidor backend esté ejecutándose en el puerto 3001.
            <br />
            Puede iniciarlo ejecutando: <code>start-backend.bat</code>
          </Typography>
        )}
      </Alert>
    </Box>
  );
};

export default ConnectionStatus;
