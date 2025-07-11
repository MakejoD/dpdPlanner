import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const UserManagement = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Usuarios
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de gestión de usuarios en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Aquí se implementará el CRUD completo de usuarios con sistema de permisos granular.
        </Typography>
      </Paper>
    </Box>
  )
}

export default UserManagement
