const express = require("express")
const router = express.Router()
const { ObjectId } = require("mongodb")
const { getDB } = require("../db")
const Movimiento = require("../models/movimiento")
const { authenticateToken } = require("../middleware/auth")

// Aplicar middleware de autenticación a todas las rutas excepto GET (lectura)
// router.use(authenticateToken) // Comentado temporalmente para pruebas

// GET /api/articulos - Obtener artículos con paginación y filtros
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit
    const search = req.query.search || ""

    const collection = getDB().collection("articulos")

    // Construir filtro de búsqueda
    let filter = {}
    if (search) {
      // Busca en nombre, categoria y proveedor
      filter = {
        $or: [
          { nombre: { $regex: search, $options: "i" } },
          { categoria: { $regex: search, $options: "i" } },
          { proveedor: { $regex: search, $options: "i" } },
        ],
      }
    }

    const total = await collection.countDocuments(filter)
    const articulos = await collection.find(filter).skip(skip).limit(limit).toArray()

    res.json({
      data: articulos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error en GET /api/articulos:", error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/articulos - Crear nuevo artículo
router.post("/", async (req, res) => {
  try {
    const articulo = {
      ...req.body,
      stock: 0, // Los artículos nuevos siempre inician con stock 0
      proveedores: [], // Array de proveedores que han suministrado este artículo
      fechaCreacion: new Date(),
      ultimaActualizacion: new Date()
    }
    
    const result = await getDB().collection("articulos").insertOne(articulo)
    res.json({ insertedId: result.insertedId })
  } catch (error) {
    console.error("Error en POST /api/articulos:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/articulos/:id - Obtener artículo por ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB()
    const articulo = await db.collection("articulos").findOne({ _id: new ObjectId(req.params.id) })

    if (!articulo) {
      return res.status(404).json({ error: "Artículo no encontrado" })
    }

    res.json(articulo)
  } catch (error) {
    console.error("Error en GET /api/articulos/:id:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/articulos/:id/proveedores - Obtener proveedores de un artículo
router.get("/:id/proveedores", async (req, res) => {
  try {
    const db = getDB()
    const articulo = await db.collection("articulos").findOne({ _id: new ObjectId(req.params.id) })

    if (!articulo) {
      return res.status(404).json({ error: "Artículo no encontrado" })
    }

    // Obtener información completa de los proveedores
    const proveedoresIds = articulo.proveedores?.map(p => p.proveedorId) || []
    const proveedoresInfo = await db.collection("proveedores").find({ 
      _id: { $in: proveedoresIds } 
    }).toArray()

    // Combinar información del proveedor con datos del artículo
    const proveedoresDetalle = articulo.proveedores?.map(proveedorArticulo => {
      const proveedorInfo = proveedoresInfo.find(p => p._id.equals(proveedorArticulo.proveedorId))
      return {
        ...proveedorArticulo,
        nombre: proveedorInfo?.nombre || 'Proveedor no encontrado',
        contacto: proveedorInfo?.contacto,
        email: proveedorInfo?.email
      }
    }) || []

    res.json(proveedoresDetalle)
  } catch (error) {
    console.error("Error en GET /api/articulos/:id/proveedores:", error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/articulos/:id - Actualizar artículo
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id
    const data = req.body

    // Obtener el artículo actual antes de actualizar
    const articuloAnterior = await getDB()
      .collection("articulos")
      .findOne({ _id: new ObjectId(id) })

    if (!articuloAnterior) {
      return res.status(404).json({ error: "Artículo no encontrado" })
    }

    // Actualizar el artículo
    const result = await getDB()
      .collection("articulos")
      .updateOne({ _id: new ObjectId(id) }, { $set: data })

    // Si cambió el stock, registrar el movimiento
    if (data.stock !== undefined && data.stock !== articuloAnterior.stock) {
      const stockAnterior = articuloAnterior.stock
      const stockNuevo = data.stock
      const diferencia = stockNuevo - stockAnterior

      const movimiento = new Movimiento({
        tipo: 'ajuste',
        articuloId: id,
        articuloNombre: data.nombre || articuloAnterior.nombre,
        cantidad: diferencia, // Positivo o negativo según el ajuste
        cantidadAnterior: stockAnterior,
        cantidadNueva: stockNuevo,
        usuario: 'Administrador', // TODO: Obtener usuario del token
        descripcion: 'Ajuste de stock',
        referencia: null
      })

      await movimiento.save()
    }

    res.json({ modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error("Error en PUT /api/articulos:", error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/articulos/:id - Eliminar artículo
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id

    const result = await getDB()
      .collection("articulos")
      .deleteOne({ _id: new ObjectId(id) })
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    console.error("Error en DELETE /api/articulos:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
