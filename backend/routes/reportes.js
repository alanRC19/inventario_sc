const express = require('express')
const router = express.Router()
const { getDB } = require('../db')

// Función para calcular el estado del stock
function calculateStockStatus(stock) {
  if (stock === 0) {
    return 'fuera de stock'
  } else if (stock < 5) {
    return 'stock bajo'
  } else {
    return 'disponible'
  }
}

// GET reporte general
router.get('/', async (req, res) => {
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""

  try {
    const db = getDB()
    const ventasCollection = db.collection('ventas')
    const articulosCollection = db.collection('articulos')

    // Construir filtro de fechas para ventas
    let filterVentas = {}
    if (fechaInicio || fechaFin) {
      filterVentas.fecha = {}
      if (fechaInicio) {
        filterVentas.fecha.$gte = new Date(fechaInicio + 'T00:00:00.000Z')
      }
      if (fechaFin) {
        filterVentas.fecha.$lte = new Date(fechaFin + 'T23:59:59.999Z')
      }
    }

    // Obtener estadísticas generales
    const ventas = await ventasCollection.find(filterVentas).toArray()
    const articulos = await articulosCollection.find({}).toArray()

    const totalVentas = ventas.length
    const totalIngresos = ventas.reduce((sum, venta) => sum + venta.total, 0)
    const totalArticulos = articulos.length
    const valorInventario = articulos.reduce((sum, art) => sum + (art.stock * (art.precioUnitario || 0)), 0)
    const articulosStockBajo = articulos.filter(art => calculateStockStatus(art.stock) === 'stock bajo').length
    const articulosSinStock = articulos.filter(art => calculateStockStatus(art.stock) === 'fuera de stock').length

    // Obtener productos más vendidos
    const productosVendidos = {}
    ventas.forEach(venta => {
      (venta.productos ?? []).forEach(producto => {
        if (productosVendidos[producto.nombre]) {
          productosVendidos[producto.nombre].cantidadVendida += producto.cantidad
          productosVendidos[producto.nombre].ingresosGenerados += producto.subtotal
        } else {
          productosVendidos[producto.nombre] = {
            nombre: producto.nombre,
            cantidadVendida: producto.cantidad,
            ingresosGenerados: producto.subtotal
          }
        }
      })
    })

    const productosMasVendidos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5)

    // Obtener clientes más frecuentes
    const clientesFrecuentes = {}
    ventas.forEach(venta => {
      if (clientesFrecuentes[venta.cliente]) {
        clientesFrecuentes[venta.cliente].cantidadCompras += 1
        clientesFrecuentes[venta.cliente].totalGastado += venta.total
      } else {
        clientesFrecuentes[venta.cliente] = {
          nombre: venta.cliente,
          cantidadCompras: 1,
          totalGastado: venta.total
        }
      }
    })

    const clientesMasFrecuentes = Object.values(clientesFrecuentes)
      .sort((a, b) => b.cantidadCompras - a.cantidadCompras)
      .slice(0, 5)

    // Obtener ventas por período (últimos 7 días)
    const ventasPorPeriodo = []
    const hoy = new Date()
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy)
      fecha.setDate(fecha.getDate() - i)
      const fechaStr = fecha.toISOString().split('T')[0]
      
      const ventasDelDia = ventas.filter(venta => {
        const ventaFecha = new Date(venta.fecha).toISOString().split('T')[0]
        return ventaFecha === fechaStr
      })

      ventasPorPeriodo.push({
        fecha: fechaStr,
        total: ventasDelDia.reduce((sum, venta) => sum + venta.total, 0),
        cantidad: ventasDelDia.length
      })
    }

    // Obtener reporte mensual (últimos 6 meses)
    const reporteMensual = []
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mesStr = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
      
      const ventasDelMes = ventas.filter(venta => {
        const ventaFecha = new Date(venta.fecha)
        return ventaFecha.getMonth() === fecha.getMonth() && 
               ventaFecha.getFullYear() === fecha.getFullYear()
      })

      const productosVendidosMes = ventasDelMes.reduce((sum, venta) => {
        return sum + (venta.productos ?? []).reduce((prodSum, producto) => prodSum + producto.cantidad, 0)
      }, 0)

      reporteMensual.push({
        mes: mesStr,
        ventas: ventasDelMes.length,
        ingresos: ventasDelMes.reduce((sum, venta) => sum + venta.total, 0),
        productosVendidos: productosVendidosMes
      })
    }

    res.json({
      estadisticasGenerales: {
        totalVentas,
        totalIngresos,
        totalArticulos,
        valorInventario,
        articulosStockBajo,
        articulosSinStock
      },
      ventasPorPeriodo,
      productosMasVendidos,
      clientesMasFrecuentes,
      reporteMensual
    })

  } catch (error) {
    console.error('Error generando reporte:', error)
    res.status(500).json({ error: 'Error generando reporte' })
  }
})

