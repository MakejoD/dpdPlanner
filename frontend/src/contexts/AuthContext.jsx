import React, { createContext, useContext, useReducer, useEffect } from 'react'
import toast from 'react-hot-toast'
import { api, httpClient } from '../utils/api'

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
      
      const response = await httpClient.post(api.auth.login, { email, password })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Error en la autenticación')
      }

      const data = await response.json()

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
      console.error('Login error:', error)
      dispatch({ type: 'AUTH_ERROR' })
      const errorMessage = error.message || 'Error al iniciar sesión'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // Función para logout
  const logout = async () => {
    try {
      // Llamar al endpoint de logout si hay token
      if (state.token) {
        await httpClient.post(api.auth.logout)
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

      const response = await httpClient.get(api.users.profile(state.user?.id))

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

      const response = await httpClient.post(api.auth.refresh)

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

      // Por ahora solo verificamos que existe el token
      // TODO: Implementar verificación completa cuando el backend esté listo
      dispatch({ type: 'SET_LOADING', payload: false })
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
