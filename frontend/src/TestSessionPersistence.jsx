import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

const TestSessionPersistence = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();
  const [credentials, setCredentials] = useState({ email: 'admin@poa.gov', password: 'admin123' });

  const handleLogin = async () => {
    const result = await login(credentials.email, credentials.password);
    console.log('Login result:', result);
  };

  const handleLogout = async () => {
    await logout();
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Test de Persistencia de Sesión</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Estado Actual:</h3>
        <p><strong>Loading:</strong> {loading ? '✅ Sí' : '❌ No'}</p>
        <p><strong>Autenticado:</strong> {isAuthenticated ? '✅ Sí' : '❌ No'}</p>
        <p><strong>Usuario:</strong> {user ? `${user.firstName} ${user.lastName} (${user.email})` : 'N/A'}</p>
        <p><strong>Rol:</strong> {user?.role?.name || 'N/A'}</p>
        <p><strong>Token en localStorage:</strong> {localStorage.getItem('token') ? '✅ Presente' : '❌ Ausente'}</p>
      </div>

      {!isAuthenticated ? (
        <div style={{ marginBottom: '20px' }}>
          <h3>Login:</h3>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              style={{ marginRight: '10px', padding: '8px' }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              style={{ marginRight: '10px', padding: '8px' }}
            />
            <button onClick={handleLogin} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h3>Acciones:</h3>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>
            Cerrar Sesión
          </button>
          <button onClick={reloadPage} style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px' }}>
            Recargar Página (Test Persistencia)
          </button>
        </div>
      )}

      <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Instrucciones del Test:</h3>
        <ol>
          <li>✅ Haz login con las credenciales</li>
          <li>✅ Verifica que el estado cambie a "Autenticado: Sí"</li>
          <li>✅ Haz clic en "Recargar Página" para simular una recarga</li>
          <li>✅ Verifica que después de la recarga siga autenticado</li>
          <li>✅ Prueba "Cerrar Sesión" para verificar que limpia la sesión</li>
        </ol>
      </div>
    </div>
  );
};

export default TestSessionPersistence;
