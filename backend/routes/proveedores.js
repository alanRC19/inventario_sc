const express = require('express')
const router = express.Router()
const { getDB } = require('../db')

// GET paginado y búsqueda global de proveedores
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 6
  const skip = (page - 1) * limit
  const search = req.query.search || ""

  const collection = getDB().collection('proveedores')

  // Construir filtro de búsqueda
  let filter = {}
  if (search) {
    // Busca en nombre
    filter = {
      $or: [
        { nombre: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } }
      ]
    }
  }

  const total = await collection.countDocuments(filter)
  const proveedores = await collection.find(filter).skip(skip).limit(limit).toArray()

  res.json({
    data: proveedores,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  })
})

// POST nuevo proveedor
router.post('/', async (req, res) => {
  const proveedor = req.body
  const result = await getDB().collection('proveedores').insertOne(proveedor)
  res.json({ insertedId: result.insertedId })
})

// PUT actualizar proveedor
router.put('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id
  const data = req.body

  const result = await getDB().collection('proveedores').updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  )

  res.json({ modifiedCount: result.modifiedCount })
})

// DELETE eliminar proveedor
router.delete('/:id', async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id

  const result = await getDB().collection('proveedores').deleteOne({ _id: new ObjectId(id) })
  res.json({ deletedCount: result.deletedCount })
})

module.exports = router