const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, json: () => jsonData, statusCode: res.statusCode });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, text: data, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testLogin() {
  console.log('🔐 PROBANDO LOGIN DEL ADMINISTRADOR\n');
  
  try {
    // Probar login con admin
    const loginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Error en login:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login exitoso:');
    console.log(`👤 Usuario: ${loginData.user.firstName} ${loginData.user.lastName}`);
    console.log(`📧 Email: ${loginData.user.email}`);
    console.log(`🎭 Rol: ${loginData.user.role.name}`);
    console.log(`🔑 Token: ${loginData.token.substring(0, 50)}...`);
    
    // Probar acceso a roles con el token
    console.log('\n🧪 PROBANDO ACCESO A ROLES...');
    const rolesResponse = await makeRequest('http://localhost:3001/api/roles', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (rolesResponse.ok) {
      const roles = await rolesResponse.json();
      console.log(`✅ Acceso a roles exitoso: ${roles.length} roles encontrados`);
    } else {
      const errorData = await rolesResponse.json();
      console.error('❌ Error accediendo a roles:', errorData);
    }
    
    // Probar acceso a departamentos con el token
    console.log('\n🧪 PROBANDO ACCESO A DEPARTAMENTOS...');
    const depsResponse = await makeRequest('http://localhost:3001/api/departments', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (depsResponse.ok) {
      const departments = await depsResponse.json();
      console.log(`✅ Acceso a departamentos exitoso: ${departments.length} departamentos encontrados`);
    } else {
      const errorData = await depsResponse.json();
      console.error('❌ Error accediendo a departamentos:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
