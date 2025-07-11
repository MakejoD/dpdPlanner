import React from 'react'
import { Box, Typography, Paper } from '@mui/material'

const BudgetExecution = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ejecución Presupuestaria
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Módulo de ejecución presupuestaria en desarrollo...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Seguimiento de la ejecución presupuestaria: asignado, comprometido, devengado y pagado.
        </Typography>
      </Paper>
    </Box>
  )
}

export default BudgetExecution
