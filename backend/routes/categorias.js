const express = require("express")
const router = express.Router()
const { ObjectId } = require("mongodb")
const { getDB } = require("../db")

// GET /api/categorias - Obtener todas las categorías
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 6
    const skip = (page - 1) * limit
    const search = req.query.search || ""

    const collection = getDB().collection("categorias")

    // Construir filtro de búsqueda
    let filter = {}
    if (search) {
      // Busca en nombre
      filter = {
        $or: [{ nombre: { $regex: search, $options: "i" } }],
      }
    }

    const total = await collection.countDocuments(filter)
    const categorias = await collection.find(filter).skip(skip).limit(limit).toArray()

    res.json({
      data: categorias,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error en GET /api/categorias:", error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/categorias - Crear nueva categoría
router.post("/", async (req, res) => {
  try {
    const categoria = req.body
    const result = await getDB().collection("categorias").insertOne(categoria)
    res.json({ insertedId: result.insertedId })
  } catch (error) {
    console.error("Error en POST /api/categorias:", error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/categorias/:id - Obtener categoría por ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB()
    const categoria = await db.collection("categorias").findOne({ _id: new ObjectId(req.params.id) })

    if (!categoria) {
      return res.status(404).json({ error: "Categoría no encontrada" })
    }

    res.json(categoria)
  } catch (error) {
    console.error("Error en GET /api/categorias/:id:", error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/categorias/:id - Actualizar categoría
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id
    const data = req.body

    const result = await getDB()
      .collection("categorias")
      .updateOne({ _id: new ObjectId(id) }, { $set: data })

    res.json({ modifiedCount: result.modifiedCount })
  } catch (error) {
    console.error("Error en PUT /api/categorias:", error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/categorias/:id - Eliminar categoría
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id

    const result = await getDB()
      .collection("categorias")
      .deleteOne({ _id: new ObjectId(id) })
    res.json({ deletedCount: result.deletedCount })
  } catch (error) {
    console.error("Error en DELETE /api/categorias:", error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
