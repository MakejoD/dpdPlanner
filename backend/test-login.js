const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function testLogin() {
  const prisma = new PrismaClient();
  
  try {
    // Obtener el usuario admin
    const user = await prisma.user.findUnique({
      where: { email: 'admin@poa.gov' }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('👤 Usuario encontrado:', user.email);
    console.log('🔑 Hash almacenado:', user.password);
    
    // Probar la contraseña
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('🔐 Contraseña de prueba:', testPassword);
    console.log('✅ Contraseña válida:', isValid);
    
    if (!isValid) {
      // Crear nuevo hash para comparar
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('🆕 Nuevo hash generado:', newHash);
      
      // Intentar con hash más simple
      const simpleHash = await bcrypt.hash('admin123', 10);
      const simpleValid = await bcrypt.compare('admin123', user.password);
      console.log('🔍 Prueba con "admin123":', simpleValid);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
