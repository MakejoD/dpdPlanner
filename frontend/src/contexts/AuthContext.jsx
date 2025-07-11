import React, { createContext, useContext, useReducer, useEffect } from 'react'
import toast from 'react-hot-toast'

// Estado inicial
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  permissions: []
}

// Acciones
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        permissions: action.payload.user.permissions || []
      }
    case 'AUTH_ERROR':
      localStorage.removeItem('token')
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        permissions: []
      }
    case 'LOGOUT':
      localStorage.removeItem('token')
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        permissions: []
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    default:
      return state
  }
}

// Contexto
const AuthContext = createContext()

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Función para login
  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error en la autenticación')
      }

      // Guardar token en localStorage
      localStorage.setItem('token', data.token)

      // Actualizar estado
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token
        }
      })

      toast.success('¡Bienvenido al Sistema POA!')
      return { success: true }
      
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' })
      toast.error(error.message || 'Error al iniciar sesión')
      return { success: false, error: error.message }
    }
  }

  // Función para logout
  const logout = async () => {
    try {
      // Llamar al endpoint de logout si hay token
      if (state.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${state.token}`,
            'Content-Type': 'application/json'
          }
        })
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
      toast.success('Sesión cerrada exitosamente')
    }
  }

  // Función para verificar si el usuario tiene un permiso específico
  const hasPermission = (action, resource) => {
    if (!state.isAuthenticated || !state.user) {
      return false
    }

    // El administrador tiene todos los permisos
    if (state.user.role?.name === 'Administrador') {
      return true
    }

    // Verificar si el usuario tiene el permiso específico
    return state.permissions.some(
      permission => permission.action === action && permission.resource === resource
    )
  }

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (roleName) => {
    return state.user?.role?.name === roleName
  }

  // Función para obtener el perfil del usuario actual
  const getCurrentUser = async () => {
    try {
      if (!state.token) {
        dispatch({ type: 'AUTH_ERROR' })
        return
      }

      const response = await fetch(`/api/users/${state.user?.id || 'me'}`, {
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener el perfil del usuario')
      }

      const userData = await response.json()
      
      dispatch({
        type: 'UPDATE_USER',
        payload: userData
      })

    } catch (error) {
      console.error('Error al obtener perfil:', error)
      dispatch({ type: 'AUTH_ERROR' })
    }
  }

  // Función para renovar el token
  const refreshToken = async () => {
    try {
      if (!state.token) {
        dispatch({ type: 'AUTH_ERROR' })
        return false
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error al renovar el token')
      }

      const data = await response.json()
      localStorage.setItem('token', data.token)

      dispatch({
        type: 'UPDATE_USER',
        payload: { token: data.token }
      })

      return true
    } catch (error) {
      console.error('Error al renovar token:', error)
      dispatch({ type: 'AUTH_ERROR' })
      return false
    }
  }

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        dispatch({ type: 'AUTH_ERROR' })
        return
      }

      try {
        // Hacer una petición para verificar el token
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.token)
          
          // Obtener datos del usuario
          await getCurrentUser()
        } else {
          throw new Error('Token inválido')
        }
      } catch (error) {
        console.error('Error al verificar token:', error)
        dispatch({ type: 'AUTH_ERROR' })
      }
    }

    verifyToken()
  }, [])

  const value = {
    ...state,
    login,
    logout,
    hasPermission,
    hasRole,
    getCurrentUser,
    refreshToken
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
