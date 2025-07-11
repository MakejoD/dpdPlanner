import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const RoleManagement = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Roles y Permisos
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de gestión de roles y permisos en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Sistema RBAC para configurar roles y asignar permisos granulares por recurso y acción.
        </Typography>
      </Paper>
    </Box>
  )
}

export default RoleManagement
