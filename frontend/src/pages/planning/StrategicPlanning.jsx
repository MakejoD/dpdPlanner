import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import StrategicAxesManagement from './StrategicAxesManagement';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`planning-tabpanel-${index}`}
      aria-labelledby={`planning-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StrategicPlanning = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const planningModules = [
    {
      id: 'strategic-axes',
      title: 'Ejes Estratégicos',
      description: 'Gestiona los ejes estratégicos del Plan Operativo Anual',
      icon: <TrendingUpIcon />,
      status: 'active',
      progress: 100,
      color: 'primary'
    },
    {
      id: 'objectives',
      title: 'Objetivos',
      description: 'Define objetivos específicos por cada eje estratégico',
      icon: <AssignmentIcon />,
      status: 'pending',
      progress: 0,
      color: 'secondary'
    },
    {
      id: 'products',
      title: 'Productos/Servicios',
      description: 'Productos y servicios a entregar por objetivo',
      icon: <BusinessIcon />,
      status: 'pending',
      progress: 0,
      color: 'info'
    },
    {
      id: 'activities',
      title: 'Actividades',
      description: 'Actividades específicas para alcanzar cada producto',
      icon: <SettingsIcon />,
      status: 'pending',
      progress: 0,
      color: 'warning'
    },
    {
      id: 'indicators',
      title: 'Indicadores',
      description: 'Indicadores de medición y seguimiento',
      icon: <AnalyticsIcon />,
      status: 'pending',
      progress: 0,
      color: 'success'
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📋 Planificación Estratégica POA
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona la estructura completa del Plan Operativo Anual
        </Typography>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {planningModules.map((module) => (
          <Grid item xs={12} sm={6} lg={4} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                opacity: module.status === 'pending' ? 0.7 : 1,
                cursor: module.status === 'active' ? 'pointer' : 'default',
                '&:hover': module.status === 'active' ? {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                } : {}
              }}
              onClick={() => {
                if (module.status === 'active' && module.id === 'strategic-axes') {
                  setActiveTab(0);
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: `${module.color}.light`,
                      color: `${module.color}.main`,
                      mr: 2
                    }}
                  >
                    {module.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {module.title}
                    </Typography>
                    <Chip
                      label={module.status === 'active' ? 'Disponible' : 'Próximamente'}
                      color={module.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {module.description}
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Progreso
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {module.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={module.progress}
                    color={module.color}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
              
              {module.status === 'active' && (
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (module.id === 'strategic-axes') {
                        setActiveTab(0);
                      }
                    }}
                  >
                    Gestionar
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for detailed management */}
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="🎯 Ejes Estratégicos" />
          <Tab label="📊 Objetivos" disabled />
          <Tab label="🎁 Productos/Servicios" disabled />
          <Tab label="⚙️ Actividades" disabled />
          <Tab label="📈 Indicadores" disabled />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <StrategicAxesManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              📊 Gestión de Objetivos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta funcionalidad estará disponible una vez completada la gestión de ejes estratégicos
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              🎁 Gestión de Productos/Servicios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta funcionalidad estará disponible próximamente
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              ⚙️ Gestión de Actividades
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta funcionalidad estará disponible próximamente
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              📈 Gestión de Indicadores
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Esta funcionalidad estará disponible próximamente
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StrategicPlanning;
