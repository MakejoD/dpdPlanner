import React, { useEffect, useState } from 'react'
import {
  Snackbar,
  Alert,
  Slide,
  Stack,
  IconButton,
  Typography,
  Box,
  Chip
} from '@mui/material'
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material'
import notificationService from '../../services/notificationService'

const SlideTransition = (props) => {
  return <Slide {...props} direction="down" />
}

const NotificationToast = () => {
  const [notifications, setNotifications] = useState([])
  const [currentNotification, setCurrentNotification] = useState(null)

  useEffect(() => {
    // Escuchar nuevas notificaciones
    const handleNewNotification = (notification) => {
      // Solo mostrar notificaciones importantes como toast
      if (notification.priority === 'URGENT' || notification.priority === 'HIGH') {
        setNotifications(prev => [...prev, { ...notification, id: Date.now() + Math.random() }])
      }
    }

    notificationService.onNotification(handleNewNotification)

    return () => {
      notificationService.offNotification(handleNewNotification)
    }
  }, [])

  useEffect(() => {
    // Mostrar la siguiente notificación si no hay una activa
    if (!currentNotification && notifications.length > 0) {
      const next = notifications[0]
      setCurrentNotification(next)
      setNotifications(prev => prev.slice(1))

      // Auto-cerrar después de un tiempo basado en la prioridad
      const autoCloseTime = next.priority === 'URGENT' ? 8000 : 5000
      setTimeout(() => {
        setCurrentNotification(null)
      }, autoCloseTime)
    }
  }, [notifications, currentNotification])

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setCurrentNotification(null)
  }

  const getSeverity = (type) => {
    switch (type) {
      case 'SUCCESS':
        return 'success'
      case 'WARNING':
        return 'warning'
      case 'ERROR':
        return 'error'
      case 'INFO':
      default:
        return 'info'
    }
  }

  const getIcon = (type) => {
    const iconProps = { fontSize: 'small' }
    
    switch (type) {
      case 'SUCCESS':
        return <SuccessIcon {...iconProps} />
      case 'WARNING':
        return <WarningIcon {...iconProps} />
      case 'ERROR':
        return <ErrorIcon {...iconProps} />
      case 'INFO':
      default:
        return <InfoIcon {...iconProps} />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'error'
      case 'HIGH':
        return 'warning'
      case 'MEDIUM':
        return 'info'
      case 'LOW':
      default:
        return 'default'
    }
  }

  if (!currentNotification) {
    return null
  }

  return (
    <Snackbar
      open={!!currentNotification}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        mt: 2,
        mr: 2,
        '& .MuiSnackbar-root': {
          position: 'fixed'
        }
      }}
    >
      <Alert
        severity={getSeverity(currentNotification.type)}
        onClose={handleClose}
        variant="filled"
        icon={getIcon(currentNotification.type)}
        sx={{
          width: '100%',
          maxWidth: 400,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={currentNotification.priority}
              size="small"
              color={getPriorityColor(currentNotification.priority)}
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem', 
                height: 20,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'inherit'
              }}
            />
            <IconButton
              size="small"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {currentNotification.title}
          </Typography>
          <Typography variant="body2">
            {currentNotification.message}
          </Typography>
          {currentNotification.metadata?.module && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
              Módulo: {currentNotification.metadata.module}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  )
}

// Componente para notificaciones en cola (múltiples)
export const NotificationQueue = () => {
  const [queue, setQueue] = useState([])

  useEffect(() => {
    const handleNewNotification = (notification) => {
      // Agregar todas las notificaciones a la cola
      const toastNotification = {
        ...notification,
        id: Date.now() + Math.random(),
        timestamp: Date.now()
      }
      
      setQueue(prev => [...prev, toastNotification])

      // Auto-remover después de un tiempo
      setTimeout(() => {
        setQueue(prev => prev.filter(n => n.id !== toastNotification.id))
      }, 6000)
    }

    notificationService.onNotification(handleNewNotification)

    return () => {
      notificationService.offNotification(handleNewNotification)
    }
  }, [])

  const handleRemove = (id) => {
    setQueue(prev => prev.filter(n => n.id !== id))
  }

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
        width: '100%'
      }}
    >
      {queue.map((notification, index) => (
        <Slide
          key={notification.id}
          direction="left"
          in={true}
          style={{ transformOrigin: 'right center' }}
          timeout={{ enter: 300, exit: 200 }}
        >
          <Alert
            severity={getSeverity(notification.type)}
            onClose={() => handleRemove(notification.id)}
            variant="filled"
            icon={getIcon(notification.type)}
            sx={{
              width: '100%',
              mb: 1,
              boxShadow: 3,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={notification.priority}
                  size="small"
                  color={getPriorityColor(notification.priority)}
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'inherit'
                  }}
                />
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => handleRemove(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            }
          >
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                {notification.title}
              </Typography>
              <Typography variant="body2">
                {notification.message}
              </Typography>
              {notification.metadata?.module && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                  Módulo: {notification.metadata.module}
                </Typography>
              )}
            </Box>
          </Alert>
        </Slide>
      ))}
    </Stack>
  )
}

export default NotificationToast
