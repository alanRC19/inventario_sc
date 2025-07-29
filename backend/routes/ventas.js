const express = require('express')
const router = express.Router()
const { getDB } = require('../db')
const usuariosRouter = require('./usuarios')
const { requireAuth, requireAdmin } = usuariosRouter

// Función para calcular el estado del stock
function calculateStockStatus(stock) {
  if (stock === 0) {
    return 'fuera de stock'
  } else if (stock < 5) {
    return 'stock bajo'
  } else {
    return 'disponible'
  }
}

// GET paginado y búsqueda de ventas
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const skip = (page - 1) * limit
  const search = req.query.search || ""
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""

  const collection = getDB().collection('ventas')

  // Construir filtro de búsqueda
  let filter = {}
  
  // Filtro de texto
  if (search) {
    filter.$or = [
      { cliente: { $regex: search, $options: 'i' } },
      { 'productos.nombre': { $regex: search, $options: 'i' } }
    ]
  }

  // Filtro de fechas
  if (fechaInicio || fechaFin) {
    filter.fecha = {}
    
    if (fechaInicio) {
      filter.fecha.$gte = new Date(fechaInicio + 'T00:00:00.000Z')
    }
    
    if (fechaFin) {
      filter.fecha.$lte = new Date(fechaFin + 'T23:59:59.999Z')
    }
  }

  const total = await collection.countDocuments(filter)
  const ventas = await collection.find(filter).skip(skip).limit(limit).sort({ fecha: -1 }).toArray()
  
  // Calcular el total vendido (suma de todos los totales de ventas COMPLETADAS que cumplen el filtro)
  const filterParaTotal = { ...filter, estado: { $ne: 'cancelada' } }
  const totalVendidoAgg = await collection.aggregate([
    { $match: filterParaTotal },
    { $group: { _id: null, totalVendido: { $sum: "$total" } } }
  ]).toArray();
  const totalVendido = totalVendidoAgg[0]?.totalVendido || 0;

  res.json({
    data: ventas,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    totalVendido
  })
})

// GET venta por ID
router.get('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const collection = getDB().collection('ventas')
  
  try {
    const venta = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }
    res.json(venta)
  } catch (error) {
    res.status(400).json({ error: 'ID inválido' })
  }
})

// POST crear nueva venta
router.post('/', async (req, res) => {
  const { cliente, productos, total, metodoPago, telefono } = req.body
  
  if (!cliente || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Cliente y productos son requeridos' })
  }

  const venta = {
    cliente,
    productos,
    total: parseFloat(total),
    metodoPago: metodoPago || 'efectivo',
    telefono: telefono || null, // Campo opcional para WhatsApp
    fecha: new Date(),
    estado: 'completada'
  }

  const collection = getDB().collection('ventas')
  const result = await collection.insertOne(venta)

  // Actualizar stock de productos
  const articulosCollection = getDB().collection('articulos')
  for (const producto of productos) {
    // Obtener el artículo actual para calcular el nuevo stock
    const articulo = await articulosCollection.findOne({ _id: new (require('mongodb').ObjectId)(producto.articuloId) })
    if (articulo) {
      const nuevoStock = articulo.stock - producto.cantidad
      const nuevoEstado = calculateStockStatus(nuevoStock)
      
      await articulosCollection.updateOne(
        { _id: new (require('mongodb').ObjectId)(producto.articuloId) },
        { 
          $inc: { stock: -producto.cantidad },
          $set: { estado: nuevoEstado }
        }
      )
    }
  }

  res.status(201).json({ ...venta, _id: result.insertedId })
})

