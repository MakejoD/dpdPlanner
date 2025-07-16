import { useState, useEffect, useCallback, useRef } from 'react'
import notificationService from '../services/notificationService'
import { httpClient } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export const useNotifications = () => {
  const { user, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  
  const notificationCallbackRef = useRef(null)
  const connectCallbackRef = useRef(null)
  const disconnectCallbackRef = useRef(null)
  const errorCallbackRef = useRef(null)

  // Cargar notificaciones desde la API
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setLoading(true)
      const response = await httpClient.get('/notifications', {
        params: { unreadOnly }
      })
      
      if (response.data.success) {
        setNotifications(response.data.data)
        if (!unreadOnly) {
          const unread = response.data.data.filter(n => !n.isRead).length
          setUnreadCount(unread)
        }
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar estadísticas de notificaciones
  const loadNotificationStats = useCallback(async () => {
    try {
      const response = await httpClient.get('/notifications/stats')
      if (response.data.success) {
        setUnreadCount(response.data.data.unread)
        return response.data.data
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }, [])

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await httpClient.patch(`/notifications/${notificationId}/read`)
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      )
      
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
    }
  }, [])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await httpClient.patch('/notifications/mark-all-read')
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      )
      
      setUnreadCount(0)
      
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error)
    }
  }, [])

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await httpClient.delete(`/notifications/${notificationId}`)
      
      // Actualizar estado local
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
    } catch (error) {
      console.error('Error eliminando notificación:', error)
    }
  }, [notifications])

  // Enviar notificación (solo para administradores)
  const sendNotification = useCallback(async (notificationData) => {
    try {
      const response = await httpClient.post('/notifications/send', notificationData)
      return response.data
    } catch (error) {
      console.error('Error enviando notificación:', error)
      throw error
    }
  }, [])

  // Configurar WebSocket cuando el usuario esté autenticado
  useEffect(() => {
    if (user && token) {
      console.log('🔌 Configurando WebSocket para usuario:', user.id)
      
      // Definir callbacks
      notificationCallbackRef.current = (notification) => {
        console.log('📬 Nueva notificación en tiempo real:', notification)
        
        // Agregar notificación al estado
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)
        
        // Mostrar notificación del navegador si está permitido
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          })
        }
      }

      connectCallbackRef.current = () => {
        console.log('✅ Conectado al sistema de notificaciones')
        setConnected(true)
        setError(null)
      }

      disconnectCallbackRef.current = (reason) => {
        console.log('❌ Desconectado del sistema de notificaciones:', reason)
        setConnected(false)
      }

      errorCallbackRef.current = (error) => {
        console.error('🚨 Error en WebSocket:', error)
        setError('Error de conexión con el servidor')
        setConnected(false)
      }

      // Registrar callbacks
      notificationService.on('onNotification', notificationCallbackRef.current)
      notificationService.on('onConnect', connectCallbackRef.current)
      notificationService.on('onDisconnect', disconnectCallbackRef.current)
      notificationService.on('onError', errorCallbackRef.current)

      // Conectar
      notificationService.connect(user.id, token)
      
      // Cargar notificaciones iniciales
      loadNotifications()
      loadNotificationStats()

      // Solicitar permiso para notificaciones del navegador
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Permiso de notificaciones:', permission)
        })
      }

      // Cleanup
      return () => {
        if (notificationCallbackRef.current) {
          notificationService.off('onNotification', notificationCallbackRef.current)
        }
        if (connectCallbackRef.current) {
          notificationService.off('onConnect', connectCallbackRef.current)
        }
        if (disconnectCallbackRef.current) {
          notificationService.off('onDisconnect', disconnectCallbackRef.current)
        }
        if (errorCallbackRef.current) {
          notificationService.off('onError', errorCallbackRef.current)
        }
        notificationService.disconnect()
      }
    }
  }, [user, token, loadNotifications, loadNotificationStats])

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    connected,
    error,
    
    // Acciones
    loadNotifications,
    loadNotificationStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    
    // Utilidades
    connectionInfo: notificationService.getConnectionInfo()
  }
}

export default useNotifications
