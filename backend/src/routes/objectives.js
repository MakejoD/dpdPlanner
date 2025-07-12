const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/objectives - Obtener todos los objetivos con filtros
router.get('/', auth, async (req, res) => {
  try {
    const { 
      strategicAxisId, 
      year, 
      departmentId, 
      isActive, 
      search 
    } = req.query;

    let whereClause = {};

    // Filtro por eje estratégico
    if (strategicAxisId) {
      whereClause.strategicAxisId = strategicAxisId;
    }

    // Filtro por año (a través del eje estratégico)
    if (year) {
      whereClause.strategicAxis = {
        year: parseInt(year)
      };
    }

    // Filtro por departamento (a través del eje estratégico)
    if (departmentId) {
      whereClause.strategicAxis = {
        ...whereClause.strategicAxis,
        departmentId: departmentId
      };
    }

    // Filtro por estado activo
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Filtro por búsqueda en nombre y descripción
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        strategicAxis: {
          select: { 
            id: true, 
            name: true, 
            code: true, 
            year: true,
            department: {
              select: { id: true, name: true, code: true }
            }
          }
        },
        _count: {
          select: { 
            products: true,
            indicators: true
          }
        }
      },
      orderBy: [
        { strategicAxis: { year: 'desc' } },
        { strategicAxis: { code: 'asc' } },
        { code: 'asc' }
      ]
    });

    res.json(objectives);
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/objectives/by-strategic-axis/:strategicAxisId - Objetivos por eje estratégico
router.get('/by-strategic-axis/:strategicAxisId', auth, async (req, res) => {
  try {
    const { strategicAxisId } = req.params;

    const objectives = await prisma.objective.findMany({
      where: { strategicAxisId },
      include: {
        _count: {
          select: { 
            products: true,
            indicators: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });

    res.json(objectives);
  } catch (error) {
    console.error('Error al obtener objetivos por eje estratégico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// POST /api/objectives - Crear nuevo objetivo
router.post('/', auth, authorize('create', 'objective'), async (req, res) => {
  try {
    const { 
      name, 
      description, 
      code, 
      strategicAxisId
    } = req.body;

    // Validaciones
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'El nombre del objetivo es requerido' });
    }

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: 'El código del objetivo es requerido' });
    }

    if (!strategicAxisId) {
      return res.status(400).json({ message: 'El eje estratégico es requerido' });
    }

    // Verificar que el eje estratégico existe
    const strategicAxis = await prisma.strategicAxis.findUnique({
      where: { id: strategicAxisId }
    });
    if (!strategicAxis) {
      return res.status(400).json({ message: 'El eje estratégico especificado no existe' });
    }

    // Verificar que el código no esté duplicado para el mismo eje estratégico
    const existingCode = await prisma.objective.findFirst({
      where: { 
        code: code.trim(),
        strategicAxisId: strategicAxisId
      }
    });
    if (existingCode) {
      return res.status(400).json({ 
        message: `Ya existe un objetivo con el código "${code}" en este eje estratégico` 
      });
    }

    const objective = await prisma.objective.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        code: code.trim(),
        strategicAxisId: strategicAxisId
      },
      include: {
        strategicAxis: {
          select: { id: true, name: true, code: true, year: true }
        }
      }
    });

    res.status(201).json({
      message: 'Objetivo creado exitosamente',
      objective
    });
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Ya existe un objetivo con este código para el eje estratégico especificado' 
      });
    }
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/objectives/:id - Eliminar objetivo
router.delete('/:id', auth, authorize('delete', 'objective'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el objetivo existe
    const existingObjective = await prisma.objective.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            indicators: true
          }
        }
      }
    });

    if (!existingObjective) {
      return res.status(404).json({ message: 'Objetivo no encontrado' });
    }

    // Verificar si tiene productos o indicadores asociados
    if (existingObjective._count.products > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el objetivo porque tiene productos asociados' 
      });
    }

    if (existingObjective._count.indicators > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el objetivo porque tiene indicadores asociados' 
      });
    }

    await prisma.objective.delete({
      where: { id }
    });

    res.json({ message: 'Objetivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar objetivo:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
