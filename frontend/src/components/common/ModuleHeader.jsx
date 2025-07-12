import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const ModuleHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  buttonText, 
  onButtonClick 
}) => {
  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <Icon sx={{ mr: 2, color: 'primary.main' }} />
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {/* Barra de herramientas */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onButtonClick}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {buttonText}
        </Button>
      </Box>
    </>
  );
};

export default ModuleHeader;
