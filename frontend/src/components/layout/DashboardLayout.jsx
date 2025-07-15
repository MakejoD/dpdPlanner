import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountTree as AccountTreeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MoneyIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ExpandLess,
  ExpandMore,
  Security as SecurityIcon,
  Business as BusinessIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  ShoppingCart as ShoppingCartIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

import { useAuth } from '../../contexts/AuthContext'
import ConnectionStatus from '../common/ConnectionStatus'

const drawerWidth = 280

const DashboardLayout = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, hasPermission, hasRole } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [expandedMenus, setExpandedMenus] = useState({
    admin: false,
    planning: false,
    tracking: false,
    pacc: false
  })

  // Configuración del menú de navegación
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      permission: null
    },
    {
      title: 'Administración',
      icon: <SettingsIcon />,
      expandable: true,
      key: 'admin',
      permission: 'read:user',
      children: [
        {
          title: 'Usuarios',
          icon: <PeopleIcon />,
          path: '/admin/users',
          permission: 'read:user'
        },
        {
          title: 'Roles y Permisos',
          icon: <SecurityIcon />,
          path: '/admin/roles',
          permission: 'read:role'
        },
        {
          title: 'Departamentos',
          icon: <BusinessIcon />,
          path: '/admin/departments',
          permission: 'read:department'
        }
      ]
    },
    {
      title: 'Planificación',
      icon: <AccountTreeIcon />,
      expandable: true,
      key: 'planning',
      permission: 'read:strategic_axis',
      children: [
        {
          title: 'Ejes Estratégicos',
          icon: <TimelineIcon />,
          path: '/planning/strategic-axes',
          permission: 'read:strategic_axis'
        },
        {
          title: 'Objetivos',
          icon: <AssignmentIcon />,
          path: '/planning/objectives',
          permission: 'read:objective'
        },
        {
          title: 'Productos/Servicios',
          icon: <BarChartIcon />,
          path: '/planning/products',
          permission: 'read:product'
        },
        {
          title: 'Actividades',
          icon: <AssignmentIcon />,
          path: '/planning/activities',
          permission: 'read:activity'
        },
        {
          title: 'Indicadores',
          icon: <TrendingUpIcon />,
          path: '/planning/indicators',
          permission: 'read:indicator'
        }
      ]
    },
    {
      title: 'Seguimiento',
      icon: <TrendingUpIcon />,
      expandable: true,
      key: 'tracking',
      permission: 'read:progress_report',
      children: [
        {
          title: 'Informes de Avances',
          icon: <AssignmentIcon />,
          path: '/tracking/progress',
          permission: 'read:progress_report'
        },
        {
          title: 'Indicadores',
          icon: <BarChartIcon />,
          path: '/tracking/indicators',
          permission: 'read:indicator'
        }
      ]
    },
    {
      title: 'PACC',
      icon: <ShoppingCartIcon />,
      expandable: true,
      key: 'pacc',
      permission: 'read:procurement',
      children: [
        {
          title: 'Dashboard PACC',
          icon: <DashboardIcon />,
          path: '/pacc/dashboard',
          permission: 'read:dashboard'
        },
        {
          title: 'Cronogramas',
          icon: <ScheduleIcon />,
          path: '/pacc/schedules',
          permission: 'read:procurement'
        }
      ]
    },
    {
      title: 'Presupuesto',
      icon: <MoneyIcon />,
      path: '/budget',
      permission: 'read:budget'
    },
    {
      title: 'Reportes',
      icon: <ReportsIcon />,
      path: '/reports',
      permission: 'read:dashboard'
    }
  ]

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleMenuClose()
    await logout()
  }

  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  // Auto-expandir menús cuando hay rutas activas
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => location.pathname === child.path)
        if (hasActiveChild && !expandedMenus[item.key]) {
          setExpandedMenus(prev => ({
            ...prev,
            [item.key]: true
          }))
        }
      }
    })
  }, [location.pathname])

  const toggleExpandedMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }))
  }

  const checkPermission = (permission) => {
    if (!permission) return true
    const [action, resource] = permission.split(':')
    return hasPermission(action, resource)
  }

  const renderMenuItem = (item, isChild = false) => {
    // Verificar permisos
    if (!checkPermission(item.permission)) {
      return null
    }

    const isActive = location.pathname === item.path
    const isExpanded = expandedMenus[item.key]
    
    // Para menús expandibles, verificar si algún hijo está activo
    const hasActiveChild = item.children?.some(child => location.pathname === child.path)

    if (item.expandable) {
      return (
        <React.Fragment key={item.title}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => toggleExpandedMenu(item.key)}
              sx={{
                pl: isChild ? 4 : 2,
                backgroundColor: hasActiveChild ? 'action.selected' : 'transparent',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: hasActiveChild ? 'primary.main' : 'text.secondary' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: hasActiveChild ? 600 : 500,
                  fontSize: '0.9rem',
                  color: hasActiveChild ? 'primary.main' : 'text.primary'
                }}
              />
              {isExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderMenuItem(child, true))}
            </List>
          </Collapse>
        </React.Fragment>
      )
    }

    return (
      <ListItem key={item.title} disablePadding>
        <ListItemButton
          onClick={() => handleNavigate(item.path)}
          sx={{
            pl: isChild ? 4 : 2,
            backgroundColor: isActive ? 'action.selected' : 'transparent',
            borderRight: isActive ? 3 : 0,
            borderRightColor: 'primary.main',
            '&:hover': {
              backgroundColor: isActive ? 'action.selected' : 'action.hover'
            }
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: isActive ? 'primary.main' : 'text.secondary'
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.title}
            primaryTypographyProps={{
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.9rem',
              color: isActive ? 'primary.main' : 'text.primary'
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  const drawer = (
    <Box>
      {/* Logo y header del drawer */}
      <Box sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight="bold">
          Sistema POA
        </Typography>
        <Typography variant="caption" display="block">
          Plan Operativo Anual
        </Typography>
      </Box>

      <Divider />

      {/* Información del usuario */}
      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              mr: 2,
              backgroundColor: 'primary.main'
            }}
          >
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight="600" noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={user?.role?.name || 'Sin rol'}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontSize: '0.75rem' }}
        />
      </Box>

      <Divider />

      {/* Menú de navegación */}
      <List sx={{ pt: 1 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </List>

      <Divider sx={{ mt: 'auto' }} />

      {/* Perfil y logout */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavigate('/profile')}>
            <ListItemIcon>
              <AccountIcon />
            </ListItemIcon>
            <ListItemText primary="Mi Perfil" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { lg: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Gestión POA
          </Typography>

          {/* Información del usuario en el header */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip
              label={user?.department?.name || 'Sin departamento'}
              size="small"
              variant="outlined"
              sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
            />
            
            <IconButton
              size="large"
              aria-label="account menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuClick}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, backgroundColor: 'primary.main' }}>
                {user?.firstName?.charAt(0)}
              </Avatar>
            </IconButton>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); handleNavigate('/profile'); }}>
                <ListItemIcon>
                  <AccountIcon fontSize="small" />
                </ListItemIcon>
                Mi Perfil
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar Sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ p: 3 }}>
          <ConnectionStatus />
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardLayout
