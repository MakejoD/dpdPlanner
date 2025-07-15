const http = require('http');
const jwt = require('jsonwebtoken');

function testApprovalsEndpoint() {
  console.log('🧪 Testing approvals endpoint with proper authentication...');
  
  // Generate a valid JWT token
  const token = jwt.sign(
    { 
      userId: '37914cec-7859-4ff5-b4ce-e83ef37f053c', 
      email: 'admin@poa.gov', 
      roleId: 'role-id' 
    },
    'dpd-planner-jwt-secret-key-2025',
    { expiresIn: '1h' }
  );
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/approvals/pending',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log('✅ Approvals endpoint working!');
        console.log(`   Found ${response.data?.reports?.length || 0} pending reports`);
        console.log(`   Total reports: ${response.data?.pagination?.total || 0}`);
      } else {
        console.log('❌ Approvals endpoint failed');
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });
  
  req.end();
}

testApprovalsEndpoint();
