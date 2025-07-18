const express = require("express")
const router = express.Router()
const { ObjectId } = require("mongodb")
const { getDB } = require("../db")

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
    const articulo = req.body
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

// PUT /api/articulos/:id - Actualizar artículo
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id
    const data = req.body

    const result = await getDB()
      .collection("articulos")
      .updateOne({ _id: new ObjectId(id) }, { $set: data })

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
