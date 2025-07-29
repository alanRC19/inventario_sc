// backend/routes/movimientos.js
const express = require('express')
const router = express.Router()
const Movimiento = require('../models/movimiento')
const { authenticateToken } = require('../middleware/auth')

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken)

// GET /api/movimientos - Obtener historial de movimientos con paginación y filtros
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tipo, 
      articuloId, 
      fechaInicio, 
      fechaFin 
    } = req.query

    // Construir filtros
    const filtros = {}
    if (tipo) filtros.tipo = tipo
    if (articuloId) filtros.articuloId = articuloId
    
    if (fechaInicio || fechaFin) {
      filtros.fecha = {}
      if (fechaInicio) filtros.fecha.$gte = new Date(fechaInicio)
      if (fechaFin) filtros.fecha.$lte = new Date(fechaFin)
    }

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Obtener movimientos con paginación
    const movimientos = await Movimiento.find(filtros)
      .sort({ fecha: -1 }) // Más recientes primero
      .skip(skip)
      .limit(limitNum)
      .populate('articuloId', 'nombre')

    // Contar total para paginación
    const total = await Movimiento.countDocuments(filtros)
    const pages = Math.ceil(total / limitNum)

    res.json({
      data: movimientos,
      total,
      page: pageNum,
      pages
    })
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
})

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', async (req, res) => {
  try {
    const {
      tipo,
      articuloId,
      articuloNombre,
      cantidad,
      cantidadAnterior,
      cantidadNueva,
      usuario,
      descripcion,
      referencia
    } = req.body

    // Validaciones básicas
    if (!tipo || !articuloId || !articuloNombre || cantidad === undefined || 
        cantidadAnterior === undefined || cantidadNueva === undefined || !usuario) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos' 
      })
    }

    const nuevoMovimiento = new Movimiento({
      tipo,
      articuloId,
      articuloNombre,
      cantidad,
      cantidadAnterior,
      cantidadNueva,
      usuario,
      descripcion,
      referencia
    })

    await nuevoMovimiento.save()

    res.status(201).json({
      mensaje: 'Movimiento registrado exitosamente',
      movimiento: nuevoMovimiento
    })
  } catch (error) {
    console.error('Error al crear movimiento:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
})

// GET /api/movimientos/stats - Estadísticas de movimientos
router.get('/stats', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query
    
    const filtros = {}
    if (fechaInicio || fechaFin) {
      filtros.fecha = {}
      if (fechaInicio) filtros.fecha.$gte = new Date(fechaInicio)
      if (fechaFin) filtros.fecha.$lte = new Date(fechaFin)
    }

    const stats = await Movimiento.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: '$tipo',
          count: { $sum: 1 },
          totalCantidad: { $sum: { $abs: '$cantidad' } }
        }
      }
    ])

    res.json(stats)
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
})

module.exports = router
