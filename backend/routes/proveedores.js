const express = require("express")
const router = express.Router()
const { ObjectId } = require("mongodb")
const { getDB } = require("../db")

// GET /api/proveedores - Obtener todos los proveedores
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit
    const search = req.query.search || ""

    const collection = getDB().collection("proveedores")

    // Construir filtro de búsqueda
    let filter = {}
    if (search) {
      // Busca en nombre y teléfono
      filter = {
        $or: [{ nombre: { $regex: search, $options: "i" } }, { telefono: { $regex: search, $options: "i" } }],
      }
    }

    const total = await collection.countDocuments(filter)
    const proveedores = await collection.find(filter).skip(skip).limit(limit).toArray()

    res.json({
      data: proveedores,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error en GET /api/proveedores:", error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/proveedores - Crear nuevo proveedor
router.post("/", async (req, res) => {
  try {
    const proveedor = req.body
    const result = await getDB().collection("proveedores").insertOne(proveedor)
    res.json({ insertedId: result.insertedId })
  } catch (error) {
    console.error("Error en POST /api/proveedores:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/proveedores/:id - Obtener proveedor por ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB()
    const proveedor = await db.collection("proveedores").findOne({ _id: new ObjectId(req.params.id) })

    if (!proveedor) {
      return res.status(404).json({ error: "Proveedor no encontrado" })
    }

    res.json(proveedor)
  } catch (error) {
    console.error("Error en GET /api/proveedores/:id:", error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/proveedores/:id - Actualizar proveedor
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id
    const data = req.body

    const result = await getDB()
      .collection("proveedores")
      .updateOne({ _id: new ObjectId(id) }, { $set: data })

    res.json({ modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error("Error en PUT /api/proveedores:", error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/proveedores/:id - Eliminar proveedor
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id

    const result = await getDB()
      .collection("proveedores")
      .deleteOne({ _id: new ObjectId(id) })
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    console.error("Error en DELETE /api/proveedores:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
