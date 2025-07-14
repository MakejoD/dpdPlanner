import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  PictureAsPdf,
  TableChart,
  Description,
  Download,
  Business,
  AccountTree,
  DateRange,
  Assessment,
  AttachMoney,
  Preview,
  Refresh
} from '@mui/icons-material'
import httpClient from '../../utils/api'

const Reports = () => {
  // Estados principales
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState(null)

  // Estados del formulario
  const [formData, setFormData] = useState({
    type: 'institutional', // 'institutional' | 'departmental'
    departmentId: '',
    year: '2025',
    format: 'pdf', // 'pdf' | 'excel' | 'word'
    includeIndicators: true,
    includeBudget: true,
    includeResponsibles: true,
    period: 'annual' // 'annual' | 'quarterly'
  })

  // Cargar departamentos al inicializar
  useEffect(() => {
    // Solo cargar si hay token
    const token = localStorage.getItem('token');
    if (token) {
      loadDepartments();
    } else {
      console.log('⚠️ No hay token disponible para cargar departamentos');
    }
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      console.log('🔄 Cargando departamentos...')
      const response = await httpClient.get('/departments')
      console.log('📥 Respuesta recibida:', response)
      if (response.data.success) {
        console.log('✅ Departamentos cargados:', response.data.data)
        setDepartments(response.data.data)
      } else {
        console.log('❌ Error en respuesta:', response.data)
      }
    } catch (error) {
      console.error('❌ Error cargando departamentos:', error)
      // Intentar recargar una vez si hay error de autenticación
      if (error.message.includes('401') || error.message.includes('token')) {
        console.log('🔄 Reintentando carga de departamentos...');
        setTimeout(() => {
          const token = localStorage.getItem('token');
          if (token) {
            loadDepartments();
          }
        }, 1000);
      }
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambios en el formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Si cambia a institucional, limpiar departamento
    if (field === 'type' && value === 'institutional') {
      setFormData(prev => ({
        ...prev,
        departmentId: ''
      }))
    }
  }

  // Generar vista previa
  const generatePreview = async () => {
    try {
      setLoading(true)
      const response = await httpClient.post('/reports/poa-preview', formData)
      if (response.data.success) {
        setPreview(response.data.data)
      }
    } catch (error) {
      console.error('Error generando vista previa:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generar y descargar documento
  const generateDocument = async () => {
    try {
      setGenerating(true)
      
      console.log('📤 Enviando datos para generación:', formData)
      
      const response = await httpClient.post('/reports/generate-poa', formData, {
        responseType: 'blob'
      })

      console.log('📥 Respuesta recibida:', {
        size: response.data.size,
        type: response.data.type,
        headers: response.headers
      })

      // Verificar que la respuesta sea válida
      if (!response.data || response.data.size === 0) {
        throw new Error('Respuesta vacía del servidor')
      }

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      
      // Nombre del archivo basado en tipo y formato
      const fileExtension = formData.format === 'excel' ? 'xlsx' : formData.format
      const fileName = `POA_${formData.type === 'institutional' ? 'Institucional' : 'Departamental'}_${formData.year}.${fileExtension}`
      
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      console.log('✅ Descarga iniciada:', fileName)

    } catch (error) {
      console.error('❌ Error generando documento:', error)
      
      // Mostrar error más detallado
      if (error.response) {
        console.error('Status:', error.response.status)
        console.error('Headers:', error.response.headers)
        if (error.response.data instanceof Blob) {
          // Si es un blob, intentar leer como texto para ver el error
          const reader = new FileReader()
          reader.onload = () => {
            console.error('Error del servidor:', reader.result)
          }
          reader.readAsText(error.response.data)
        } else {
          console.error('Data:', error.response.data)
        }
      }
      
      // Mostrar mensaje al usuario
      alert('Error generando documento: ' + (error.message || 'Error desconocido'))
      
    } finally {
      setGenerating(false)
    }
  }

  // Opciones de formato con iconos
  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: <PictureAsPdf />, color: 'error' },
    { value: 'excel', label: 'Excel', icon: <TableChart />, color: 'success' },
    { value: 'word', label: 'Word', icon: <Description />, color: 'primary' }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Description color="primary" />
        Generación de Documentos POA
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Genere documentos POA oficiales en formato PDF, Excel o Word. 
          Puede crear el POA institucional completo o documentos específicos por área/departamento.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Panel de Configuración */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business />
                Configuración del Documento
              </Typography>

              {/* Debug info visible */}
              <Alert severity="info" sx={{ mb: 2 }}>
                Debug: {departments.length} departamentos cargados | Estado: {loading ? 'Cargando...' : 'Listo'}
                {departments.length === 0 && !loading && (
                  <Button 
                    size="small" 
                    onClick={loadDepartments} 
                    sx={{ ml: 2 }}
                    startIcon={<Refresh />}
                  >
                    Recargar
                  </Button>
                )}
              </Alert>

              <Grid container spacing={2}>
                {/* Tipo de POA */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de POA</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      label="Tipo de POA"
                    >
                      <MenuItem value="institutional">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountTree />
                          POA Institucional Completo
                        </Box>
                      </MenuItem>
                      <MenuItem value="departmental">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business />
                          POA por Área/Departamento
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Departamento (solo si es departamental) */}
                {formData.type === 'departmental' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Departamento</InputLabel>
                      <Select
                        value={formData.departmentId}
                        onChange={(e) => handleFormChange('departmentId', e.target.value)}
                        label="Departamento"
                      >
                        {departments.length === 0 ? (
                          <MenuItem disabled>
                            {loading ? 'Cargando departamentos...' : 'No hay departamentos disponibles'}
                          </MenuItem>
                        ) : (
                          departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                    {/* Debug info */}
                    <Typography variant="caption" color="textSecondary">
                      Debug: {departments.length} departamentos cargados
                    </Typography>
                  </Grid>
                )}

                {/* Año */}
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Año</InputLabel>
                    <Select
                      value={formData.year}
                      onChange={(e) => handleFormChange('year', e.target.value)}
                      label="Año"
                    >
                      {['2024', '2025', '2026'].map((year) => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Período */}
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={formData.period}
                      onChange={(e) => handleFormChange('period', e.target.value)}
                      label="Período"
                    >
                      <MenuItem value="annual">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DateRange />
                          Anual Completo
                        </Box>
                      </MenuItem>
                      <MenuItem value="quarterly">Trimestral</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Formato de salida */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Formato de Documento</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {formatOptions.map((option) => (
                      <Chip
                        key={option.value}
                        icon={option.icon}
                        label={option.label}
                        color={formData.format === option.value ? option.color : 'default'}
                        variant={formData.format === option.value ? 'filled' : 'outlined'}
                        onClick={() => handleFormChange('format', option.value)}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Contenido a Incluir</Typography>
                </Grid>

                {/* Opciones de contenido */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeIndicators}
                        onChange={(e) => handleFormChange('includeIndicators', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assessment />
                        Incluir Indicadores y Metas
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeBudget}
                        onChange={(e) => handleFormChange('includeBudget', e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoney />
                        Incluir Información Presupuestaria
                      </Box>
                    }
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.includeResponsibles}
                        onChange={(e) => handleFormChange('includeResponsibles', e.target.checked)}
                      />
                    }
                    label="Incluir Responsables y Asignaciones"
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={generatePreview}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Preview />}
                  fullWidth
                >
                  Vista Previa
                </Button>
                
                <Button
                  variant="contained"
                  onClick={generateDocument}
                  disabled={generating || (formData.type === 'departmental' && !formData.departmentId)}
                  startIcon={generating ? <CircularProgress size={20} /> : <Download />}
                  fullWidth
                >
                  {generating ? 'Generando...' : 'Generar y Descargar'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel de Vista Previa */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Preview />
                Vista Previa del Documento
                <Tooltip title="Actualizar vista previa">
                  <IconButton size="small" onClick={generatePreview}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Typography>

              {preview ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Documento preparado: {preview.totalEjes} ejes, {preview.totalObjetivos} objetivos, 
                    {preview.totalActividades} actividades
                  </Alert>

                  <List dense>
                    <ListItem>
                      <ListItemIcon><AccountTree /></ListItemIcon>
                      <ListItemText 
                        primary="Estructura POA"
                        secondary={`${preview.totalEjes} Ejes Estratégicos con ${preview.totalObjetivos} Objetivos`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon><Assessment /></ListItemIcon>
                      <ListItemText 
                        primary="Actividades e Indicadores"
                        secondary={`${preview.totalActividades} Actividades con ${preview.totalIndicadores || 0} Indicadores`}
                      />
                    </ListItem>

                    {formData.includeBudget && (
                      <ListItem>
                        <ListItemIcon><AttachMoney /></ListItemIcon>
                        <ListItemText 
                          primary="Presupuesto Total"
                          secondary={`$${preview.presupuestoTotal?.toLocaleString() || '0'}`}
                        />
                      </ListItem>
                    )}

                    <ListItem>
                      <ListItemIcon><Business /></ListItemIcon>
                      <ListItemText 
                        primary="Departamentos Incluidos"
                        secondary={preview.departamentos?.join(', ') || 'Todos'}
                      />
                    </ListItem>
                  </List>

                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Páginas estimadas: {preview.paginasEstimadas || 'Calculando...'}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Haga clic en "Vista Previa" para ver el resumen del documento que se generará
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Panel de Información */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información de Formatos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PictureAsPdf color="error" />
                    <Typography variant="subtitle2">PDF</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Ideal para presentaciones oficiales, archivo y distribución. 
                    Formato estándar gubernamental con logos institucionales.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TableChart color="success" />
                    <Typography variant="subtitle2">Excel</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Perfecto para análisis financiero, seguimiento de metas y 
                    manipulación de datos. Incluye fórmulas automáticas.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Description color="primary" />
                    <Typography variant="subtitle2">Word</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Permite edición adicional, comentarios y personalización 
                    del contenido antes de la versión final.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Reports
