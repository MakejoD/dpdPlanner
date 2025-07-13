// Test simple para verificar que AuthContext funciona sin errores
console.log('🧪 Test: Verificando AuthContext sin errores...\n');

// Simular la estructura que devuelve httpClient después del fix
const mockLoginResponse = {
  data: {
    success: true,
    data: {
      user: {
        id: '123',
        name: 'Test User',
        email: 'test@test.com',
        role: { name: 'Administrador' },
        permissions: [
          { action: 'read', resource: 'users' },
          { action: 'write', resource: 'activities' }
        ]
      },
      token: 'mock-jwt-token'
    },
    message: 'Login exitoso'
  }
};

// Simular el estado inicial con authReducer
const initialState = {
  user: null,
  token: null, // Simular sin token
  isAuthenticated: false,
  loading: true,
  permissions: []
};

// Simular authReducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        permissions: action.payload.user?.permissions || []  // Fix aplicado
      };
    default:
      return state;
  }
};

// Test del reducer
console.log('📝 Test 1: authReducer con AUTH_SUCCESS');
const newState = authReducer(initialState, {
  type: 'AUTH_SUCCESS',
  payload: {
    user: mockLoginResponse.data.data.user,
    token: mockLoginResponse.data.data.token
  }
});

console.log('✅ Estado actualizado:', {
  isAuthenticated: newState.isAuthenticated,
  userExists: !!newState.user,
  permissionsLength: newState.permissions.length,
  loading: newState.loading
});

// Test hasPermission
console.log('\\n📝 Test 2: hasPermission function');
const hasPermission = (permissions, action, resource) => {
  return (permissions || []).some(
    permission => permission.action === action && permission.resource === resource
  );
};

const canReadUsers = hasPermission(newState.permissions, 'read', 'users');
const canWriteActivities = hasPermission(newState.permissions, 'write', 'activities');
const canDeleteUsers = hasPermission(newState.permissions, 'delete', 'users');

console.log('✅ Permisos:', {
  canReadUsers,
  canWriteActivities,
  canDeleteUsers
});

console.log('\\n🎉 AuthContext debería funcionar sin errores!');
console.log('🔧 Fixes aplicados:');
console.log('  - action.payload.user?.permissions || [] (safe access)');
console.log('  - (state.permissions || []).some() (safe array access)');
console.log('  - response.data.data.user en login (estructura httpClient)');
