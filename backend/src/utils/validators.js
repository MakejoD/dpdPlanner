const { body, validationResult } = require('express-validator');

// Validaciones para autenticación
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Validaciones para registro/creación de usuario
const validateUser = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe proporcionar un email válido'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números'),
  body('roleId')
    .isUUID()
    .withMessage('Debe proporcionar un ID de rol válido'),
  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('El ID de departamento debe ser válido')
];

// Validaciones para roles
const validateRole = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre del rol debe tener entre 3 y 50 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres')
];

// Validaciones para departamentos
const validateDepartment = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre del departamento debe tener entre 3 y 100 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('El código debe tener entre 2 y 10 caracteres'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('El ID del departamento padre debe ser válido')
];

// Validaciones para ejes estratégicos
const validateStrategicAxis = [
  body('name')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El nombre del eje estratégico debe tener entre 5 y 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('El código debe tener entre 2 y 20 caracteres'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('El año debe estar entre 2020 y 2030'),
  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('El ID de departamento debe ser válido')
];

// Validaciones para objetivos
const validateObjective = [
  body('name')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El nombre del objetivo debe tener entre 5 y 200 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('El código debe tener entre 2 y 20 caracteres'),
  body('strategicAxisId')
    .isUUID()
    .withMessage('Debe proporcionar un ID de eje estratégico válido'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero positivo')
];

// Validaciones para indicadores
const validateIndicator = [
  body('name')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('El nombre del indicador debe tener entre 5 y 200 caracteres'),
  body('type')
    .isIn(['PRODUCT', 'RESULT'])
    .withMessage('El tipo debe ser PRODUCT o RESULT'),
  body('measurementUnit')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('La unidad de medida es requerida y no puede exceder 50 caracteres'),
  body('baseline')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La línea base debe ser un número positivo'),
  body('annualTarget')
    .isFloat({ min: 0 })
    .withMessage('La meta anual debe ser un número positivo'),
  body('q1Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q1 debe ser un número positivo'),
  body('q2Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q2 debe ser un número positivo'),
  body('q3Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q3 debe ser un número positivo'),
  body('q4Target')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La meta Q4 debe ser un número positivo')
];

// Validaciones para reportes de progreso
const validateProgressReport = [
  body('reportingPeriod')
    .isIn(['MONTHLY', 'QUARTERLY', 'ANNUAL'])
    .withMessage('El período debe ser MONTHLY, QUARTERLY o ANNUAL'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('El año debe estar entre 2020 y 2030'),
  body('quarter')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('El trimestre debe ser entre 1 y 4'),
  body('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes debe ser entre 1 y 12'),
  body('achievedValue')
    .isFloat({ min: 0 })
    .withMessage('El valor alcanzado debe ser un número positivo'),
  body('executionPercent')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje de ejecución debe estar entre 0 y 100'),
  body('qualitativeComment')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('El comentario cualitativo no puede exceder 2000 caracteres'),
  body('indicatorId')
    .isUUID()
    .withMessage('Debe proporcionar un ID de indicador válido')
];

// Validaciones para productos/servicios
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('El código debe tener entre 2 y 20 caracteres')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('El código solo puede contener letras mayúsculas, números y guiones'),
  body('type')
    .isIn(['PRODUCT', 'SERVICE'])
    .withMessage('El tipo debe ser PRODUCT o SERVICE'),
  body('objectiveId')
    .isUUID()
    .withMessage('objectiveId debe ser un UUID válido'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero no negativo'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser true o false')
];

// Validaciones para actividades
const validateActivity = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('El nombre debe tener entre 3 y 255 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('El código debe tener entre 2 y 30 caracteres')
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('El código solo puede contener letras mayúsculas, números, puntos y guiones'),
  body('productId')
    .isUUID()
    .withMessage('productId debe ser un UUID válido'),
  body('startDate')
    .isISO8601()
    .withMessage('startDate debe ser una fecha válida'),
  body('endDate')
    .isISO8601()
    .withMessage('endDate debe ser una fecha válida'),
  body('responsibleId')
    .optional()
    .isUUID()
    .withMessage('responsibleId debe ser un UUID válido'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El orden debe ser un número entero no negativo'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('La prioridad debe ser LOW, MEDIUM, HIGH o CRITICAL'),
  body('status')
    .optional()
    .isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('El estado debe ser NOT_STARTED, IN_PROGRESS, COMPLETED o CANCELLED'),
  body('budgetAllocated')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El presupuesto asignado debe ser un número positivo'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser true o false')
];

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      message: 'Los datos proporcionados no son válidos',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  validateLogin,
  validateUser,
  validateRole,
  validateDepartment,
  validateStrategicAxis,
  validateObjective,
  validateIndicator,
  validateProgressReport,
  validateProduct,
  validateActivity,
  handleValidationErrors
};
