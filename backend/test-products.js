// test-products.js - Script para probar la API de productos
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Usuario de prueba
const testUser = {
  email: 'admin@poa.gov',
  password: 'admin123'
};

let authToken = null;

// Función para autenticar
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    // La API de auth aún usa el formato anterior
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✅ Autenticación exitosa');
      return true;
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error.response?.data || error.message);
    return false;
  }
}

// Función para hacer peticiones autenticadas
function createAuthenticatedRequest() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
}

// Probar obtener productos
async function testGetProducts() {
  console.log('\n🔍 Probando GET /products...');
  try {
    const api = createAuthenticatedRequest();
    const response = await api.get('/products');
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} productos encontrados`);
      console.log('📊 Estructura de respuesta:', {
        success: response.data.success,
        dataType: Array.isArray(response.data.data) ? 'array' : typeof response.data.data,
        message: response.data.message
      });
      
      if (response.data.data.length > 0) {
        const product = response.data.data[0];
        console.log('📝 Ejemplo de producto:', {
          id: product.id,
          name: product.name,
          code: product.code,
          type: product.type,
          objective: product.objective?.name
        });
      }
    } else {
      console.log('❌ Respuesta no exitosa:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar obtener productos por objetivo
async function testGetProductsByObjective() {
  console.log('\n🎯 Probando filtro por objetivo...');
  try {
    const api = createAuthenticatedRequest();
    
    // Primero obtener un objetivo
    const objectivesResponse = await api.get('/objectives');
    if (!objectivesResponse.data.success || objectivesResponse.data.data.length === 0) {
      console.log('❌ No hay objetivos para probar el filtro');
      return;
    }
    
    const objectiveId = objectivesResponse.data.data[0].id;
    console.log(`🔍 Probando filtro con objetivo: ${objectivesResponse.data.data[0].name}`);
    
    const response = await api.get(`/products?objectiveId=${objectiveId}`);
    
    if (response.data.success) {
      console.log(`✅ ${response.data.data.length} productos encontrados para el objetivo`);
    } else {
      console.log('❌ Error al filtrar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar crear producto
async function testCreateProduct() {
  console.log('\n➕ Probando POST /products...');
  try {
    const api = createAuthenticatedRequest();
    
    // Obtener un objetivo para asociar
    const objectivesResponse = await api.get('/objectives');
    if (!objectivesResponse.data.success || objectivesResponse.data.data.length === 0) {
      console.log('❌ No hay objetivos para crear un producto');
      return null;
    }
    
    const objectiveId = objectivesResponse.data.data[0].id;
    
    const newProduct = {
      name: 'Producto de Prueba API',
      description: 'Producto creado para probar la API',
      code: 'TEST-PROD-001',
      type: 'PRODUCT',
      objectiveId: objectiveId,
      order: 100
    };
    
    const response = await api.post('/products', newProduct);
    
    if (response.data.success) {
      console.log('✅ Producto creado exitosamente');
      console.log('📝 Producto creado:', response.data.data.name);
      return response.data.data.id;
    } else {
      console.log('❌ Error al crear:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return null;
  }
}

// Probar actualizar producto
async function testUpdateProduct(productId) {
  if (!productId) return;
  
  console.log('\n✏️ Probando PUT /products...');
  try {
    const api = createAuthenticatedRequest();
    
    const updateData = {
      name: 'Producto de Prueba API Actualizado',
      description: 'Producto actualizado para probar la API',
      code: 'TEST-PROD-001-UPD',
      type: 'SERVICE',
      objectiveId: (await api.get('/objectives')).data.data[0].id,
      order: 200
    };
    
    const response = await api.put(`/products/${productId}`, updateData);
    
    if (response.data.success) {
      console.log('✅ Producto actualizado exitosamente');
      console.log('📝 Producto actualizado:', response.data.data.name);
    } else {
      console.log('❌ Error al actualizar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Probar eliminar producto
async function testDeleteProduct(productId) {
  if (!productId) return;
  
  console.log('\n🗑️ Probando DELETE /products...');
  try {
    const api = createAuthenticatedRequest();
    const response = await api.delete(`/products/${productId}`);
    
    if (response.data.success) {
      console.log('✅ Producto eliminado exitosamente');
      console.log('📝 Producto eliminado:', response.data.data.name);
    } else {
      console.log('❌ Error al eliminar:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('🧪 Iniciando pruebas de API de Productos\n');
  
  // Autenticar
  const authenticated = await authenticate();
  if (!authenticated) {
    console.log('❌ No se pudo autenticar. Terminando pruebas.');
    return;
  }
  
  // Ejecutar pruebas
  await testGetProducts();
  await testGetProductsByObjective();
  
  // Pruebas CRUD
  const productId = await testCreateProduct();
  await testUpdateProduct(productId);
  await testDeleteProduct(productId);
  
  console.log('\n🎉 Pruebas de API de Productos completadas');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  authenticate,
  testGetProducts,
  testCreateProduct,
  testUpdateProduct,
  testDeleteProduct
};
