const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const { ObjectId } = require('mongodb');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Movimiento = require('../models/movimiento');

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/entradas');
    fs.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Obtener todas las entradas con paginación y filtros
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      fechaInicio, 
      fechaFin, 
      proveedor, 
      estado, 
      tipo, 
      busqueda 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    
    if (fechaInicio || fechaFin) {
      filter.fecha = {};
      if (fechaInicio) filter.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) filter.fecha.$lte = new Date(fechaFin);
    }

    if (proveedor) filter.proveedor = new ObjectId(proveedor);
    if (estado) filter.estado = estado;
    if (tipo) filter.tipo = tipo;
    
    if (busqueda) {
      filter.$or = [
        { numeroFactura: new RegExp(busqueda, 'i') },
        { ordenCompra: new RegExp(busqueda, 'i') },
        { 'productos.nombre': new RegExp(busqueda, 'i') }
      ];
    }

    const collection = getDB().collection('entradas');
    const [entradas, total] = await Promise.all([
      collection.aggregate([
        { $match: filter },
        { $lookup: {
            from: 'proveedores',
            localField: 'proveedor',
            foreignField: '_id',
            as: 'proveedorInfo'
          }
        },
        { $unwind: '$proveedorInfo' },
        { $project: {
            fecha: 1,
            numeroFactura: 1,
            proveedor: {
              _id: '$proveedorInfo._id',
              nombre: '$proveedorInfo.nombre'
            },
            tipo: 1,
            estado: 1,
            total: 1,
            productos: {
              cantidad: { $size: '$productos' },
              valor: { $sum: '$productos.subtotal' }
            }
          }
        },
        { $sort: { fecha: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]).toArray(),
      collection.countDocuments(filter)
    ]);

    res.json({
      data: entradas,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    res.status(500).json({ message: 'Error al obtener las entradas' });
  }
});

// Obtener una entrada por ID
router.get('/:id', auth, async (req, res) => {
  try {
    const collection = getDB().collection('entradas');
    const entrada = await collection.aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      { $lookup: {
          from: 'proveedores',
          localField: 'proveedor',
          foreignField: '_id',
          as: 'proveedorInfo'
        }
      },
      { $lookup: {
          from: 'usuarios',
          localField: 'recibidoPor',
          foreignField: '_id',
          as: 'usuarioInfo'
        }
      },
      { $lookup: {
          from: 'articulos',
          localField: 'productos.articuloId',
          foreignField: '_id',
          as: 'articulosInfo'
        }
      },
      { $unwind: '$proveedorInfo' },
      { $unwind: '$usuarioInfo' },
      { $addFields: {
          'productos': {
            $map: {
              input: '$productos',
              as: 'producto',
              in: {
                $mergeObjects: [
                  '$$producto',
                  {
                    articulo: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$articulosInfo',
                            cond: { $eq: ['$$this._id', '$$producto.articuloId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]).next();

    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(entrada);
  } catch (error) {
    console.error('Error al obtener entrada:', error);
    res.status(500).json({ message: 'Error al obtener la entrada' });
  }
});

// Crear una nueva entrada
router.post('/', auth, async (req, res) => {
  try {
    const db = getDB();
    const session = db.client.startSession();

    await session.withTransaction(async () => {
      const entrada = {
        ...req.body,
        recibidoPor: new ObjectId(req.user._id),
        fecha: new Date(req.body.fecha || Date.now()),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!entrada.proveedor || !entrada.productos || !Array.isArray(entrada.productos) || entrada.productos.length === 0) {
        throw new Error('Proveedor y productos son requeridos');
      }

      entrada.proveedor = new ObjectId(entrada.proveedor);
      entrada.productos = entrada.productos.map(p => ({
        ...p,
        articuloId: new ObjectId(p.articuloId)
      }));

      const result = await db.collection('entradas').insertOne(entrada, { session });
      
      // Actualizar stock de artículos y registrar movimientos
      for (const producto of entrada.productos) {
        // Obtener información del artículo antes de actualizar
        const articulo = await db.collection('articulos').findOne({ _id: producto.articuloId });
        
        if (articulo) {
          const stockAnterior = articulo.stock;
          const stockNuevo = stockAnterior + producto.cantidad;
          
          // Actualizar o agregar proveedor en el array de proveedores del artículo
          const proveedorExistente = articulo.proveedores?.find(p => p.proveedorId?.equals(entrada.proveedor));
          
          let updateProveedores;
          if (proveedorExistente) {
            // Actualizar proveedor existente
            updateProveedores = {
              $set: {
                "proveedores.$.ultimoPrecio": producto.precioCompra,
                "proveedores.$.ultimaCompra": new Date(),
                "proveedores.$.totalCompras": (proveedorExistente.totalCompras || 0) + producto.cantidad
              }
            };
            // Usar arrayFilters para actualizar el proveedor específico
            await db.collection('articulos').updateOne(
              { 
                _id: producto.articuloId,
                "proveedores.proveedorId": entrada.proveedor
              },
              {
                $inc: { stock: producto.cantidad },
                $set: { 
                  ultimaEntrada: new Date(),
                  ultimoPrecioCompra: producto.precioCompra
                },
                ...updateProveedores
              },
              { session }
            );
          } else {
            // Agregar nuevo proveedor
            await db.collection('articulos').updateOne(
              { _id: producto.articuloId },
              { 
                $inc: { stock: producto.cantidad },
                $set: { 
                  ultimaEntrada: new Date(),
                  ultimoPrecioCompra: producto.precioCompra
                },
                $push: {
                  proveedores: {
                    proveedorId: entrada.proveedor,
                    ultimoPrecio: producto.precioCompra,
                    ultimaCompra: new Date(),
                    totalCompras: producto.cantidad,
                    fechaPrimeraCompra: new Date()
                  }
                }
              },
              { session }
            );
          }
          
          // Registrar movimiento
          const movimiento = new Movimiento({
            tipo: 'entrada',
            articuloId: producto.articuloId,
            articuloNombre: producto.nombre,
            cantidad: producto.cantidad, // Positivo porque es una entrada
            cantidadAnterior: stockAnterior,
            cantidadNueva: stockNuevo,
            usuario: req.user?.nombre || 'Sistema', // Usuario autenticado
            descripcion: `Entrada de inventario - Factura: ${entrada.numeroFactura || 'S/N'}`,
            referencia: result.insertedId.toString()
          });
          
          await movimiento.save();
        }
      }

      res.status(201).json({ ...entrada, _id: result.insertedId });
    });

    await session.endSession();
  } catch (error) {
    console.error('Error al crear entrada:', error);
    res.status(500).json({ message: error.message || 'Error al crear la entrada' });
  }
});

// Actualizar una entrada
router.patch('/:id', auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['estado', 'notas'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Actualizaciones inválidas' });
    }

    const collection = getDB().collection('entradas');
    const entrada = await collection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          ...req.body,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No se pudo actualizar la entrada' });
    }

    res.json(await collection.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (error) {
    console.error('Error al actualizar entrada:', error);
    res.status(500).json({ message: 'Error al actualizar la entrada' });
  }
});

// Eliminar una entrada
router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDB();
    const session = db.client.startSession();

    await session.withTransaction(async () => {
      const entrada = await db.collection('entradas').findOne(
        { _id: new ObjectId(req.params.id) },
        { session }
      );

      if (!entrada) {
        throw new Error('Entrada no encontrada');
      }

      // Revertir stock de artículos
      for (const producto of entrada.productos) {
        await db.collection('articulos').updateOne(
          { _id: producto.articuloId },
          { $inc: { stock: -producto.cantidad } },
          { session }
        );
      }

      // Eliminar archivos adjuntos
      if (entrada.adjuntos && entrada.adjuntos.length > 0) {
        for (const adjunto of entrada.adjuntos) {
          const filePath = path.join(__dirname, '../uploads/entradas', path.basename(adjunto.url));
          await fs.unlink(filePath).catch(() => {});
        }
      }

      await db.collection('entradas').deleteOne(
        { _id: new ObjectId(req.params.id) },
        { session }
      );
    });

    await session.endSession();
    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    res.status(500).json({ message: error.message || 'Error al eliminar la entrada' });
  }
});

// Registrar pago
router.post('/:id/pagos', auth, async (req, res) => {
  try {
    const pago = {
      ...req.body,
      fecha: new Date(req.body.fecha || Date.now())
    };

    const collection = getDB().collection('entradas');
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $push: { pagos: pago },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(await collection.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago' });
  }
});

// Registrar control de calidad
router.post('/:id/calidad', auth, async (req, res) => {
  try {
    const calidad = {
      ...req.body,
      revisadoPor: new ObjectId(req.user._id),
      fecha: new Date()
    };

    const collection = getDB().collection('entradas');
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          calidad,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(await collection.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (error) {
    console.error('Error al registrar control de calidad:', error);
    res.status(500).json({ message: 'Error al registrar el control de calidad' });
  }
});

// Subir archivo adjunto
router.post('/:id/adjuntos', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    const adjunto = {
      _id: new ObjectId(),
      tipo: req.body.tipo,
      url: `/uploads/entradas/${req.file.filename}`,
      nombre: req.file.originalname,
      fechaSubida: new Date()
    };

    const collection = getDB().collection('entradas');
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $push: { adjuntos: adjunto },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      await fs.unlink(req.file.path);
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    res.json(await collection.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Error al subir adjunto:', error);
    res.status(500).json({ message: 'Error al subir el archivo adjunto' });
  }
});

// Eliminar archivo adjunto
router.delete('/:id/adjuntos/:adjuntoId', auth, async (req, res) => {
  try {
    const collection = getDB().collection('entradas');
    const entrada = await collection.findOne(
      { _id: new ObjectId(req.params.id) }
    );

    if (!entrada) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }

    const adjunto = entrada.adjuntos?.find(a => a._id.toString() === req.params.adjuntoId);
    if (!adjunto) {
      return res.status(404).json({ message: 'Adjunto no encontrado' });
    }

    const filePath = path.join(__dirname, '..', adjunto.url);
    await fs.unlink(filePath).catch(() => {});

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $pull: { adjuntos: { _id: new ObjectId(req.params.adjuntoId) } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No se pudo eliminar el adjunto' });
    }

    res.json({ message: 'Adjunto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar adjunto:', error);
    res.status(500).json({ message: 'Error al eliminar el archivo adjunto' });
  }
});

// Obtener estadísticas
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const collection = getDB().collection('entradas');
    const [totalStats, estadoStats, tipoStats] = await Promise.all([
      collection.aggregate([{
        $group: {
          _id: null,
          totalEntradas: { $sum: 1 },
          totalMontoEntradas: { $sum: '$total' }
        }
      }]).toArray(),
      collection.aggregate([{
        $group: {
          _id: '$estado',
          count: { $sum: 1 }
        }
      }]).toArray(),
      collection.aggregate([{
        $group: {
          _id: '$tipo',
          count: { $sum: 1 }
        }
      }]).toArray()
    ]);

    const porEstado = estadoStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const porTipo = tipoStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    res.json({
      totalEntradas: totalStats[0]?.totalEntradas || 0,
      totalMontoEntradas: totalStats[0]?.totalMontoEntradas || 0,
      porEstado,
      porTipo
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

module.exports = router;