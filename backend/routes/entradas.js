const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDB } = require('../db');

// GET /api/entradas - Obtener todas las entradas con paginación
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Construir filtro de búsqueda
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { 'articulo.nombre': { $regex: search, $options: 'i' } },
          { 'proveedor.nombre': { $regex: search, $options: 'i' } },
          { observaciones: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Pipeline de agregación para obtener información completa
    const pipeline = [
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
          from: 'proveedores',
          localField: 'proveedorId',
          foreignField: '_id',
          as: 'proveedor'
        }
      },
      {
        $unwind: '$articulo'
      },
      {
        $unwind: '$proveedor'
      },
      {
        $match: filter
      },
      {
        $sort: { fecha: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ];

    const entradas = await db.collection('entradas').aggregate(pipeline).toArray();
    
    // Contar total para paginación
    const totalPipeline = [
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
          from: 'proveedores',
          localField: 'proveedorId',
          foreignField: '_id',
          as: 'proveedor'
        }
      },
      {
        $unwind: '$articulo'
      },
      {
        $unwind: '$proveedor'
      },
      {
        $match: filter
      },
      {
        $count: 'total'
      }
    ];

    const totalResult = await db.collection('entradas').aggregate(totalPipeline).toArray();
    const total = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: entradas,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/entradas - Crear nueva entrada
router.post('/', async (req, res) => {
  try {
    const { articuloId, cantidad, proveedorId } = req.body;

    // Validar campos requeridos
    if (!articuloId || !cantidad || !proveedorId) {
      return res.status(400).json({ error: 'Artículo, cantidad y proveedor son requeridos' });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    const db = getDB();

    // Verificar que el artículo existe
    const articulo = await db.collection('articulos').findOne({ _id: new ObjectId(articuloId) });
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    // Verificar que el proveedor existe
    const proveedor = await db.collection('proveedores').findOne({ _id: new ObjectId(proveedorId) });
    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Crear la entrada
    const nuevaEntrada = {
      articuloId: new ObjectId(articuloId),
      cantidad: parseInt(cantidad),
      proveedorId: new ObjectId(proveedorId),
      fecha: new Date(),
      tipo: 'entrada'
    };

    // Insertar la entrada
    const resultEntrada = await db.collection('entradas').insertOne(nuevaEntrada);

    // Actualizar el stock del artículo
    await db.collection('articulos').updateOne(
      { _id: new ObjectId(articuloId) },
      { $inc: { stock: parseInt(cantidad) } }
    );

    // Crear movimiento en el historial
    const movimiento = {
      articuloId: new ObjectId(articuloId),
      tipo: 'entrada',
      cantidad: parseInt(cantidad),
      stockAntes: articulo.stock,
      stockDespues: articulo.stock + parseInt(cantidad),
      proveedorId: new ObjectId(proveedorId),
      fecha: new Date(),
      motivo: 'Entrada de inventario',
      referencia: resultEntrada.insertedId.toString()
    };

    await db.collection('movimientos_inventario').insertOne(movimiento);

    // Obtener la entrada completa con información de artículo y proveedor
    const entradaCompleta = await db.collection('entradas').aggregate([
      { $match: { _id: resultEntrada.insertedId } },
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
          from: 'proveedores',
          localField: 'proveedorId',
          foreignField: '_id',
          as: 'proveedor'
        }
      },
      {
        $unwind: '$articulo'
      },
      {
        $unwind: '$proveedor'
      }
    ]).toArray();

    res.status(201).json({
      message: 'Entrada creada exitosamente',
      entrada: entradaCompleta[0]
    });

  } catch (error) {
    console.error('Error al crear entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/entradas/:id - Obtener entrada por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de entrada inválido' });
    }

    const db = getDB();
    const entrada = await db.collection('entradas').aggregate([
      { $match: { _id: new ObjectId(id) } },
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
          from: 'proveedores',
          localField: 'proveedorId',
          foreignField: '_id',
          as: 'proveedor'
        }
      },
      {
        $unwind: '$articulo'
      },
      {
        $unwind: '$proveedor'
      }
    ]).toArray();

    if (entrada.length === 0) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    res.json(entrada[0]);
  } catch (error) {
    console.error('Error al obtener entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/entradas/:id - Eliminar entrada (revertir)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de entrada inválido' });
    }

    const db = getDB();
    
    // Obtener la entrada antes de eliminarla
    const entrada = await db.collection('entradas').findOne({ _id: new ObjectId(id) });
    if (!entrada) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    // Obtener el artículo actual
    const articulo = await db.collection('articulos').findOne({ _id: entrada.articuloId });
    if (!articulo) {
      return res.status(404).json({ error: 'Artículo no encontrado' });
    }

    // Verificar que hay suficiente stock para revertir
    if (articulo.stock < entrada.cantidad) {
      return res.status(400).json({ 
        error: `No hay suficiente stock para revertir esta entrada. Stock actual: ${articulo.stock}, cantidad a revertir: ${entrada.cantidad}` 
      });
    }

    // Revertir el stock
    await db.collection('articulos').updateOne(
      { _id: entrada.articuloId },
      { $inc: { stock: -entrada.cantidad } }
    );

    // Crear movimiento de reversión
    const movimiento = {
      articuloId: entrada.articuloId,
      tipo: 'salida',
      cantidad: entrada.cantidad,
      stockAntes: articulo.stock,
      stockDespues: articulo.stock - entrada.cantidad,
      fecha: new Date(),
      motivo: `Reversión de entrada ${id}`,
      referencia: id
    };

    await db.collection('movimientos_inventario').insertOne(movimiento);

    // Eliminar la entrada
    await db.collection('entradas').deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Entrada eliminada y stock revertido exitosamente' });
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
