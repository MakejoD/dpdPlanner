/**
 * Middleware de autorización basado en permisos granulares
 * Verifica si el usuario tiene los permisos específicos para realizar una acción
 */

const authorize = (requiredAction, requiredResource) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debe estar autenticado para acceder a este recurso'
        });
      }

      // Verificar si el usuario tiene el permiso específico
      const hasPermission = req.permissions && req.permissions.some(permission => 
        permission.action === requiredAction && permission.resource === requiredResource
      );

      // Verificar si el usuario es administrador (tiene todos los permisos)
      const isAdmin = req.user.role && (req.user.role.name === 'ADMIN' || req.user.role.name === 'Administrador');

      if (!hasPermission && !isAdmin) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: `No tiene permisos para ${requiredAction} en ${requiredResource}`,
          required: {
            action: requiredAction,
            resource: requiredResource
          },
          userPermissions: req.permissions || []
        });
      }

      next();
    } catch (error) {
      console.error('Error en autorización:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al validar los permisos'
      });
    }
  };
};

/**
 * Middleware simplificado para verificar roles específicos
 */
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debe estar autenticado para acceder a este recurso'
        });
      }

      const userRole = req.user.role ? req.user.role.name : null;
      
      // Verificar si el rol del usuario está en la lista de roles permitidos
      if (!userRole || !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: `Su rol (${userRole || 'Sin rol'}) no tiene permisos para realizar esta acción`,
          allowedRoles,
          userRole
        });
      }

      next();
    } catch (error) {
      console.error('Error en autorización por rol:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al validar el rol'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario puede acceder a datos de un departamento específico
 */
const authorizeDepartment = (departmentId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debe estar autenticado para acceder a este recurso'
        });
      }

      // Los administradores pueden acceder a cualquier departamento
      const isAdmin = req.user.role && (req.user.role.name === 'ADMIN' || req.user.role.name === 'Administrador');
      
      // El usuario puede acceder a su propio departamento
      const canAccessDepartment = req.user.departmentId === departmentId;

      if (!isAdmin && !canAccessDepartment) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: 'No tiene permisos para acceder a datos de este departamento'
        });
      }

      next();
    } catch (error) {
      console.error('Error en autorización por departamento:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        message: 'Error al validar los permisos de departamento'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario puede acceder solo a sus propios datos
 */
const authorizeOwnData = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debe estar autenticado para acceder a este recurso'
      });
    }

    // Los administradores pueden acceder a cualquier dato
    const isAdmin = req.user.role && (req.user.role.name === 'ADMIN' || req.user.role.name === 'Administrador');
    
    // El usuario puede acceder solo a sus propios datos
    const isOwnData = req.params.userId === req.user.id;

    if (!isAdmin && !isOwnData) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puede acceder a sus propios datos'
      });
    }

    next();
  } catch (error) {
    console.error('Error en autorización de datos propios:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al validar los permisos de acceso'
    });
  }
};

module.exports = {
  authorize,
  authorizeDepartment,
  authorizeOwnData,
  authorizeRole
};
