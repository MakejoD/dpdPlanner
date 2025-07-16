const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

class NotificationService {
  constructor(io) {
    this.io = io
    this.connectedUsers = new Map() // userId -> socketId
  }

  // Registrar conexión de usuario
  registerUser(userId, socketId) {
    this.connectedUsers.set(userId.toString(), socketId)
    console.log(`Usuario ${userId} conectado con socket ${socketId}`)
  }

  // Desregistrar usuario
  unregisterUser(userId) {
    this.connectedUsers.delete(userId.toString())
    console.log(`Usuario ${userId} desconectado`)
  }

  // Enviar notificación a usuario específico
  async sendNotificationToUser(userId, notification) {
    try {
      // Guardar notificación en base de datos
      const savedNotification = await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          title: notification.title,
          message: notification.message,
          type: notification.type || 'INFO',
          priority: notification.priority || 'MEDIUM',
          isRead: false,
          data: notification.data ? JSON.stringify(notification.data) : null
        }
      })

      // Enviar por WebSocket si el usuario está conectado
      const socketId = this.connectedUsers.get(userId.toString())
      if (socketId) {
        this.io.to(socketId).emit('notification', {
          id: savedNotification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          timestamp: savedNotification.createdAt,
          data: notification.data
        })
      }

      return savedNotification
    } catch (error) {
      console.error('Error enviando notificación:', error)
      throw error
    }
  }

  // Enviar notificación a múltiples usuarios
  async sendNotificationToUsers(userIds, notification) {
    const promises = userIds.map(userId => 
      this.sendNotificationToUser(userId, notification)
    )
    return Promise.all(promises)
  }

  // Enviar notificación por rol
  async sendNotificationByRole(roleName, notification) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            name: roleName
          }
        },
        select: { id: true }
      })

      const userIds = users.map(user => user.id)
      return this.sendNotificationToUsers(userIds, notification)
    } catch (error) {
      console.error('Error enviando notificación por rol:', error)
      throw error
    }
  }

  // Enviar notificación a departamento
  async sendNotificationByDepartment(departmentId, notification) {
    try {
      const users = await prisma.user.findMany({
        where: {
          departmentId: parseInt(departmentId)
        },
        select: { id: true }
      })

      const userIds = users.map(user => user.id)
      return this.sendNotificationToUsers(userIds, notification)
    } catch (error) {
      console.error('Error enviando notificación por departamento:', error)
      throw error
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId, userId) {
    try {
      return await prisma.notification.updateMany({
        where: {
          id: parseInt(notificationId),
          userId: parseInt(userId)
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
      throw error
    }
  }

  // Obtener notificaciones no leídas de un usuario
  async getUnreadNotifications(userId) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId: parseInt(userId),
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      console.error('Error obteniendo notificaciones no leídas:', error)
      throw error
    }
  }

  // Obtener todas las notificaciones de un usuario
  async getAllNotifications(userId, limit = 50) {
    try {
      return await prisma.notification.findMany({
        where: {
          userId: parseInt(userId)
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      })
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error)
      throw error
    }
  }

  // Limpiar notificaciones antiguas
  async cleanOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      return await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      })
    } catch (error) {
      console.error('Error limpiando notificaciones antiguas:', error)
      throw error
    }
  }
}

module.exports = NotificationService
