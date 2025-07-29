const express = require("express")
const router = express.Router()
const { ObjectId } = require("mongodb")
const { getDb } = require("../db")
const { enviarTicketVenta } = require("../services/whatsappService")
const Movimiento = require("../models/movimiento")

// GET /api/ventas - Obtener ventas con paginación y filtros
router.get("/", async (req, res) => {
  try {
    const db = getDb()
    const { page = 1, limit = 6, search = "", fechaInicio = "", fechaFin = "" } = req.query

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit)

    // Construir filtros
    const filtros = {}

    if (search) {
      filtros.cliente = { $regex: search, $options: "i" }
    }

    if (fechaInicio || fechaFin) {
      filtros.fecha = {}
      if (fechaInicio) filtros.fecha.$gte = new Date(fechaInicio)
      if (fechaFin) filtros.fecha.$lte = new Date(fechaFin + "T23:59:59.999Z")
    }

    const ventas = await db
      .collection("ventas")
      .find(filtros)
      .sort({ fecha: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))
      .toArray()

    const total = await db.collection("ventas").countDocuments(filtros)
    const totalPages = Math.ceil(total / Number.parseInt(limit))

    res.json({
      data: ventas,
      totalPages,
      total,
      currentPage: Number.parseInt(page),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/ventas - Crear nueva venta
router.post("/", async (req, res) => {
  try {
    const db = getDb()
    const { cliente, productos, total, metodoPago, telefono, enviarWhatsApp } = req.body

    const nuevaVenta = {
      cliente,
      productos,
      total,
      metodoPago,
      telefono: telefono || null,
      fecha: new Date(),
    }

    const resultado = await db.collection("ventas").insertOne(nuevaVenta)
    const ventaCreada = await db.collection("ventas").findOne({ _id: resultado.insertedId })

    let whatsappResult = null

    // Si se solicita envío por WhatsApp
    if (enviarWhatsApp && telefono) {
      whatsappResult = await enviarTicketVenta(ventaCreada, telefono)
    }

    // Actualizar stock de productos y registrar movimientos
    for (const producto of productos) {
      // Obtener información del artículo antes de actualizar
      const articulo = await db.collection("articulos").findOne({ _id: new ObjectId(producto.articuloId) })
      
      if (articulo) {
        const stockAnterior = articulo.stock
        const stockNuevo = stockAnterior - producto.cantidad
        
        // Actualizar stock
        await db
          .collection("articulos")
          .updateOne({ _id: new ObjectId(producto.articuloId) }, { $inc: { stock: -producto.cantidad } })
        
        // Registrar movimiento
        const movimiento = new Movimiento({
          tipo: 'venta',
          articuloId: producto.articuloId,
          articuloNombre: producto.nombre,
          cantidad: -producto.cantidad, // Negativo porque es una salida
          cantidadAnterior: stockAnterior,
          cantidadNueva: stockNuevo,
          usuario: 'Sistema', // TODO: Obtener usuario del token
          descripcion: `Venta a ${cliente}`,
          referencia: resultado.insertedId.toString()
        })
        
        await movimiento.save()
      }
    }

    res.json({
      success: true,
      venta: ventaCreada,
      whatsappEnviado: whatsappResult,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/ventas/:id - Obtener venta por ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDb()
    const venta = await db.collection("ventas").findOne({ _id: new ObjectId(req.params.id) })

    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" })
    }

    res.json(venta)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/ventas/:id/reenviar-whatsapp - Reenviar ticket por WhatsApp
router.post("/:id/reenviar-whatsapp", async (req, res) => {
  try {
    const db = getDb()
    const { telefono } = req.body

    if (!telefono) {
      return res.status(400).json({
        success: false,
        mensaje: "Teléfono es requerido",
      })
    }

    const venta = await db.collection("ventas").findOne({ _id: new ObjectId(req.params.id) })

    if (!venta) {
      return res.status(404).json({
        success: false,
        mensaje: "Venta no encontrada",
      })
    }

    const resultado = await enviarTicketVenta(venta, telefono)
    res.json(resultado)
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error al reenviar ticket",
      error: error.message,
    })
  }
})

// PUT /api/ventas/:id - Actualizar venta
router.put("/:id", async (req, res) => {
  try {
    const db = getDb()
    const { cliente, productos, total, metodoPago, telefono } = req.body

    const ventaActualizada = {
      cliente,
      productos,
      total,
      metodoPago,
      telefono: telefono || null,
      fechaActualizacion: new Date(),
    }

    await db.collection("ventas").updateOne({ _id: new ObjectId(req.params.id) }, { $set: ventaActualizada })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/ventas/:id - Eliminar venta
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb()
    
    // Primero obtener la venta para devolver el stock
    const venta = await db.collection("ventas").findOne({ _id: new ObjectId(req.params.id) })
    
    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" })
    }
    
    // Devolver stock de productos a inventario
    for (const producto of venta.productos) {
      await db
        .collection("articulos")
        .updateOne(
          { _id: new ObjectId(producto.articuloId) }, 
          { $inc: { stock: producto.cantidad } }
        )
    }
    
    // Eliminar la venta
    await db.collection("ventas").deleteOne({ _id: new ObjectId(req.params.id) })
    
    res.json({ 
      success: true, 
      mensaje: `Venta cancelada. Stock devuelto: ${venta.productos.map(p => `${p.cantidad}x ${p.nombre}`).join(', ')}`,
      montoDevuelto: venta.total
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/ventas/:id/cancelar - Cancelar venta específicamente con confirmación
router.post("/:id/cancelar", async (req, res) => {
  try {
    const db = getDb()
    
    // Obtener la venta
    const venta = await db.collection("ventas").findOne({ _id: new ObjectId(req.params.id) })
    
    if (!venta) {
      return res.status(404).json({ error: "Venta no encontrada" })
    }
    
    // Verificar que la venta no esté ya cancelada
    if (venta.estado === 'cancelada') {
      return res.status(400).json({ error: "La venta ya está cancelada" })
    }
    
    // Devolver stock de productos a inventario y registrar movimientos
    const productosDevueltos = []
    for (const producto of venta.productos) {
      // Obtener información del artículo antes de actualizar
      const articulo = await db.collection("articulos").findOne({ _id: new ObjectId(producto.articuloId) })
      
      if (articulo) {
        const stockAnterior = articulo.stock
        const stockNuevo = stockAnterior + producto.cantidad
        
        // Devolver stock
        const resultado = await db
          .collection("articulos")
          .updateOne(
            { _id: new ObjectId(producto.articuloId) }, 
            { $inc: { stock: producto.cantidad } }
          )
        
        if (resultado.modifiedCount > 0) {
          productosDevueltos.push({
            nombre: producto.nombre,
            cantidad: producto.cantidad,
            subtotal: producto.subtotal
          })
          
          // Registrar movimiento de devolución
          const movimiento = new Movimiento({
            tipo: 'devolucion',
            articuloId: producto.articuloId,
            articuloNombre: producto.nombre,
            cantidad: producto.cantidad, // Positivo porque es una entrada
            cantidadAnterior: stockAnterior,
            cantidadNueva: stockNuevo,
            usuario: 'Sistema', // TODO: Obtener usuario del token
            descripcion: `Devolución por cancelación de venta a ${venta.cliente}`,
            referencia: req.params.id
          })
          
          await movimiento.save()
        }
      }
    }
    
    // Marcar la venta como cancelada en lugar de eliminarla
    await db.collection("ventas").updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          estado: 'cancelada',
          fechaCancelacion: new Date(),
          motivoCancelacion: req.body.motivo || 'Cancelación administrativa'
        }
      }
    )
    
    res.json({ 
      success: true, 
      mensaje: "Venta cancelada exitosamente",
      productosDevueltos,
      montoDevuelto: venta.total,
      metodoPago: venta.metodoPago
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
