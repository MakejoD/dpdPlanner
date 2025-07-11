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
      const hasPermission = req.permissions.some(permission => 
        permission.action === requiredAction && permission.resource === requiredResource
      );

      // Verificar si el usuario es administrador (tiene todos los permisos)
      const isAdmin = req.user.role.name === 'Administrador';

      if (!hasPermission && !isAdmin) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: `No tiene permisos para ${requiredAction} en ${requiredResource}`,
          required: {
            action: requiredAction,
            resource: requiredResource
          },
          userPermissions: req.permissions
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
 * Middleware para verificar si el usuario puede acceder a datos de un departamento específico
 */
const authorizeDepartment = (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const userRole = req.user.role.name;
    const userDepartmentId = req.user.departmentId;

    // Administrador y Director de Planificación tienen acceso total
    if (['Administrador', 'Director de Planificación'].includes(userRole)) {
      return next();
    }

    // Director de Área solo puede acceder a su propio departamento
    if (userRole === 'Director de Área' && userDepartmentId === departmentId) {
      return next();
    }

    // Técnico Registrador solo puede acceder a su propio departamento
    if (userRole === 'Técnico Registrador' && userDepartmentId === departmentId) {
      return next();
    }

    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tiene permisos para acceder a los datos de este departamento'
    });
  } catch (error) {
    console.error('Error en autorización de departamento:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al validar permisos de departamento'
    });
  }
};

/**
 * Middleware para verificar si el usuario puede acceder a sus propios datos o actividades asignadas
 */
const authorizeOwnData = (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role.name;

    // Administrador, Director de Planificación y Auditor tienen acceso total
    if (['Administrador', 'Director de Planificación', 'Auditor'].includes(userRole)) {
      return next();
    }

    // Director de Área puede acceder a usuarios de su departamento
    if (userRole === 'Director de Área') {
      // Esta verificación se haría consultando la base de datos
      // Por ahora permitimos el acceso y se verificará en el controlador
      return next();
    }

    // Técnico solo puede acceder a sus propios datos
    if (userRole === 'Técnico Registrador' && currentUserId === userId) {
      return next();
    }

    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'No tiene permisos para acceder a estos datos'
    });
  } catch (error) {
    console.error('Error en autorización de datos propios:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al validar permisos de acceso'
    });
  }
};

module.exports = {
  authorize,
  authorizeDepartment,
  authorizeOwnData
};
