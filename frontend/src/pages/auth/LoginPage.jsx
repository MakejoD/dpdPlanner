import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Paper,
  Container,
  Collapse,
  Grid,
  Chip
} from '@mui/material'
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  AccountBalance as GovernmentIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

const LoginPage = () => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickLogin, setShowQuickLogin] = useState(false)

  // Datos de usuarios de prueba actualizados según el backend
  const quickLoginUsers = [
    {
      name: 'Administrador del Sistema',
      email: 'admin@poa.gov',
      password: 'admin123',
      role: 'ADMIN',
      icon: <SupervisorIcon />,
      color: '#d32f2f',
      description: 'Acceso completo al sistema'
    },
    {
      name: 'Director de Planificación',
      email: 'director.planificacion@poa.gov',
      password: 'director123',
      role: 'DIRECTOR',
      icon: <PersonIcon />,
      color: '#1976d2',
      description: 'Formulación y seguimiento del POA'
    },
    {
      name: 'Director de Compras',
      email: 'director.compras@poa.gov',
      password: 'compras123',
      role: 'DIRECTOR',
      icon: <EngineeringIcon />,
      color: '#388e3c',
      description: 'Gestión de contrataciones y compras'
    }
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión. Verifique su conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleQuickLogin = async (user) => {
    setLoading(true)
    setError('')
    
    try {
      const result = await login(user.email, user.password)
      
      if (!result.success) {
        setError(result.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión. Verifique su conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        padding: 2
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="sm" sx={{ width: '100%', maxWidth: { xs: '100%', sm: '500px' } }}>
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            width: '100%'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                mb: 2
              }}
            >
              <GovernmentIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Sistema POA
            </Typography>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Gestión y Seguimiento del Plan Operativo Anual
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Ingrese sus credenciales para acceder al sistema
            </Typography>
          </Box>

          {/* Login Form */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                  disabled={loading}
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  sx={{ mb: 4 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={togglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  disabled={loading}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                    }
                  }}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Login Section */}
          <Box sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              endIcon={<ExpandMoreIcon sx={{ 
                transform: showQuickLogin ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} />}
              sx={{ mb: 2 }}
            >
              Login Rápido - Usuarios de Demostración
            </Button>
            
            <Collapse in={showQuickLogin}>
              <Grid container spacing={2}>
                {quickLoginUsers.map((user, index) => (
                  <Grid item xs={12} key={index}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        border: '2px solid transparent',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                          borderColor: user.color
                        }
                      }}
                      onClick={() => handleQuickLogin(user)}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            backgroundColor: user.color,
                            color: 'white',
                            mr: 2,
                            flexShrink: 0
                          }}
                        >
                          {user.icon}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 0.5 }}>
                            {user.name}
                          </Typography>
                          <Chip 
                            label={user.role} 
                            size="small" 
                            sx={{ 
                              backgroundColor: `${user.color}20`,
                              color: user.color,
                              mb: 0.5,
                              fontSize: '0.75rem'
                            }} 
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {user.description}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {user.email}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Collapse>
          </Box>

          {/* Demo Credentials - Simplified */}
          <Box sx={{ mt: 3, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
            <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 600 }}>
              💡 Consejo: Use el "Login Rápido" arriba o ingrese manualmente:
            </Typography>
            <Typography variant="caption" display="block">
              <strong>Admin:</strong> admin@poa.gov / admin123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default LoginPage
