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
  const ventasCollection = getDB().collection('ventas')
  const articulosCollection = getDB().collection('articulos')

  // Construir filtro de búsqueda
  let filter = {}
  if (search) {
    filter = {
      $or: [
        { nombre: { $regex: search, $options: 'i' } },
        { telefono: { $regex: search, $options: 'i' } },
        { direccion: { $regex: search, $options: 'i' } },
        { correo: { $regex: search, $options: 'i' } }
      ]
    }
  }

  const total = await collection.countDocuments(filter)
  const proveedores = await collection.find(filter).skip(skip).limit(limit).toArray()

  // Obtener todos los artículos para mapear id -> proveedor
  const articulos = await articulosCollection.find({}).toArray();
  const articuloIdToProveedor = {};
  for (const art of articulos) {
    if (art._id && art.proveedor) {
      articuloIdToProveedor[art._id.toString()] = art.proveedor;
    }
  }

  // Para cada proveedor, calcular compras (ventas de artículos de ese proveedor)
  const comprasPorProveedor = {};
  const ventas = await ventasCollection.find({}).toArray();
  for (const venta of ventas) {
    for (const prod of venta.productos || []) {
      const articuloIdStr = prod.articuloId ? prod.articuloId.toString() : '';
      const proveedor = articuloIdToProveedor[articuloIdStr];
      if (proveedor) {
        comprasPorProveedor[proveedor] = (comprasPorProveedor[proveedor] || 0) + prod.cantidad;
      }
    }
  }

  // Agregar compras al objeto proveedor
  const proveedoresConCompras = proveedores.map(p => ({
    ...p,
    compras: comprasPorProveedor[p.nombre] || 0
  }))

  res.json({
    data: proveedoresConCompras,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  })
})

// POST nuevo proveedor
router.post('/', async (req, res) => {
  const proveedor = req.body
  // Asegurar que los campos existan aunque sean vacíos
  proveedor.direccion = proveedor.direccion || '';
  proveedor.correo = proveedor.correo || '';
  proveedor.telefono = proveedor.telefono || '';
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