// PUT actualizar venta
router.put('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const collection = getDB().collection('ventas')
  const { cliente, productos, total, metodoPago } = req.body
  
  try {
    // Obtener la venta original
    const ventaOriginal = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!ventaOriginal) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }
    
    // Verificar si la venta está cancelada
    if (ventaOriginal.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede editar una venta cancelada' })
    }

    // Restaurar stock de productos originales
    const articulosCollection = getDB().collection('articulos')
    for (const producto of ventaOriginal.productos) {
      const articulo = await articulosCollection.findOne({ _id: new ObjectId(producto.articuloId) })
      if (articulo) {
        const nuevoStock = articulo.stock + producto.cantidad
        const nuevoEstado = calculateStockStatus(nuevoStock)
        
        await articulosCollection.updateOne(
          { _id: new ObjectId(producto.articuloId) },
          { 
            $inc: { stock: producto.cantidad },
            $set: { estado: nuevoEstado }
          }
        )
      }
    }

    // Actualizar la venta con los nuevos datos
    const ventaActualizada = {
      cliente,
      productos,
      total: parseFloat(total),
      metodoPago: metodoPago || 'efectivo',
      fecha: ventaOriginal.fecha, // Mantener la fecha original
      estado: 'completada'
    }

    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: ventaActualizada }
    )

    // Actualizar stock con los nuevos productos
    for (const producto of productos) {
      const articulo = await articulosCollection.findOne({ _id: new ObjectId(producto.articuloId) })
      if (articulo) {
        const nuevoStock = articulo.stock - producto.cantidad
        const nuevoEstado = calculateStockStatus(nuevoStock)
        
        await articulosCollection.updateOne(
          { _id: new ObjectId(producto.articuloId) },
          { 
            $inc: { stock: -producto.cantidad },
            $set: { estado: nuevoEstado }
          }
        )
      }
    }

    res.json({ message: 'Venta actualizada correctamente' })
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la venta' })
  }
})

// DELETE eliminar venta - solo administradores
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { ObjectId } = require('mongodb')
  const collection = getDB().collection('ventas')
  
  try {
    const venta = await collection.findOne({ _id: new ObjectId(req.params.id) })
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }
    
    // Verificar si la venta está cancelada
    if (venta.estado === 'cancelada') {
      return res.status(400).json({ error: 'No se puede eliminar una venta cancelada' })
    }

    // Restaurar stock de productos
    const articulosCollection = getDB().collection('articulos')
    for (const producto of venta.productos) {
      // Obtener el artículo actual para calcular el nuevo stock
      const articulo = await articulosCollection.findOne({ _id: new ObjectId(producto.articuloId) })
      if (articulo) {
        const nuevoStock = articulo.stock + producto.cantidad
        const nuevoEstado = calculateStockStatus(nuevoStock)
        
        await articulosCollection.updateOne(
          { _id: new ObjectId(producto.articuloId) },
          { 
            $inc: { stock: producto.cantidad },
            $set: { estado: nuevoEstado }
          }
        )
      }
    }

    await collection.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ message: 'Venta eliminada correctamente' })
  } catch (error) {
    res.status(400).json({ error: 'ID inválido' })
  }
})

// PATCH /:id/cancelar - Cancelar una venta - solo administradores
router.patch('/:id/cancelar', requireAuth, requireAdmin, async (req, res) => {
  const { ObjectId } = require('mongodb')
  
  try {
    const collection = getDB().collection('ventas')
    const venta = await collection.findOne({ _id: new ObjectId(req.params.id) })
    
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }
    
    if (venta.estado === 'cancelada') {
      return res.status(400).json({ error: 'La venta ya está cancelada' })
    }

    // Restaurar stock de productos
    const articulosCollection = getDB().collection('articulos')
    for (const producto of venta.productos) {
      // Obtener el artículo actual para calcular el nuevo stock
      const articulo = await articulosCollection.findOne({ _id: new ObjectId(producto.articuloId) })
      if (articulo) {
        const nuevoStock = articulo.stock + producto.cantidad
        const nuevoEstado = calculateStockStatus(nuevoStock)
        
        await articulosCollection.updateOne(
          { _id: new ObjectId(producto.articuloId) },
          { 
            $inc: { stock: producto.cantidad },
            $set: { estado: nuevoEstado }
          }
        )
        
        // Registrar movimiento de cancelación
        await getDB().collection('movimientos_inventario').insertOne({
          articuloId: new ObjectId(producto.articuloId),
          tipo: 'cancelacion',
          cantidad: producto.cantidad,
          stockAntes: articulo.stock,
          stockDespues: nuevoStock,
          fecha: new Date(),
          motivo: `Cancelación de venta - Cliente: ${venta.cliente}`,
          referencia: req.params.id
        })
      }
    }

    // Actualizar estado de la venta a cancelada
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          estado: 'cancelada',
          fechaCancelacion: new Date()
        }
      }
    )
    
    res.json({ message: 'Venta cancelada correctamente' })
  } catch (error) {
    console.error('Error al cancelar venta:', error)
    res.status(400).json({ error: 'ID inválido' })
  }
})

module.exports = router 