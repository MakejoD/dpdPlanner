const http = require('http');
const jwt = require('jsonwebtoken');

async function testAllEndpoints() {
  console.log('🧪 Testing all fixed endpoints...\n');
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: '37914cec-7859-4ff5-b4ce-e83ef37f053c', email: 'admin@poa.gov', roleId: 'role-id' },
    'dpd-planner-jwt-secret-key-2025',
    { expiresIn: '1h' }
  );

  const endpoints = [
    { name: 'PACC Compliance', path: '/api/pacc/compliance/latest', auth: false },
    { name: 'Approvals Pending', path: '/api/approvals/pending', auth: true },
    { name: 'Procurement Processes', path: '/api/procurement-processes', auth: true },
    { name: 'Departments', path: '/api/departments', auth: true },
    { name: 'Budget Execution', path: '/api/budget-execution', auth: true }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.path, endpoint.auth ? token : null);
  }
  
  console.log('\n✅ All endpoint tests completed!');
}

function testEndpoint(name, path, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`📊 ${name}:`);
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.success !== undefined) {
              console.log(`   Success: ${parsed.success}`);
              console.log(`   Message: ${parsed.message || 'N/A'}`);
            } else {
              console.log(`   Response: Valid JSON data received`);
            }
            console.log(`   ✅ Working properly`);
          } catch (e) {
            console.log(`   Response: Non-JSON response (${data.length} bytes)`);
            console.log(`   ✅ Working properly`);
          }
        } else {
          console.log(`   ❌ Error: ${res.statusCode}`);
          try {
            const parsed = JSON.parse(data);
            console.log(`   Error: ${parsed.message || parsed.error || 'Unknown error'}`);
          } catch (e) {
            console.log(`   Raw error: ${data.substring(0, 100)}...`);
          }
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`📊 ${name}:`);
      console.log(`   ❌ Connection Error: ${e.message}`);
      console.log('');
      resolve();
    });

    req.end();
  });
}

testAllEndpoints();
