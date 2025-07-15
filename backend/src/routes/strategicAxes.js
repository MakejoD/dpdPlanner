const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/strategic-axes - Obtener todos los ejes estratégicos
router.get('/', auth, async (req, res) => {
  try {
    const strategicAxes = await prisma.strategicAxis.findMany({
      orderBy: {
        createdAt: 'desc'
      }
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

// POST /api/strategic-axes - Crear un nuevo eje estratégico
router.post('/', auth, authorize('create', 'strategic_axis'), async (req, res) => {
  try {
    const { name, description, code, year } = req.body;

    if (!name || !code || !year) {
      return res.status(400).json({
        message: 'El nombre, código y año son obligatorios'
      });
    }

    const strategicAxis = await prisma.strategicAxis.create({
      data: {
        name,
        description,
        code,
        year: parseInt(year)
      }
    });

    res.status(201).json(strategicAxis);
  } catch (error) {
    console.error('Error al crear eje estratégico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// GET /api/strategic-axes/:id - Obtener un eje estratégico específico
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const strategicAxis = await prisma.strategicAxis.findUnique({
      where: { id: id },
      include: {
        objectives: true
      }
    });

    if (!strategicAxis) {
      return res.status(404).json({
        message: 'Eje estratégico no encontrado'
      });
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

// PUT /api/strategic-axes/:id - Actualizar un eje estratégico
router.put('/:id', auth, authorize('update', 'strategic_axis'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, year } = req.body;

    const strategicAxis = await prisma.strategicAxis.update({
      where: { id: id },
      data: {
        name,
        description,
        year: year ? parseInt(year) : undefined
      }
    });

    res.json(strategicAxis);
  } catch (error) {
    console.error('Error al actualizar eje estratégico:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// DELETE /api/strategic-axes/:id - Eliminar un eje estratégico
router.delete('/:id', auth, authorize('delete', 'strategic_axis'), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.strategicAxis.delete({
      where: { id: id }
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
