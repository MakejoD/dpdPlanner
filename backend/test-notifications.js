const { PrismaClient } = require('@prisma/client')
const io = require('socket.io-client')

const prisma = new PrismaClient()

async function testNotifications() {
  console.log('🧪 Iniciando prueba del sistema de notificaciones...')

  try {
    // 1. Obtener un usuario de prueba
    const user = await prisma.user.findFirst({
      where: { email: 'admin@poa.gov' }
    })

    if (!user) {
      console.log('❌ No se encontró el usuario admin@poa.gov')
      return
    }

    console.log(`👤 Usuario encontrado: ${user.firstName} ${user.lastName} (ID: ${user.id})`)

    // 2. Crear notificaciones de prueba usando la API
    const testNotifications = [
      {
        title: '🎉 ¡Bienvenido al sistema POA!',
        message: 'El sistema de notificaciones en tiempo real está funcionando correctamente.',
        type: 'SUCCESS',
        priority: 'HIGH'
      },
      {
        title: '⚠️ Reporte pendiente',
        message: 'Tienes un reporte de progreso pendiente que vence mañana.',
        type: 'WARNING',
        priority: 'URGENT'
      },
      {
        title: '📊 Nuevo indicador disponible',
        message: 'Se ha agregado un nuevo indicador para tu revisión.',
        type: 'INFO',
        priority: 'MEDIUM'
      },
      {
        title: '💰 Actualización presupuestaria',
        message: 'Se ha actualizado la información presupuestaria de tu departamento.',
        type: 'INFO',
        priority: 'LOW'
      }
    ]

    // 3. Crear las notificaciones en la base de datos
    for (const notification of testNotifications) {
      const created = await prisma.notification.create({
        data: {
          userId: user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          isRead: false
        }
      })
      
      console.log(`✅ Notificación creada: ${created.title}`)
    }

    // 4. Probar la conexión WebSocket
    console.log('\n🔌 Probando conexión WebSocket...')
    
    const socket = io('http://localhost:3001', {
      auth: {
        userId: user.id
      }
    })

    socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket')
      
      // Enviar una notificación en tiempo real
      setTimeout(() => {
        socket.emit('test-notification', {
          userId: user.id,
          title: '🚀 Notificación en tiempo real',
          message: 'Esta notificación fue enviada a través de WebSocket.',
          type: 'SUCCESS',
          priority: 'HIGH'
        })
        
        console.log('📨 Notificación en tiempo real enviada')
      }, 2000)
    })

    socket.on('notification', (data) => {
      console.log('📩 Notificación recibida via WebSocket:', data.title)
    })

    socket.on('connect_error', (error) => {
      console.log('❌ Error de conexión WebSocket:', error.message)
    })

    // 5. Mostrar resumen
    const totalNotifications = await prisma.notification.count({
      where: { userId: user.id }
    })

    const unreadNotifications = await prisma.notification.count({
      where: { 
        userId: user.id,
        isRead: false 
      }
    })

    console.log('\n📊 Resumen del sistema de notificaciones:')
    console.log(`   - Total de notificaciones: ${totalNotifications}`)
    console.log(`   - No leídas: ${unreadNotifications}`)
    console.log(`   - Usuario de prueba: ${user.email}`)
    console.log('\n🎯 Para probar el sistema:')
    console.log('   1. Abre http://localhost:5175 en tu navegador')
    console.log('   2. Inicia sesión con: admin@poa.gov / admin123456')
    console.log('   3. Busca el ícono de notificaciones en el header')
    console.log('   4. Deberías ver las notificaciones de prueba')

    // Mantener la conexión por 10 segundos más
    setTimeout(() => {
      socket.disconnect()
      console.log('\n✅ Prueba completada')
      process.exit(0)
    }, 10000)

  } catch (error) {
    console.error('❌ Error en la prueba:', error)
    process.exit(1)
  }
}

testNotifications()
