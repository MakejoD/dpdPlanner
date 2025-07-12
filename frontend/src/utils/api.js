const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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

// HTTP client helper
export const httpClient = {
  get: async (url, options = {}) => {
    const token = localStorage.getItem('token')
    return await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })
  },
  
  post: async (url, data, options = {}) => {
    const token = localStorage.getItem('token')
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })
  },
  
  put: async (url, data, options = {}) => {
    const token = localStorage.getItem('token')
    return await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })
  },
  
  delete: async (url, options = {}) => {
    const token = localStorage.getItem('token')
    return await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    })
  },
}

export default api
