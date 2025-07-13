import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControlLabel,
  Switch,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as ProductIcon
} from '@mui/icons-material';
import { httpClient } from '../../utils/api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [groupByObjective, setGroupByObjective] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'PRODUCT',
    objectiveId: '',
    order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar objetivos
      const objectivesResponse = await httpClient.get('/objectives');
      if (objectivesResponse.success) {
        setObjectives(objectivesResponse.data);
      }

      // Cargar productos
      const productsResponse = await httpClient.get('/products');
      if (productsResponse.success) {
        setProducts(productsResponse.data);
      }

      setError('');
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setSnackbar({ open: true, message: 'Error al cargar los datos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        code: product.code,
        type: product.type,
        objectiveId: product.objectiveId,
        order: product.order
      });
      setEditingProduct(product);
    } else {
      setFormData({
        name: '',
        description: '',
        code: '',
        type: 'PRODUCT',
        objectiveId: selectedObjectiveId || '',
        order: 0
      });
      setEditingProduct(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      code: '',
      type: 'PRODUCT',
      objectiveId: '',
      order: 0
    });
  };

  const handleSubmit = async () => {
    try {
      let response;
      if (editingProduct) {
        response = await httpClient.put(`/products/${editingProduct.id}`, formData);
      } else {
        response = await httpClient.post('/products', formData);
      }

      if (response.success) {
        const action = editingProduct ? 'actualizado' : 'creado';
        setSnackbar({ 
          open: true, 
          message: `Producto ${action} exitosamente`, 
          severity: 'success' 
        });
        handleCloseDialog();
        loadData();
      } else {
        throw new Error(response.message || 'Error al guardar el producto');
      }
    } catch (err) {
      setError('Error al guardar: ' + err.message);
      setSnackbar({ open: true, message: 'Error al guardar el producto', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este producto/servicio?')) {
      return;
    }

    try {
      const response = await httpClient.delete(`/products/${id}`);
      
      if (response.success) {
        setSnackbar({ 
          open: true, 
          message: 'Producto eliminado exitosamente', 
          severity: 'success' 
        });
        loadData();
      } else {
        throw new Error(response.message || 'Error al eliminar el producto');
      }
    } catch (err) {
      setError('Error al eliminar: ' + err.message);
      setSnackbar({ open: true, message: 'Error al eliminar el producto', severity: 'error' });
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;
    
    if (selectedObjectiveId) {
      filtered = filtered.filter(product => product.objectiveId === selectedObjectiveId);
    }
    
    if (selectedType) {
      filtered = filtered.filter(product => product.type === selectedType);
    }
    
    return filtered;
  };

  const getProductsByObjective = () => {
    const grouped = {};
    objectives.forEach(objective => {
      const objectiveProducts = products.filter(product => product.objectiveId === objective.id);
      
      let filtered;
      if (selectedType) {
        filtered = objectiveProducts.filter(product => product.type === selectedType);
      } else {
        filtered = objectiveProducts;
      }
      
      grouped[objective.id] = {
        objective: objective,
        products: filtered
      };
    });
    return grouped;
  };

  const generateCode = (objectiveCode, type) => {
    const objectiveProducts = products.filter(product => 
      product.objective?.code === objectiveCode && product.type === type
    );
    const nextNumber = objectiveProducts.length + 1;
    const prefix = type === 'PRODUCT' ? 'PROD' : 'SERV';
    const objCode = objectiveCode.split('-').slice(1).join('-'); // Remove OBJ- prefix
    return `${prefix}-${objCode}-${nextNumber.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    return type === 'PRODUCT' ? 'primary' : 'secondary';
  };

  const getTypeIcon = (type) => {
    return type === 'PRODUCT' ? '🏭' : '🛎️';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Cargando productos y servicios...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom display="flex" alignItems="center">
          <ProductIcon sx={{ mr: 2, color: 'primary.main' }} />
          Gestión de Productos y Servicios
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Administre los productos y servicios del Plan Operativo Anual
        </Typography>
      </Box>

      {/* Barra de herramientas */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Nuevo Producto/Servicio
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Controles */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Objetivo</InputLabel>
                <Select
                  value={selectedObjectiveId}
                  onChange={(e) => setSelectedObjectiveId(e.target.value)}
                  label="Filtrar por Objetivo"
                >
                  <MenuItem value="">Todos los objetivos</MenuItem>
                  {objectives.map((objective) => (
                    <MenuItem key={objective.id} value={objective.id}>
                      {objective.code} - {objective.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Tipo</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Filtrar por Tipo"
                >
                  <MenuItem value="">Todos los tipos</MenuItem>
                  <MenuItem value="PRODUCT">Productos</MenuItem>
                  <MenuItem value="SERVICE">Servicios</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={groupByObjective}
                    onChange={(e) => setGroupByObjective(e.target.checked)}
                  />
                }
                label="Agrupar por Objetivo"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1} alignItems="center">
                <Chip 
                  label={`🏭 ${products.filter(p => p.type === 'PRODUCT').length} Productos`} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  label={`🛎️ ${products.filter(p => p.type === 'SERVICE').length} Servicios`} 
                  color="secondary" 
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Productos */}
      {groupByObjective ? (
        // Vista agrupada por objetivo
        <Box>
          {Object.entries(getProductsByObjective()).map(([objectiveId, group]) => (
            <Accordion key={objectiveId} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  <Chip label={group.objective.code} color="primary" />
                  <Typography variant="h6">
                    {group.objective.name}
                  </Typography>
                  <Box display="flex" gap={1} sx={{ ml: 'auto' }}>
                    <Chip 
                      label={`🏭 ${group.products.filter(p => p.type === 'PRODUCT').length}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                    <Chip 
                      label={`🛎️ ${group.products.filter(p => p.type === 'SERVICE').length}`} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Actividades</TableCell>
                        <TableCell>Indicadores</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Chip label={product.code} size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {getTypeIcon(product.type)} {product.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {product.description}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={product.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                              size="small"
                              color={getTypeColor(product.type)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={product._count?.activities || 0} 
                              size="small" 
                              color="info"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={product._count?.indicators || 0} 
                              size="small" 
                              color="warning"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={() => handleOpenDialog(product)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(product.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {group.products.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <Typography color="textSecondary">
                              No hay productos/servicios definidos para este objetivo
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ) : (
        // Vista de tabla simple
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Objetivo</TableCell>
                <TableCell>Actividades</TableCell>
                <TableCell>Indicadores</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredProducts().map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Chip label={product.code} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {getTypeIcon(product.type)} {product.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300 }}>
                      {product.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={product.type === 'PRODUCT' ? 'Producto' : 'Servicio'}
                      size="small"
                      color={getTypeColor(product.type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${product.objective?.code} - ${product.objective?.name}`}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={product._count?.activities || 0} 
                      size="small" 
                      color="info"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={product._count?.indicators || 0} 
                      size="small" 
                      color="warning"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={() => handleOpenDialog(product)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(product.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {getFilteredProducts().length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">
                      No hay productos/servicios disponibles
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar producto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Editar Producto/Servicio' : 'Crear Nuevo Producto/Servicio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Ej: PROD-001-01-01"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="PRODUCT">🏭 Producto</MenuItem>
                  <MenuItem value="SERVICE">🛎️ Servicio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Objetivo Estratégico</InputLabel>
                <Select
                  value={formData.objectiveId}
                  onChange={(e) => {
                    const selectedObjective = objectives.find(obj => obj.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      objectiveId: e.target.value,
                      code: selectedObjective ? generateCode(selectedObjective.code, formData.type) : formData.code
                    });
                  }}
                  label="Objetivo Estratégico"
                >
                  {objectives.map((objective) => (
                    <MenuItem key={objective.id} value={objective.id}>
                      {objective.code} - {objective.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Orden"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.name || !formData.description || !formData.code || !formData.objectiveId}
          >
            {editingProduct ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear nuevo producto - Solo móviles */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductManagement;
