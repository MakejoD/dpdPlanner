// Test the frontend API connectivity
const testFrontendAPI = async () => {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('Testing from frontend perspective...');
    
    // Test using fetch (no axios dependency)
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@poa.gov',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.log('❌ Login failed:', loginResponse.status, errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('🔑 Token:', loginData.token.substring(0, 50) + '...');
    
    // Test indicators endpoint
    const indicatorsResponse = await fetch(`${baseURL}/indicators?isActive=true`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!indicatorsResponse.ok) {
      const errorData = await indicatorsResponse.text();
      console.log('❌ Indicators failed:', indicatorsResponse.status, errorData);
      return;
    }
    
    const indicatorsData = await indicatorsResponse.json();
    console.log('✅ Indicators successful');
    console.log('📊 Count:', indicatorsData.indicators?.length || 0);
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testFrontendAPI();
