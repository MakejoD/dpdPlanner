import { io } from 'socket.io-client'

class NotificationService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.userId = null
    this.callbacks = {
      onNotification: [],
      onConnect: [],
      onDisconnect: [],
      onError: []
    }
  }

  // Conectar al servidor WebSocket
  connect(userId, token) {
    if (this.socket) {
      this.disconnect()
    }

    this.userId = userId

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    
    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    })

    this.setupEventListeners()
    
    // Autenticar usuario después de conectar
    this.socket.on('connect', () => {
      console.log('🔌 Conectado al servidor WebSocket')
      this.isConnected = true
      this.authenticate(userId)
      this.triggerCallbacks('onConnect')
    })

    return this.socket
  }

  // Configurar event listeners
  setupEventListeners() {
    if (!this.socket) return

    // Manejo de notificaciones
    this.socket.on('notification', (notification) => {
      console.log('📬 Nueva notificación recibida:', notification)
      this.triggerCallbacks('onNotification', notification)
      
      // Confirmar recepción
      this.socket.emit('notification_received', {
        notificationId: notification.id
      })
    })

    // Manejo de desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Desconectado del servidor WebSocket:', reason)
      this.isConnected = false
      this.triggerCallbacks('onDisconnect', reason)
    })

    // Manejo de errores
    this.socket.on('connect_error', (error) => {
      console.error('🚨 Error de conexión WebSocket:', error)
      this.triggerCallbacks('onError', error)
    })

    // Confirmación de autenticación
    this.socket.on('authenticated', (data) => {
      console.log('✅ Usuario autenticado:', data)
    })

    // Error de autenticación
    this.socket.on('authentication_error', (error) => {
      console.error('❌ Error de autenticación:', error)
      this.triggerCallbacks('onError', error)
    })

    // Confirmación de conexión
    this.socket.on('connected', (data) => {
      console.log('🎉 Conectado al sistema de notificaciones:', data)
    })

    // Manejo de reconexión
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconectado después de ${attemptNumber} intentos`)
      if (this.userId) {
        this.authenticate(this.userId)
      }
    })
  }

  // Autenticar usuario
  authenticate(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', { userId })
    }
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.userId = null
    }
  }

  // Agregar callback para eventos
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }

  // Remover callback
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback)
      if (index > -1) {
        this.callbacks[event].splice(index, 1)
      }
    }
  }

  // Métodos específicos para eventos comunes
  onNotification(callback) {
    this.on('onNotification', callback)
  }

  offNotification(callback) {
    this.off('onNotification', callback)
  }

  onConnect(callback) {
    this.on('onConnect', callback)
  }

  offConnect(callback) {
    this.off('onConnect', callback)
  }

  onDisconnect(callback) {
    this.on('onDisconnect', callback)
  }

  offDisconnect(callback) {
    this.off('onDisconnect', callback)
  }

  onError(callback) {
    this.on('onError', callback)
  }

  offError(callback) {
    this.off('onError', callback)
  }

  // Ejecutar callbacks
  triggerCallbacks(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error ejecutando callback ${event}:`, error)
        }
      })
    }
  }

  // Verificar si está conectado
  isSocketConnected() {
    return this.socket && this.isConnected
  }

  // Obtener información de conexión
  getConnectionInfo() {
    return {
      connected: this.isConnected,
      userId: this.userId,
      socketId: this.socket?.id || null
    }
  }
}

// Crear instancia singleton
const notificationService = new NotificationService()

export default notificationService
