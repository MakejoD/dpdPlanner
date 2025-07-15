const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const departmentRoutes = require('./routes/departments');
const strategicAxisRoutes = require('./routes/strategicAxes');
const objectiveRoutes = require('./routes/objectives');
const productRoutes = require('./routes/products');
const activityRoutes = require('./routes/activities');
const indicatorRoutes = require('./routes/indicators');
const progressReportRoutes = require('./routes/progressReports');
const budgetExecutionRoutes = require('./routes/budgetExecution');
const approvalsRoutes = require('./routes/approvals');
const procurementRoutes = require('./routes/procurement');
const budgetRoutes = require('./routes/budget');
const correlationRoutes = require('./routes/correlation');
const activityProcurementLinksRoutes = require('./routes/activityProcurementLinks');
const paccRoutes = require('./routes/pacc');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intente nuevamente en un momento.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Demasiados intentos de login desde esta IP, intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/strategic-axes', strategicAxisRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/budget-execution', budgetExecutionRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/procurement-processes', procurementRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/correlation', correlationRoutes);
app.use('/api/activity-procurement-links', activityProcurementLinksRoutes);
app.use('/api/pacc', paccRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `No se pudo encontrar ${req.originalUrl} en este servidor`
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Servidor POA iniciado en puerto ${PORT}`);
  logger.info(`📊 Ambiente: ${process.env.NODE_ENV}`);
  logger.info(`🔗 API disponible en: http://localhost:${PORT}/api`);
});

module.exports = app;
