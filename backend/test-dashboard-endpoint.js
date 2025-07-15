const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function testDashboardEndpoint() {
  try {
    console.log('🧪 Probando el endpoint /api/dashboard/stats...\n');

    // Primero, obtener un token de un usuario válido
    const user = await prisma.user.findFirst({
      where: { 
        isActive: true,
        email: { not: '' }
      },
      include: {
        role: true
      }
    });

    if (!user) {
      console.log('❌ No se encontró un usuario activo para las pruebas');
      return;
    }

    console.log('👤 Usuario de prueba:', user.email);

    // Simular login para obtener token
    const loginData = JSON.stringify({
      email: user.email,
      password: 'admin123'  // Asumimos que tiene esta password
    });

    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const token = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              console.log('✅ Login exitoso');
              resolve(parsed.token);
            } catch (e) {
              console.log('❌ Error al parsear respuesta de login:', e.message);
              reject(e);
            }
          } else {
            console.log('❌ Login fallido. Status:', res.statusCode);
            console.log('Respuesta:', data);
            reject(new Error('Login failed'));
          }
        });
      });

      req.on('error', (e) => {
        console.log('❌ Error en login:', e.message);
        reject(e);
      });

      req.write(loginData);
      req.end();
    });

    console.log('🔑 Token obtenido, probando dashboard...\n');

    // Ahora probar el endpoint de dashboard
    const dashboardOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const dashboardData = await new Promise((resolve, reject) => {
      const req = http.request(dashboardOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('📊 Dashboard Stats Response:');
          console.log('   Status:', res.statusCode);
          
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              console.log('   ✅ Respuesta exitosa');
              console.log('   Datos recibidos:');
              console.log(JSON.stringify(parsed, null, 2));
              resolve(parsed);
            } catch (e) {
              console.log('   ❌ Error al parsear JSON:', e.message);
              console.log('   Respuesta raw:', data.substring(0, 200) + '...');
              reject(e);
            }
          } else {
            console.log('   ❌ Error:', res.statusCode);
            try {
              const parsed = JSON.parse(data);
              console.log('   Mensaje:', parsed.message || parsed.error);
            } catch (e) {
              console.log('   Respuesta raw:', data.substring(0, 200) + '...');
            }
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (e) => {
        console.log('   ❌ Error de conexión:', e.message);
        reject(e);
      });

      req.end();
    });

    console.log('\n✅ Prueba completada exitosamente!');

  } catch (error) {
    console.error('\n❌ Error en la prueba:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si el script se ejecuta directamente
if (require.main === module) {
  testDashboardEndpoint();
}

module.exports = { testDashboardEndpoint };
