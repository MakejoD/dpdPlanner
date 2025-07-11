const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  // Log del error
  logger.error('Error Handler:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Error de validación de Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Conflicto de datos',
      message: 'Ya existe un registro con estos datos únicos',
      field: error.meta?.target
    });
  }

  // Error de registro no encontrado de Prisma
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Recurso no encontrado',
      message: 'El registro solicitado no existe'
    });
  }

  // Error de validación de entrada
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: error.details
    });
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'El token de autenticación ha expirado'
    });
  }

  // Error de multer (archivos)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el tamaño máximo permitido'
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Demasiados archivos',
      message: 'Se ha excedido el número máximo de archivos permitidos'
    });
  }

  // Error de sintaxis JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El formato del JSON enviado no es válido'
    });
  }

  // Error personalizado con status
  if (error.status) {
    return res.status(error.status).json({
      error: error.name || 'Error',
      message: error.message
    });
  }

  // Error genérico del servidor
  return res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Ha ocurrido un error inesperado',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

module.exports = errorHandler;
