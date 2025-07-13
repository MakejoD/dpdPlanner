import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert } from '@mui/material';

// Import the httpClient utility
const httpClient = {
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const API_BASE_URL = 'http://localhost:3001/api';
    
    // Ensure proper URL construction
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = `${API_BASE_URL}/${cleanUrl}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

const ApprovalSystemTest = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, { 
      message, 
      type, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const testApprovalStats = async () => {
    try {
      addResult('📊 Testing approval stats...', 'info');
      const response = await httpClient.get('/approvals/stats');
      
      if (response.success && response.data) {
        const stats = response.data.summary;
        addResult(`✅ Stats API working! Pending: ${stats.pending}, Approved: ${stats.approved}`, 'success');
        return true;
      } else {
        addResult('❌ Stats API failed - invalid response structure', 'error');
        return false;
      }
    } catch (error) {
      addResult(`❌ Stats API error: ${error.message}`, 'error');
      return false;
    }
  };

  const testPendingReports = async () => {
    try {
      addResult('📋 Testing pending reports...', 'info');
      const response = await httpClient.get('/approvals/pending');
      
      if (response.success) {
        const count = response.data ? response.data.length : 0;
        addResult(`✅ Pending reports API working! Found ${count} reports`, 'success');
        return true;
      } else {
        addResult('❌ Pending reports API failed', 'error');
        return false;
      }
    } catch (error) {
      addResult(`❌ Pending reports error: ${error.message}`, 'error');
      return false;
    }
  };

  const testMyReports = async () => {
    try {
      addResult('📝 Testing my reports...', 'info');
      const response = await httpClient.get('/approvals/my-reports');
      
      if (response.success) {
        const count = response.data ? response.data.length : 0;
        addResult(`✅ My reports API working! Found ${count} reports`, 'success');
        return true;
      } else {
        addResult('❌ My reports API failed', 'error');
        return false;
      }
    } catch (error) {
      addResult(`❌ My reports error: ${error.message}`, 'error');
      return false;
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    addResult('🚀 Starting approval system API tests...', 'info');
    
    const statsSuccess = await testApprovalStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const pendingSuccess = await testPendingReports();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const myReportsSuccess = await testMyReports();
    
    if (statsSuccess && pendingSuccess && myReportsSuccess) {
      addResult('🎉 All API tests passed! Approval system is ready.', 'success');
    } else {
      addResult('⚠️ Some tests failed. Check the errors above.', 'error');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    // Auto-run tests on component mount
    runAllTests();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test Sistema de Aprobaciones (React)
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Este componente prueba que las APIs de aprobación funcionan correctamente desde React.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={runAllTests} 
          disabled={isLoading}
          sx={{ mr: 2 }}
        >
          {isLoading ? 'Ejecutando...' : '🔄 Ejecutar Tests'}
        </Button>
      </Box>

      <Box>
        {results.map((result, index) => (
          <Alert 
            key={index}
            severity={result.type === 'success' ? 'success' : result.type === 'error' ? 'error' : 'info'}
            sx={{ mb: 1 }}
          >
            <strong>{result.timestamp}:</strong> {result.message}
          </Alert>
        ))}
      </Box>
    </Box>
  );
};

export default ApprovalSystemTest;
