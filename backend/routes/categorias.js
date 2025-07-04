const express = require('express')
const router = express.Router()
const { getDB } = require('../db')

// GET paginado y búsqueda global de categorias
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const skip = (page - 1) * limit
  const search = req.query.search || ""

  const collection = getDB().collection('categorias')

  // Construir filtro de búsqueda
  let filter = {}
  if (search) {
    // Busca en nombre
    filter = {
      $or: [
        { nombre: { $regex: search, $options: 'i' } }
      ]
    }
  }

  const total = await collection.countDocuments(filter)
  const categorias = await collection.find(filter).skip(skip).limit(limit).toArray()

  res.json({
    data: categorias,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  })
})

// POST nueva categoria
router.post('/', async (req, res) => {
  const categoria = req.body
  const result = await getDB().collection('categorias').insertOne(categoria)
  res.json({ insertedId: result.insertedId })
})

// PUT actualizar categoria
router.put('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id
  const data = req.body

  const result = await getDB().collection('categorias').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  )

  res.json({ modifiedCount: result.modifiedCount })
})

// DELETE eliminar categoria
router.delete('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id

  const result = await getDB().collection('categorias').deleteOne({ _id: new ObjectId(id) })
  res.json({ deletedCount: result.deletedCount })
})

module.exports = router