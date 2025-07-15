const http = require('http');

async function testServerConnection() {
  console.log('🧪 Probando conectividad del servidor...\n');

  // Test simple health check
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('✅ Servidor respondiendo en puerto 3001');
        console.log('Status:', res.statusCode);
        console.log('Respuesta:', data.substring(0, 100));
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log('❌ Error de conexión:', e.message);
      reject(e);
    });

    req.end();
  });
}

testServerConnection().catch(console.error);
