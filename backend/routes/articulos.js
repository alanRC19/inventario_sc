const express = require('express')
const router = express.Router()
const { getDB } = require('../db')

// GET paginado y búsqueda global de articulos
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const skip = (page - 1) * limit
  const search = req.query.search || ""

  const collection = getDB().collection('articulos')

  // Construir filtro de búsqueda
  let filter = {}
  if (search) {
    // Busca en nombre, categoria y proveedor (puedes agregar más campos)
    filter = {
      $or: [
        { nombre: { $regex: search, $options: 'i' } },
        { categoria: { $regex: search, $options: 'i' } },
        { proveedor: { $regex: search, $options: 'i' } }
      ]
    }
  }

  const total = await collection.countDocuments(filter)
  const articulos = await collection.find(filter).skip(skip).limit(limit).toArray()

  res.json({
    data: articulos,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  })
})

// POST nuevo articulo
router.post('/', async (req, res) => {
  const articulo = req.body
  const result = await getDB().collection('articulos').insertOne(articulo)
  res.json({ insertedId: result.insertedId })
})

// PUT actualizar articulo
router.put('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id
  const data = req.body

  const result = await getDB().collection('articulos').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  )

  res.json({ modifiedCount: result.modifiedCount })
})

// DELETE eliminar articulo
router.delete('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id

  const result = await getDB().collection('articulos').deleteOne({ _id: new ObjectId(id) })
  res.json({ deletedCount: result.deletedCount })
})

module.exports = router
