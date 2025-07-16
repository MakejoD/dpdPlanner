import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  CardActions,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  Container
} from '@mui/material'

const Dashboard = () => {
  // ... todo el código existente se mantiene igual ...

  return (
    <Container maxWidth={false} disableGutters sx={{ px: 1 }}>
      <Box>
        {/* Header modernizado */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" fontWeight="700" gutterBottom sx={{ 
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Panel de Control
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Bienvenido, {user?.firstName} {user?.lastName}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip 
                label={user?.role?.name} 
                color="primary" 
                variant="filled"
                sx={{ fontWeight: 'bold' }}
              />
              {user?.department && (
                <Chip 
                  label={user.department.name} 
                  color="secondary" 
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
          
          <Tooltip title="Actualizar datos">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ 
                backgroundColor: 'primary.main', 
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
            >
              {refreshing ? <CircularProgress size={24} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards optimizadas - Ahora usan todo el ancho disponible */}
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {statsCards.map((card, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} xl={2} key={index}>
              {/* Card content remains the same */}
            </Grid>
          ))}
        </Grid>

        {/* Contenido principal - Distribución optimizada */}
        <Grid container spacing={2}>
          {/* Sección principal más amplia */}
          <Grid item xs={12} xl={10}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 2 }}>
                {/* Contenido principal */}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar compacto */}
          <Grid item xs={12} xl={2}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 1.5 }}>
                {/* Sidebar content */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Secciones de rol con menos espaciado */}
        <Box sx={{ mt: 1 }}>
          {/* Todas las secciones específicas por rol con spacing reducido */}
        </Box>
      </Box>
    </Container>
  )
}

export default Dashboard
