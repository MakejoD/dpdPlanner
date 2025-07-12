const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validateLogin, handleValidationErrors } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token
 * @access  Public
 */
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email con rol y departamento
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        department: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Cuenta inactiva',
        message: 'Su cuenta ha sido desactivada. Contacte al administrador.'
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Preparar respuesta sin datos sensibles
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description
      },
      department: user.department ? {
        id: user.department.id,
        name: user.department.name,
        code: user.department.code
      } : null,
      permissions: user.role.rolePermissions.map(rp => ({
        action: rp.permission.action,
        resource: rp.permission.resource
      }))
    };

    logger.info(`Usuario autenticado: ${user.email}`);

    res.json({
      message: 'Autenticación exitosa',
      token,
      user: userResponse
    });

  } catch (error) {
    logger.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al procesar la autenticación'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Renovar token de acceso
 * @access  Private
 */
router.post('/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'Debe proporcionar un token para renovar'
      });
    }

    // Verificar token actual (incluso si está expirado)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name !== 'TokenExpiredError') {
        return res.status(403).json({
          error: 'Token inválido',
          message: 'El token proporcionado no es válido'
        });
      }
      // Si el token está expirado, decodificar sin verificar
      decoded = jwt.decode(token);
    }

    // Verificar que el usuario aún existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        department: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuario no válido',
        message: 'El usuario no existe o está inactivo'
      });
    }

    // Generar nuevo token
    const newToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        roleId: user.roleId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Token renovado exitosamente',
      token: newToken
    });

  } catch (error) {
    logger.error('Error en refresh token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al renovar el token'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar token del lado del cliente)
 * @access  Private
 */
router.post('/logout', (req, res) => {
  // En una implementación más robusta, aquí se podría mantener una blacklist de tokens
  res.json({
    message: 'Sesión cerrada exitosamente'
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token requerido',
        message: 'No se proporcionó token de autorización'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          department: true
        }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Usuario no válido',
          message: 'El usuario no existe o está inactivo'
        });
      }

      // Formatear permisos
      const permissions = user.role.rolePermissions.map(rp => ({
        id: rp.permission.id,
        name: rp.permission.name,
        action: rp.permission.action,
        resource: rp.permission.resource
      }));

      // Preparar respuesta sin contraseña
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description
        },
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code
        } : null,
        permissions
      };

      res.json(userData);

    } catch (jwtError) {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }

  } catch (error) {
    logger.error('Error en /me:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener información del usuario'
    });
  }
});

module.exports = router;
