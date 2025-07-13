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
  Tooltip,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  TrackChanges as TargetIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import StrategicAxesManagement from './StrategicAxesManagement';
import ObjectiveManagement from './ObjectiveManagement';
import ProductManagement from './ProductManagement';
import ActivityManagement from './ActivityManagement';
import IndicatorManagement from './IndicatorManagement';

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
  const theme = useTheme();

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
      color: 'primary',
      count: '6',
      subtitle: 'Ejes configurados'
    },
    {
      id: 'objectives',
      title: 'Objetivos',
      description: 'Define objetivos específicos por cada eje estratégico',
      icon: <TargetIcon />,
      status: 'active',
      progress: 100,
      color: 'secondary',
      count: '16',
      subtitle: 'Objetivos estratégicos'
    },
    {
      id: 'products',
      title: 'Productos/Servicios',
      description: 'Productos y servicios a entregar por objetivo',
      icon: <BusinessIcon />,
      status: 'active',
      progress: 100,
      color: 'info',
      count: '34',
      subtitle: 'Productos y servicios'
    },
    {
      id: 'activities',
      title: 'Actividades',
      description: 'Actividades específicas para alcanzar cada producto',
      icon: <SettingsIcon />,
      status: 'active',
      progress: 100,
      color: 'warning',
      count: '33',
      subtitle: 'Actividades planificadas'
    },
    {
      id: 'indicators',
      title: 'Indicadores',
      description: 'Indicadores de medición y seguimiento',
      icon: <AnalyticsIcon />,
      status: 'active',
      progress: 100,
      color: 'success',
      count: '15',
      subtitle: 'Indicadores de gestión'
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
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {planningModules.map((module) => (
          <Grid item xs={12} sm={6} lg={4} key={module.id}>
            <Card 
              sx={{ 
                height: '100%',
                opacity: module.status === 'pending' ? 0.7 : 1,
                cursor: module.status === 'active' ? 'pointer' : 'default',
                transition: 'all 0.3s ease-in-out',
                '&:hover': module.status === 'active' ? {
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                } : {}
              }}
              onClick={() => {
                if (module.status === 'active') {
                  if (module.id === 'strategic-axes') {
                    setActiveTab(0);
                  } else if (module.id === 'objectives') {
                    setActiveTab(1);
                  } else if (module.id === 'products') {
                    setActiveTab(2);
                  } else if (module.id === 'activities') {
                    setActiveTab(3);
                  } else if (module.id === 'indicators') {
                    setActiveTab(4);
                  }
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
                      width: 56,
                      height: 56,
                      borderRadius: '12px',
                      bgcolor: `${module.color}.light`,
                      color: `${module.color}.main`,
                      mr: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: `${module.color}.100`,
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    {module.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {module.title}
                    </Typography>
                    <Chip
                      label={module.status === 'active' ? 'Disponible' : 'Próximamente'}
                      color="default"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        fontSize: '0.75rem',
                        bgcolor: module.status === 'active' ? 'success.50' : 'grey.100',
                        color: module.status === 'active' ? 'success.main' : 'text.secondary',
                        borderColor: module.status === 'active' ? 'success.200' : 'grey.300'
                      }}
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.4 }}>
                  {module.description}
                </Typography>
                
                {/* Estadísticas */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography
                    variant="h4"
                    color={`${module.color}.main`}
                    sx={{ fontWeight: 700 }}
                  >
                    {module.count}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {module.subtitle}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progreso
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.primary"
                      sx={{ fontWeight: 600 }}
                    >
                      {module.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={module.progress}
                    color={module.color}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'action.hover',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
              </CardContent>
              
              {module.status === 'active' && (
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="medium"
                    variant="outlined"
                    color="primary"
                    startIcon={<ViewIcon />}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      if (module.id === 'strategic-axes') {
                        setActiveTab(0);
                      } else if (module.id === 'objectives') {
                        setActiveTab(1);
                      } else if (module.id === 'products') {
                        setActiveTab(2);
                      } else if (module.id === 'activities') {
                        setActiveTab(3);
                      } else if (module.id === 'indicators') {
                        setActiveTab(4);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      py: 1,
                      borderColor: 'grey.300',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'grey.400',
                        bgcolor: 'grey.50'
                      }
                    }}
                  >
                    Gestionar {module.title}
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
          <Tab label="📊 Objetivos" />
          <Tab label="🎁 Productos/Servicios" />
          <Tab label="⚙️ Actividades" />
          <Tab label="📈 Indicadores" />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <StrategicAxesManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <ObjectiveManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <ProductManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <ActivityManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <IndicatorManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StrategicPlanning;
