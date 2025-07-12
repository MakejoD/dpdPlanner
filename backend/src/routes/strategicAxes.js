const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/strategic-axes - Obtener todos los ejes estratégicos
router.get('/', auth, async (req, res) => {
  try {
    const { year, departmentId, includeObjectives = false } = req.query;

    let where = {};
    
    if (year) {
      where.year = parseInt(year);
    }
    
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const strategicAxes = await prisma.strategicAxis.findMany({
      where,
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        objectives: includeObjectives === 'true' ? {
          select: { 
            id: true, 
            name: true, 
            description: true,
            isActive: true 
          }
        } : false,
        indicators: {
          select: { 
            id: true, 
            name: true, 
            type: true,
            annualTarget: true 
          }
        },
        _count: {
          select: { 
            objectives: true,
            indicators: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { code: 'asc' }
      ]
    });

    res.json(strategicAxes);
  } catch (error) {
    console.error('Error al obtener ejes estratégicos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/strategic-axes/years - Obtener años disponibles
router.get('/years', auth, async (req, res) => {
  try {
    const years = await prisma.strategicAxis.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });

    res.json(years.map(item => item.year));
  } catch (error) {
    console.error('Error al obtener años:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/strategic-axes/:id - Obtener eje estratégico específico
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const strategicAxis = await prisma.strategicAxis.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        objectives: {
          include: {
            products: {
              select: { id: true, name: true, description: true }
            },
            indicators: {
              select: { id: true, name: true, type: true, measurementUnit: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        indicators: {
          select: { 
            id: true, 
            name: true, 
            type: true, 
            measurementUnit: true,
            baseline: true,
            annualTarget: true
          }
        }
      }
    });

    if (!strategicAxis) {
      return res.status(404).json({ message: 'Eje estratégico no encontrado' });
    }

    res.json(strategicAxis);
  } catch (error) {
    console.error('Error al obtener eje estratégico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// POST /api/strategic-axes - Crear nuevo eje estratégico
router.post('/', auth, authorize('create', 'strategicAxis'), async (req, res) => {
  try {
    const { name, description, code, year, departmentId } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del eje estratégico es requerido' });
    }

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: 'El código del eje estratégico es requerido' });
    }

    if (!year || year < 2020 || year > 2100) {
      return res.status(400).json({ message: 'El año debe estar entre 2020 y 2100' });
    }

    // Verificar que el código no esté duplicado para el mismo año
    const existingCode = await prisma.strategicAxis.findFirst({
      where: { 
        code: code.trim(),
        year: parseInt(year)
      }
    });
    if (existingCode) {
      return res.status(400).json({ 
        message: `Ya existe un eje estratégico con el código "${code}" para el año ${year}` 
      });
    }

    // Verificar que el departamento existe (si se especifica)
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      if (!department) {
        return res.status(400).json({ message: 'El departamento especificado no existe' });
      }
    }

    const strategicAxis = await prisma.strategicAxis.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        code: code.trim(),
        year: parseInt(year),
        departmentId: departmentId || null
      },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.status(201).json({
      message: 'Eje estratégico creado exitosamente',
      strategicAxis
    });
  } catch (error) {
    console.error('Error al crear eje estratégico:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Ya existe un eje estratégico con ese código para el año especificado' 
      });
    }
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/strategic-axes/:id - Actualizar eje estratégico
router.put('/:id', auth, authorize('update', 'strategicAxis'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, code, year, departmentId, isActive } = req.body;

    // Verificar que el eje estratégico existe
    const existingAxis = await prisma.strategicAxis.findUnique({
      where: { id }
    });
    if (!existingAxis) {
      return res.status(404).json({ message: 'Eje estratégico no encontrado' });
    }

    // Verificar si está bloqueado
    if (existingAxis.isLocked) {
      return res.status(400).json({ 
        message: 'No se puede modificar un eje estratégico bloqueado. Debe desbloquearlo primero.' 
      });
    }

    // Validaciones
    if (name && name.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del eje estratégico no puede estar vacío' });
    }

    if (code && code.trim().length === 0) {
      return res.status(400).json({ message: 'El código del eje estratégico no puede estar vacío' });
    }

    if (year && (year < 2020 || year > 2100)) {
      return res.status(400).json({ message: 'El año debe estar entre 2020 y 2100' });
    }

    // Verificar duplicados solo si cambiaron
    if ((code && code !== existingAxis.code) || (year && year !== existingAxis.year)) {
      const existingCode = await prisma.strategicAxis.findFirst({
        where: { 
          code: code?.trim() || existingAxis.code,
          year: parseInt(year) || existingAxis.year,
          id: { not: id }
        }
      });
      if (existingCode) {
        return res.status(400).json({ 
          message: `Ya existe un eje estratégico con el código "${code || existingAxis.code}" para el año ${year || existingAxis.year}` 
        });
      }
    }

    // Verificar que el departamento existe (si se especifica)
    if (departmentId && departmentId !== existingAxis.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      if (!department) {
        return res.status(400).json({ message: 'El departamento especificado no existe' });
      }
    }

    const strategicAxis = await prisma.strategicAxis.update({
      where: { id },
      data: {
        name: name?.trim() || existingAxis.name,
        description: description?.trim() || existingAxis.description,
        code: code?.trim() || existingAxis.code,
        year: parseInt(year) || existingAxis.year,
        departmentId: departmentId !== undefined ? departmentId : existingAxis.departmentId,
        isActive: isActive !== undefined ? isActive : existingAxis.isActive
      },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        },
        _count: {
          select: { 
            objectives: true,
            indicators: true
          }
        }
      }
    });

    res.json({
      message: 'Eje estratégico actualizado exitosamente',
      strategicAxis
    });
  } catch (error) {
    console.error('Error al actualizar eje estratégico:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Ya existe un eje estratégico con ese código para el año especificado' 
      });
    }
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// PUT /api/strategic-axes/:id/lock - Bloquear/Desbloquear eje estratégico
router.put('/:id/lock', auth, authorize('update', 'strategicAxis'), async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;

    const strategicAxis = await prisma.strategicAxis.findUnique({
      where: { id }
    });

    if (!strategicAxis) {
      return res.status(404).json({ message: 'Eje estratégico no encontrado' });
    }

    const updatedAxis = await prisma.strategicAxis.update({
      where: { id },
      data: { isLocked: isLocked === true },
      include: {
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    res.json({
      message: `Eje estratégico ${isLocked ? 'bloqueado' : 'desbloqueado'} exitosamente`,
      strategicAxis: updatedAxis
    });
  } catch (error) {
    console.error('Error al cambiar estado de bloqueo:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/strategic-axes/:id - Eliminar eje estratégico
router.delete('/:id', auth, authorize('delete', 'strategicAxis'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el eje estratégico existe
    const strategicAxis = await prisma.strategicAxis.findUnique({
      where: { id },
      include: {
        objectives: true,
        indicators: true
      }
    });

    if (!strategicAxis) {
      return res.status(404).json({ message: 'Eje estratégico no encontrado' });
    }

    // Verificar si está bloqueado
    if (strategicAxis.isLocked) {
      return res.status(400).json({ 
        message: 'No se puede eliminar un eje estratégico bloqueado' 
      });
    }

    // Verificar que no tenga dependencias
    if (strategicAxis.objectives.length > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el eje estratégico porque tiene ${strategicAxis.objectives.length} objetivo(s) asociado(s)` 
      });
    }

    if (strategicAxis.indicators.length > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el eje estratégico porque tiene ${strategicAxis.indicators.length} indicador(es) asociado(s)` 
      });
    }

    await prisma.strategicAxis.delete({
      where: { id }
    });

    res.json({ message: 'Eje estratégico eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar eje estratégico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
