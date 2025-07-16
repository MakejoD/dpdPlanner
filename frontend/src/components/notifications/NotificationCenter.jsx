import React, { useState } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  MarkEmailRead as MarkReadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon
} from '@mui/icons-material'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNotifications } from '../../hooks/useNotifications'

const NotificationCenter = ({ sx = {} }) => {
  const {
    notifications,
    unreadCount,
    loading,
    connected,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications()

  const [anchorEl, setAnchorEl] = useState(null)
  const [showAll, setShowAll] = useState(false)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setShowAll(false)
  }

  const handleMarkAsRead = async (notificationId, event) => {
    event.stopPropagation()
    await markAsRead(notificationId)
  }

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation()
    await deleteNotification(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const getNotificationIcon = (type) => {
    const iconProps = { fontSize: 'small' }
    
    switch (type) {
      case 'SUCCESS':
        return <SuccessIcon color="success" {...iconProps} />
      case 'WARNING':
        return <WarningIcon color="warning" {...iconProps} />
      case 'ERROR':
        return <ErrorIcon color="error" {...iconProps} />
      case 'INFO':
      default:
        return <InfoIcon color="info" {...iconProps} />
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

  const getTimeDisplay = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true, locale: es })
    } else {
      return format(date, 'PPp', { locale: es })
    }
  }

  const open = Boolean(anchorEl)
  const displayNotifications = showAll 
    ? notifications 
    : notifications.slice(0, 10)

  return (
    <>
      <Tooltip title={connected ? 'Centro de notificaciones' : 'Desconectado del servidor'}>
        <IconButton
          onClick={handleClick}
          sx={{ 
            position: 'relative',
            ...sx
          }}
          color="inherit"
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            max={99}
            invisible={unreadCount === 0}
          >
            {connected ? (
              <NotificationsActiveIcon />
            ) : (
              <NotificationsIcon sx={{ opacity: 0.6 }} />
            )}
          </Badge>
          
          {/* Indicador de conexión */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: connected ? 'success.main' : 'error.main',
              border: '1px solid white'
            }}
          />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              maxHeight: 600,
              overflow: 'hidden'
            }
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Notificaciones
            </Typography>
            
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Indicador de conexión */}
              <Tooltip title={connected ? 'Conectado' : 'Desconectado'}>
                {connected ? (
                  <ConnectedIcon color="success" fontSize="small" />
                ) : (
                  <DisconnectedIcon color="error" fontSize="small" />
                )}
              </Tooltip>
              
              {/* Botón marcar todas como leídas */}
              {unreadCount > 0 && (
                <Tooltip title="Marcar todas como leídas">
                  <IconButton size="small" onClick={handleMarkAllAsRead}>
                    <MarkReadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* Estado de error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* Estadísticas */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label={`${notifications.length} total`} 
              size="small" 
              variant="outlined"
            />
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} sin leer`} 
                size="small" 
                color="error"
              />
            )}
          </Box>

          <Divider />

          {/* Lista de notificaciones */}
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto', p: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      },
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5
                    }}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id, { stopPropagation: () => {} })}
                  >
                    <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        {getNotificationIcon(notification.type)}
                      </ListItemIcon>
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            variant="subtitle2" 
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                            sx={{ flexGrow: 1 }}
                            noWrap
                          >
                            {notification.title}
                          </Typography>
                          
                          <Chip
                            label={notification.priority}
                            size="small"
                            color={getPriorityColor(notification.priority)}
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {notification.message}
                        </Typography>
                        
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ mt: 0.5, display: 'block' }}
                        >
                          {getTimeDisplay(notification.createdAt)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        {!notification.isRead && (
                          <Tooltip title="Marcar como leída">
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                            >
                              <MarkReadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Eliminar">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleDelete(notification.id, e)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ListItem>
                  
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Botones de acción */}
          {notifications.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {notifications.length > 10 && (
                  <Button
                    size="small"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? 'Mostrar menos' : `Ver todas (${notifications.length})`}
                  </Button>
                )}
                
                <Button
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => {
                    handleClose()
                    // Aquí podrías navegar a una página de configuración
                  }}
                >
                  Configuración
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Popover>
    </>
  )
}

export default NotificationCenter