// GET estadísticas generales
router.get('/estadisticas', async (req, res) => {
  try {
    const db = getDB()
    const ventasCollection = db.collection('ventas')
    const articulosCollection = db.collection('articulos')

    const ventas = await ventasCollection.find({}).toArray()
    const articulos = await articulosCollection.find({}).toArray()

    const estadisticas = {
      totalVentas: ventas.length,
      totalIngresos: ventas.reduce((sum, venta) => sum + venta.total, 0),
      totalArticulos: articulos.length,
      valorInventario: articulos.reduce((sum, art) => sum + (art.stock * (art.precioUnitario || 0)), 0),
      articulosStockBajo: articulos.filter(art => calculateStockStatus(art.stock) === 'stock bajo').length,
      articulosSinStock: articulos.filter(art => calculateStockStatus(art.stock) === 'fuera de stock').length
    }

    res.json(estadisticas)
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    res.status(500).json({ error: 'Error obteniendo estadísticas' })
  }
})

// GET artículos no vendidos
router.get('/no-vendidos', async (req, res) => {
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""
  
  try {
    const db = getDB();
    const articulosCollection = db.collection('articulos');
    const ventasCollection = db.collection('ventas');

    // Construir filtro de fechas para ventas
    let filterVentas = {}
    if (fechaInicio || fechaFin) {
      filterVentas.fecha = {}
      if (fechaInicio) {
        filterVentas.fecha.$gte = new Date(fechaInicio + 'T00:00:00.000Z')
      }
      if (fechaFin) {
        filterVentas.fecha.$lte = new Date(fechaFin + 'T23:59:59.999Z')
      }
    }

    // Obtener todos los IDs de artículos vendidos en el período
    const ventas = await ventasCollection.find(filterVentas).toArray();
    const vendidosSet = new Set();
    ventas.forEach(venta => {
      (venta.productos || []).forEach(producto => {
        vendidosSet.add(producto.articuloId?.toString());
      });
    });

    // Buscar artículos cuyo _id no está en vendidosSet
    const articulos = await articulosCollection.find({}).toArray();
    const noVendidos = articulos.filter(art => !vendidosSet.has(art._id.toString()));

    res.json({ data: noVendidos, total: noVendidos.length });
  } catch (error) {
    console.error('Error obteniendo artículos no vendidos:', error);
    res.status(500).json({ error: 'Error obteniendo artículos no vendidos' });
  }
});

// POST agregar artículo solicitado
router.post('/solicitudes', async (req, res) => {
  try {
    const { nombre, descripcion, cliente, telefono, observaciones } = req.body;
    
    if (!nombre || !cliente) {
      return res.status(400).json({ error: 'Nombre del artículo y cliente son requeridos' });
    }

    const db = getDB();
    const solicitudesCollection = db.collection('solicitudes');

    const nuevaSolicitud = {
      nombre,
      descripcion: descripcion || '',
      cliente,
      telefono: telefono || '',
      observaciones: observaciones || '',
      fecha: new Date(),
      estado: 'pendiente' // pendiente, en_proceso, completada, cancelada
    };

    const result = await solicitudesCollection.insertOne(nuevaSolicitud);

    res.status(201).json({
      message: 'Solicitud agregada exitosamente',
      data: { _id: result.insertedId, ...nuevaSolicitud }
    });
  } catch (error) {
    console.error('Error agregando solicitud:', error);
    res.status(500).json({ error: 'Error agregando solicitud' });
  }
});

// GET obtener solicitudes
router.get('/solicitudes', async (req, res) => {
  try {
    const db = getDB();
    const solicitudesCollection = db.collection('solicitudes');

    const solicitudes = await solicitudesCollection
      .find({})
      .sort({ fecha: -1 })
      .toArray();

    res.json({ data: solicitudes, total: solicitudes.length });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
});

// PUT actualizar estado de solicitud
router.put('/solicitudes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['pendiente', 'en_proceso', 'completada', 'cancelada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const db = getDB();
    const solicitudesCollection = db.collection('solicitudes');
    const { ObjectId } = require('mongodb');

    const result = await solicitudesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado, fechaActualizacion: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({ message: 'Estado actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ error: 'Error actualizando solicitud' });
  }
});

module.exports = router 