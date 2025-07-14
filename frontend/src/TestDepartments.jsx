import { useState, useEffect } from 'react';
import httpClient from './utils/api';

const TestDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando departamentos con httpClient...');
      const response = await httpClient.get('/departments');
      console.log('📥 Respuesta completa:', response);
      setRawResponse(response);
      
      if (response.data.success) {
        console.log('✅ Datos encontrados:', response.data.data);
        setDepartments(response.data.data);
      } else {
        setError('Respuesta no exitosa: ' + JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('❌ Error cargando departamentos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test de Departamentos con httpClient</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadDepartments}>Recargar Departamentos</button>
      </div>
      
      {loading && <p>🔄 Cargando...</p>}
      {error && <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
        <strong>Error:</strong> {error}
      </div>}
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Estado:</h3>
        <p>Departamentos encontrados: {departments.length}</p>
        <p>Token disponible: {localStorage.getItem('token') ? '✅ Sí' : '❌ No'}</p>
      </div>
      
      {rawResponse && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Respuesta Raw:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', fontSize: '12px' }}>
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}
      
      <div>
        <h3>Departamentos:</h3>
        {departments.map(dept => (
          <div key={dept.id} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <strong>{dept.name}</strong> ({dept.code})
            <br />
            <small>ID: {dept.id}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestDepartments;
