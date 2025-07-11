import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reportes y Dashboards
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de reportes y dashboards en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Dashboards interactivos con gráficos, filtros y exportación de reportes.
        </Typography>
      </Paper>
    </Box>
  )
}

export default Reports
