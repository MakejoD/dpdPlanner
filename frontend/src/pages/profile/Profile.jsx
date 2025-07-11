import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const Profile = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de perfil de usuario en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Gestión del perfil personal y configuraciones de usuario.
        </Typography>
      </Paper>
    </Box>
  )
}

export default Profile
