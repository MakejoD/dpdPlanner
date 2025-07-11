import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const ProgressTracking = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Seguimiento de Avances
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de seguimiento de avances en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Registro y seguimiento de reportes de avance con archivos adjuntos y sistema de aprobación.
        </Typography>
      </Paper>
    </Box>
  )
}

export default ProgressTracking
