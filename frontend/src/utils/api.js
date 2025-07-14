const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Función helper para manejar errores 401
const handleUnauthorized = () => {
  localStorage.removeItem('token')
  // Recargar la página para forzar logout
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// Función helper para manejar respuestas HTTP
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
    
    // Manejar errores 401 automáticamente
    if (response.status === 401) {
      handleUnauthorized()
    }
    
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }
  
  const jsonData = await response.json()
  return { data: jsonData }
}

// Función helper para construir URLs correctamente
const buildUrl = (endpoint) => {
  // Remover slash inicial del endpoint si existe
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // Asegurar que API_BASE_URL no termine con slash
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL
  return `${baseUrl}/${cleanEndpoint}`
}

// HTTP client helper
const httpClient = {
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildUrl(url), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })
    
    return handleResponse(response)
  },
  
  post: async (url, data, options = {}) => {
    const token = localStorage.getItem('token')
    
    // Determinar si estamos enviando FormData
    const isFormData = data instanceof FormData
    
    const response = await fetch(buildUrl(url), {
      method: 'POST',
      headers: {
        // Solo agregar Content-Type si no es FormData (el browser lo agrega automáticamente)
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    })
    
    return handleResponse(response)
  },
  
  put: async (url, data, options = {}) => {
    const token = localStorage.getItem('token')
    
    // Determinar si estamos enviando FormData
    const isFormData = data instanceof FormData
    
    const response = await fetch(buildUrl(url), {
      method: 'PUT',
      headers: {
        // Solo agregar Content-Type si no es FormData (el browser lo agrega automáticamente)
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    })
    
    return handleResponse(response)
  },
  
  delete: async (url, options = {}) => {
    const token = localStorage.getItem('token')
    const response = await fetch(buildUrl(url), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })
    
    return handleResponse(response)
  },
}

// Export the HTTP client as the default export (like axios)
export default httpClient

// Legacy exports for backward compatibility
export const api = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
  },
  
  // User endpoints
  users: {
    base: `${API_BASE_URL}/users`,
    profile: (id = 'me') => `${API_BASE_URL}/users/${id}`,
  },
  
  // Other endpoints
  roles: `${API_BASE_URL}/roles`,
  permissions: `${API_BASE_URL}/permissions`,
  departments: `${API_BASE_URL}/departments`,
}

export { httpClient }
