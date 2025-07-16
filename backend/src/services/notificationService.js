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
      // Validar que userId sea un string válido
      if (!userId || typeof userId !== 'string') {
        console.warn(`Invalid userId provided: ${userId}`);
        return null;
      }

      // Guardar notificación en base de datos
      const savedNotification = await prisma.notification.create({
        data: {
          userId: userId, // Usar directamente como string UUID
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
      console.error(`Error enviando notificación a usuario ${userId}:`, {
        error: error.message,
        userId,
        notificationTitle: notification.title
      });
      
      // No propagar el error para evitar interrumpir el sistema de alertas
      return null;
    }
  }

  // Enviar notificación a múltiples usuarios
  async sendNotificationToUsers(userIds, notification) {
    // Filtrar IDs válidos (strings no vacíos y no NaN)
    const validUserIds = userIds.filter(userId => 
      userId && 
      typeof userId === 'string' && 
      userId.trim() !== '' && 
      !userId.includes('NaN')
    );

    if (validUserIds.length === 0) {
      console.warn('No valid user IDs provided to sendNotificationToUsers:', userIds);
      return [];
    }

    const promises = validUserIds.map(userId => 
      this.sendNotificationToUser(userId, notification)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Log any failed notifications
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send notification to user ${validUserIds[index]}:`, result.reason);
      }
    });
    
    return results.filter(result => result.status === 'fulfilled').map(result => result.value);
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
          departmentId: departmentId // departmentId ya debería ser string UUID
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
          id: notificationId, // notificationId es string UUID
          userId: userId // userId es string UUID
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
          userId: userId, // userId es string UUID
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
          userId: userId // userId es string UUID
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
