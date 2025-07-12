const { PrismaClient } = require('@prisma/client')

// Simple test to see if Prisma client works
const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test if we can query (this will also test if client is generated)
    const userCount = await prisma.user.count()
    console.log(`📊 Current user count: ${userCount}`)
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    
    if (error.message.includes('PrismaClient is unable to be run in the browser')) {
      console.log('💡 This is expected in browser environment')
    } else if (error.message.includes('generate')) {
      console.log('💡 Try running: npx prisma generate')
    }
  }
}

testConnection()
