const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authenticateToken = require('../middleware/auth.js')

const router = express.Router()
const prisma = new PrismaClient()

// Middleware para obtener el servicio de notificaciones del contexto de la app
const getNotificationService = (req, res, next) => {
  req.notificationService = req.app.get('notificationService')
  next()
}

// Obtener todas las notificaciones del usuario actual
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query
    const userId = req.user.id

    const where = {
      userId: userId
    }

    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })

    const total = await prisma.notification.count({ where })

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Obtener notificaciones no leídas
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    })

  } catch (error) {
    console.error('Error obteniendo notificaciones no leídas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Marcar notificación como leída
router.patch('/:id/read', authenticateToken, getNotificationService, async (req, res) => {
  try {
    const notificationId = req.params.id
    const userId = req.user.id

    await req.notificationService.markAsRead(notificationId, userId)

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    })

  } catch (error) {
    console.error('Error marcando notificación como leída:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Marcar todas las notificaciones como leídas
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    })

  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Eliminar notificación
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id
    const userId = req.user.id

    await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId: userId
      }
    })

    res.json({
      success: true,
      message: 'Notificación eliminada'
    })

  } catch (error) {
    console.error('Error eliminando notificación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Enviar notificación (solo para administradores)
router.post('/send', authenticateToken, getNotificationService, async (req, res) => {
  try {
    // Verificar permisos de administrador
    if (req.user.role.name !== 'Administrador del Sistema') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para enviar notificaciones'
      })
    }

    const { userId, userIds, roleName, departmentId, title, message, type, priority, data } = req.body

    const notification = {
      title,
      message,
      type: type || 'INFO',
      priority: priority || 'MEDIUM',
      data
    }

    let result

    if (userId) {
      // Enviar a usuario específico
      result = await req.notificationService.sendNotificationToUser(userId, notification)
    } else if (userIds && Array.isArray(userIds)) {
      // Enviar a múltiples usuarios
      result = await req.notificationService.sendNotificationToUsers(userIds, notification)
    } else if (roleName) {
      // Enviar por rol
      result = await req.notificationService.sendNotificationByRole(roleName, notification)
    } else if (departmentId) {
      // Enviar por departamento
      result = await req.notificationService.sendNotificationByDepartment(departmentId, notification)
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar destinatarios'
      })
    }

    res.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      data: result
    })

  } catch (error) {
    console.error('Error enviando notificación:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Obtener estadísticas de notificaciones
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const total = await prisma.notification.count({
      where: { userId: userId }
    })

    const unread = await prisma.notification.count({
      where: { userId: userId, isRead: false }
    })

    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId: userId },
      _count: {
        id: true
      }
    })

    const recent = await prisma.notification.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    res.json({
      success: true,
      data: {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.id
          return acc
        }, {}),
        recent
      }
    })

  } catch (error) {
    console.error('Error obteniendo estadísticas de notificaciones:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
