import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const DepartmentManagement = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gestión de Departamentos
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de gestión de departamentos en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Estructura jerárquica de departamentos para organizar usuarios y planificación.
        </Typography>
      </Paper>
    </Box>
  )
}

export default DepartmentManagement
