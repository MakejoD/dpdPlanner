import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const StrategicPlanning = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Planificación Estratégica
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de planificación estratégica en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Gestión de ejes estratégicos, objetivos, productos/servicios y actividades del POA.
        </Typography>
      </Paper>
    </Box>
  )
}

export default StrategicPlanning
