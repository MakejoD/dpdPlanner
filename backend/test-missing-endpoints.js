const http = require('http');

async function testMissingEndpoints() {
  console.log('🧪 Probando endpoints que están fallando...\n');

  // Primero hacer login para obtener token
  const loginData = JSON.stringify({
    email: 'admin@poa.gov',
    password: 'admin123'
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

  console.log('🔑 Obteniendo token...');
  const token = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          console.log('✅ Login exitoso\n');
          resolve(parsed.token);
        } else {
          reject(new Error('Login failed'));
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  // Endpoints que están fallando
  const endpoints = [
    '/pacc/dashboard-stats',
    '/activities/recent'
  ];

  for (const endpoint of endpoints) {
    console.log(`📊 Probando ${endpoint}...`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${endpoint}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    try {
      await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              const parsed = JSON.parse(data);
              console.log(`   ✅ Status: ${res.statusCode} - OK`);
              if (parsed.data) {
                if (Array.isArray(parsed.data)) {
                  console.log(`   📄 Datos: ${parsed.data.length} elementos`);
                } else if (typeof parsed.data === 'object') {
                  console.log(`   📄 Datos: Objeto con ${Object.keys(parsed.data).length} propiedades`);
                }
              }
            } else {
              console.log(`   ❌ Status: ${res.statusCode} - Error`);
              try {
                const parsed = JSON.parse(data);
                console.log(`   📄 Mensaje: ${parsed.message || parsed.error}`);
              } catch (e) {
                console.log(`   📄 Raw: ${data.substring(0, 100)}...`);
              }
            }
            resolve();
          });
        });
        req.on('error', reject);
        req.end();
      });
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('✅ Prueba completada!');
}

testMissingEndpoints().catch(console.error);
