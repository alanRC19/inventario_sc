const express = require('express')
const router = express.Router()
const { ObjectId } = require('mongodb')
const { getDB } = require('../db')
const requireAuth = require('./usuarios').requireAuth;

// Helper para registrar movimiento
async function registrarMovimiento({ db, articuloId, tipo, cantidad, stockAntes, stockDespues, usuarioId, usuarioNombre, motivo }) {
  await db.collection('movimientos_inventario').insertOne({
    articuloId,
    tipo,
    cantidad,
    stockAntes,
    stockDespues,
    usuarioId,
    usuarioNombre,
    motivo,
    fecha: new Date()
  });
}

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
    // Busca en nombre, categoria y proveedor
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
router.post('/', requireAuth, async (req, res) => {
  const articulo = req.body;
  const db = getDB();
  const result = await db.collection('articulos').insertOne(articulo);
  // Registrar movimiento de creación
  await registrarMovimiento({
    db,
    articuloId: result.insertedId,
    tipo: 'creacion',
    cantidad: articulo.stock,
    stockAntes: 0,
    stockDespues: articulo.stock,
    usuarioId: req.user?._id,
    usuarioNombre: req.user?.nombre,
    motivo: 'Creación de artículo'
  });
  res.json({ insertedId: result.insertedId });
})

// PUT actualizar articulo
router.put('/:id', requireAuth, async (req, res) => {
  const { ObjectId } = require('mongodb');
  const id = req.params.id;
  const data = req.body;
  const db = getDB();
  const articulosCol = db.collection('articulos');
  const articuloAntes = await articulosCol.findOne({ _id: new ObjectId(id) });
  const result = await articulosCol.updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  );
  // Registrar movimiento de ajuste si cambia el stock
  if (data.stock !== undefined && articuloAntes && data.stock !== articuloAntes.stock) {
    await registrarMovimiento({
      db,
      articuloId: id,
      tipo: 'ajuste',
      cantidad: data.stock - articuloAntes.stock,
      stockAntes: articuloAntes.stock,
      stockDespues: data.stock,
      usuarioId: req.user?._id,
      usuarioNombre: req.user?.nombre,
      motivo: 'Ajuste de stock'
    });
  }
  res.json({ modifiedCount: result.modifiedCount });
})

// DELETE eliminar articulo
router.delete('/:id', requireAuth, async (req, res) => {
  const { ObjectId } = require('mongodb')
  const id = req.params.id

  const result = await getDB().collection('articulos').deleteOne({ _id: new ObjectId(id) })
  res.json({ deletedCount: result.deletedCount })
})

// GET historial de movimientos
router.get('/movimientos', requireAuth, async (req, res) => {
  try {
    const db = getDB();
    const { articuloId, tipo, busqueda } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Construir filtro base
    let filter = {};
    
    // Filtrar por artículo específico
    if (articuloId) {
      filter.articuloId = new ObjectId(articuloId);
    }
    
    // Filtrar por tipo de movimiento
    if (tipo) {
      filter.tipo = tipo;
    }
    
    // Para búsqueda, necesitamos usar agregación para buscar en campos relacionados
    let pipeline = [];
    
    if (busqueda) {
      // Pipeline de agregación para búsqueda
      pipeline = [
        {
          $lookup: {
            from: 'articulos',
            localField: 'articuloId',
            foreignField: '_id',
            as: 'articulo'
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'usuarioId',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $addFields: {
            articuloNombre: { $arrayElemAt: ['$articulo.nombre', 0] },
            usuarioNombre: { $arrayElemAt: ['$usuario.nombre', 0] }
          }
        },
        {
          $match: {
            ...filter,
            $or: [
              { articuloNombre: { $regex: busqueda, $options: 'i' } },
              { usuarioNombre: { $regex: busqueda, $options: 'i' } },
              { referencia: { $regex: busqueda, $options: 'i' } },
              { motivo: { $regex: busqueda, $options: 'i' } }
            ]
          }
        },
        { $sort: { fecha: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];
      
      // Contar total con búsqueda
      const countPipeline = [
        {
          $lookup: {
            from: 'articulos',
            localField: 'articuloId',
            foreignField: '_id',
            as: 'articulo'
          }
        },
        {
          $lookup: {
            from: 'usuarios',
            localField: 'usuarioId',
            foreignField: '_id',
            as: 'usuario'
          }
        },
        {
          $addFields: {
            articuloNombre: { $arrayElemAt: ['$articulo.nombre', 0] },
            usuarioNombre: { $arrayElemAt: ['$usuario.nombre', 0] }
          }
        },
        {
          $match: {
            ...filter,
            $or: [
              { articuloNombre: { $regex: busqueda, $options: 'i' } },
              { usuarioNombre: { $regex: busqueda, $options: 'i' } },
              { referencia: { $regex: busqueda, $options: 'i' } },
              { motivo: { $regex: busqueda, $options: 'i' } }
            ]
          }
        },
        { $count: 'total' }
      ];
      
      const [movimientos, totalResult] = await Promise.all([
        db.collection('movimientos_inventario').aggregate(pipeline).toArray(),
        db.collection('movimientos_inventario').aggregate(countPipeline).toArray()
      ]);
      
      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      
      res.json({
        data: movimientos,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      // Sin búsqueda, usar find simple
      const total = await db.collection('movimientos_inventario').countDocuments(filter);
      const movimientos = await db.collection('movimientos_inventario')
        .find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      res.json({
        data: movimientos,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      });
    }
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router
