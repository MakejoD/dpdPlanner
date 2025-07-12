import React from 'react';

const TestLogin = () => {
  const testLogin = async () => {
    try {
      console.log('Testing login...');
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@poa.gov',
          password: 'admin123'
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        alert('Login successful! Check console for details.');
      } else {
        const error = await response.json();
        console.error('Login failed:', error);
        alert('Login failed! Check console for details.');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error! Check console for details.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={testLogin} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Test Login
      </button>
    </div>
  );
};

export default TestLogin;
