const axios = require('axios');

async function testProductsAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    // 1. Login
    console.log('🔐 Iniciando sesión...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@poa.gov',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login exitoso');
    
    // 2. Configurar headers con token
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 3. Obtener productos
    console.log('\n📦 Obteniendo productos...');
    const productsResponse = await axios.get(`${baseURL}/products`, { headers });
    
    console.log('📊 Respuesta completa:', JSON.stringify(productsResponse.data, null, 2));
    
    const products = productsResponse.data.data || productsResponse.data;
    console.log(`📊 Total productos encontrados: ${products ? products.length : 0}`);
    
    // 4. Mostrar resumen
    console.log('\n📋 Primeros 5 productos:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`${index + 1}. ${product.code} - ${product.name}`);
      console.log(`   Tipo: ${product.type}, Objetivo: ${product.objective?.code || 'N/A'}`);
      console.log(`   Estado: ${product.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('');
    });
    
    // 5. Estadísticas por tipo
    const productCount = products.filter(p => p.type === 'PRODUCT').length;
    const serviceCount = products.filter(p => p.type === 'SERVICE').length;
    
    console.log('📈 Estadísticas:');
    console.log(`   🏭 Productos: ${productCount}`);
    console.log(`   🛎️  Servicios: ${serviceCount}`);
    
    // 6. Probar filtros
    console.log('\n🔍 Probando filtros...');
    
    // Filtro por tipo
    const productsOnly = await axios.get(`${baseURL}/products?type=PRODUCT`, { headers });
    console.log(`   Solo productos: ${productsOnly.data.length || productsOnly.data.data?.length || 0}`);
    
    const servicesOnly = await axios.get(`${baseURL}/products?type=SERVICE`, { headers });
    console.log(`   Solo servicios: ${servicesOnly.data.length || servicesOnly.data.data?.length || 0}`);
    
    // Filtro por objetivo
    const firstObjective = products[0].objective?.code;
    if (firstObjective) {
      const byObjective = await axios.get(`${baseURL}/products?objectiveCode=${firstObjective}`, { headers });
      console.log(`   Por objetivo ${firstObjective}: ${byObjective.data.length || byObjective.data.data?.length || 0}`);
    }
    
    console.log('\n✅ Todas las pruebas de la API fueron exitosas!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
  }
}

testProductsAPI();
