const express = require("express")
const router = express.Router()
const { getDB } = require("../db")

// Función para calcular el estado del stock
function calculateStockStatus(stock) {
  if (stock === 0) {
    return "fuera de stock"
  } else if (stock < 5) {
    return "stock bajo"
  } else {
    return "disponible"
  }
}

// Función para obtener productos solicitados que no existen (agotados con demanda)
async function getProductosSolicitadosAgotados(ventasCollection, articulosCollection) {
  try {
    // Obtener todos los artículos agotados
    const articulosAgotados = await articulosCollection.find({ stock: 0 }).toArray()
    if (articulosAgotados.length === 0) {
      return []
    }

    // Obtener ventas de los últimos 30 días para calcular demanda reciente
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const productosConDemanda = []

    for (const articulo of articulosAgotados) {
      // Buscar todas las ventas históricas de este producto
      const ventasHistoricas = await ventasCollection
        .find({
          "productos.nombre": articulo.nombre,
        })
        .sort({ fecha: -1 })
        .toArray()

      if (ventasHistoricas.length > 0) {
        // Calcular estadísticas de demanda
        let totalVendido = 0
        let ventasUltimos30Dias = 0
        let ultimaVenta = null

        ventasHistoricas.forEach((venta) => {
          const fechaVenta = new Date(venta.fecha)
          // Encontrar el producto específico en esta venta
          const productoEnVenta = venta.productos.find((p) => p.nombre === articulo.nombre)
          if (productoEnVenta) {
            totalVendido += productoEnVenta.cantidad
            // Contar ventas de los últimos 30 días
            if (fechaVenta >= hace30Dias) {
              ventasUltimos30Dias += productoEnVenta.cantidad
            }
            // Guardar la fecha de la última venta
            if (!ultimaVenta || fechaVenta > ultimaVenta) {
              ultimaVenta = fechaVenta
            }
          }
        })

        // Solo incluir productos que tienen demanda reciente o histórica significativa
        if (totalVendido > 0) {
          productosConDemanda.push({
            nombre: articulo.nombre,
            categoria: articulo.categoria || "Sin categoría",
            totalVendidoHistorico: totalVendido,
            ventasUltimos30Dias: ventasUltimos30Dias,
            ultimaVenta: ultimaVenta,
            diasSinVenta: ultimaVenta ? Math.floor((new Date() - ultimaVenta) / (1000 * 60 * 60 * 24)) : null,
            precioUnitario: articulo.precioUnitario || 0,
            prioridad: ventasUltimos30Dias > 0 ? "alta" : totalVendido > 10 ? "media" : "baja",
          })
        }
      }
    }

    // Ordenar por prioridad y demanda reciente
    return productosConDemanda.sort((a, b) => {
      // Primero por prioridad
      const prioridadOrder = { alta: 3, media: 2, baja: 1 }
      if (prioridadOrder[a.prioridad] !== prioridadOrder[b.prioridad]) {
        return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad]
      }
      // Luego por ventas de los últimos 30 días
      if (a.ventasUltimos30Dias !== b.ventasUltimos30Dias) {
        return b.ventasUltimos30Dias - a.ventasUltimos30Dias
      }
      // Finalmente por total vendido histórico
      return b.totalVendidoHistorico - a.totalVendidoHistorico
    })
  } catch (error) {
    console.error("Error obteniendo productos solicitados agotados:", error)
    return []
  }
}

// Función para obtener la fecha de agotamiento de un producto
async function getFechaAgotamiento(nombreProducto, ventasCollection) {
  try {
    // Buscar la venta más reciente que incluya este producto
    const ventasConProducto = await ventasCollection
      .find({
        "productos.nombre": nombreProducto,
      })
      .sort({ fecha: -1 })
      .toArray()

    if (ventasConProducto.length > 0) {
      return ventasConProducto[0].fecha
    }

    // Si no hay ventas, retornar fecha actual
    return new Date()
  } catch (error) {
    console.error("Error obteniendo fecha de agotamiento:", error)
    return new Date()
  }
}

// GET reporte general
router.get("/", async (req, res) => {
  const fechaInicio = req.query.fechaInicio || ""
  const fechaFin = req.query.fechaFin || ""

  try {
    const db = getDB()
    const ventasCollection = db.collection("ventas")
    const articulosCollection = db.collection("articulos")

    // Construir filtro de fechas para ventas
    const filterVentas = {}
    if (fechaInicio || fechaFin) {
      filterVentas.fecha = {}
      if (fechaInicio) {
        filterVentas.fecha.$gte = new Date(fechaInicio + "T00:00:00.000Z")
      }
      if (fechaFin) {
        filterVentas.fecha.$lte = new Date(fechaFin + "T23:59:59.999Z")
      }
    }

    // Obtener estadísticas generales
    const ventas = await ventasCollection.find(filterVentas).toArray()
    const articulos = await articulosCollection.find({}).toArray()

    const totalVentas = ventas.length
    const totalIngresos = ventas.reduce((sum, venta) => sum + venta.total, 0)
    const totalArticulos = articulos.length
    const valorInventario = articulos.reduce((sum, art) => sum + art.stock * (art.precioUnitario || 0), 0)

    // Obtener artículos con stock bajo y sin stock con detalles
    const articulosStockBajo = articulos.filter((art) => calculateStockStatus(art.stock) === "stock bajo")
    const articulosSinStock = articulos.filter((art) => calculateStockStatus(art.stock) === "fuera de stock")

    // Crear detalles para artículos con stock bajo
    const articulosStockBajoDetalle = await Promise.all(
      articulosStockBajo.map(async (articulo) => ({
        nombre: articulo.nombre,
        stock: articulo.stock,
        stockMinimo: 5,
        categoria: articulo.categoria || "Sin categoría",
        fechaUltimaActualizacion: articulo.fechaActualizacion || new Date(),
      })),
    )

    // Crear detalles para artículos sin stock
    const articulosSinStockDetalle = await Promise.all(
      articulosSinStock.map(async (articulo) => {
        const fechaAgotamiento = await getFechaAgotamiento(articulo.nombre, ventasCollection)
        return {
          nombre: articulo.nombre,
          categoria: articulo.categoria || "Sin categoría",
          fechaAgotamiento: fechaAgotamiento,
          precioUnitario: articulo.precioUnitario || 0,
        }
      }),
    )

    // Obtener productos solicitados que no existen (nueva funcionalidad)
    const productosSolicitadosAgotados = await getProductosSolicitadosAgotados(ventasCollection, articulosCollection)

    // Obtener productos más vendidos
    const productosVendidos = {}
    ventas.forEach((venta) => {
      ;(venta.productos ?? []).forEach((producto) => {
        if (productosVendidos[producto.nombre]) {
          productosVendidos[producto.nombre].cantidadVendida += producto.cantidad
          productosVendidos[producto.nombre].ingresosGenerados += producto.subtotal
        } else {
          productosVendidos[producto.nombre] = {
            nombre: producto.nombre,
            cantidadVendida: producto.cantidad,
            ingresosGenerados: producto.subtotal,
          }
        }
      })
    })

    const productosMasVendidos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 5)

    // Obtener clientes más frecuentes
    const clientesFrecuentes = {}
    ventas.forEach((venta) => {
      if (clientesFrecuentes[venta.cliente]) {
        clientesFrecuentes[venta.cliente].cantidadCompras += 1
        clientesFrecuentes[venta.cliente].totalGastado += venta.total
      } else {
        clientesFrecuentes[venta.cliente] = {
          nombre: venta.cliente,
          cantidadCompras: 1,
          totalGastado: venta.total,
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
      const fechaStr = fecha.toISOString().split("T")[0]

      const ventasDelDia = ventas.filter((venta) => {
        const ventaFecha = new Date(venta.fecha).toISOString().split("T")[0]
        return ventaFecha === fechaStr
      })

      ventasPorPeriodo.push({
        fecha: fechaStr,
        total: ventasDelDia.reduce((sum, venta) => sum + venta.total, 0),
        cantidad: ventasDelDia.length,
      })
    }

    // Obtener reporte mensual (últimos 6 meses)
    const reporteMensual = []
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mesStr = fecha.toLocaleDateString("es-ES", { year: "numeric", month: "long" })

      const ventasDelMes = ventas.filter((venta) => {
        const ventaFecha = new Date(venta.fecha)
        return ventaFecha.getMonth() === fecha.getMonth() && ventaFecha.getFullYear() === fecha.getFullYear()
      })

      const productosVendidosMes = ventasDelMes.reduce((sum, venta) => {
        return sum + (venta.productos ?? []).reduce((prodSum, producto) => prodSum + producto.cantidad, 0)
      }, 0)

      reporteMensual.push({
        mes: mesStr,
        ventas: ventasDelMes.length,
        ingresos: ventasDelMes.reduce((sum, venta) => sum + venta.total, 0),
        productosVendidos: productosVendidosMes,
      })
    }

    res.json({
      estadisticasGenerales: {
        totalVentas,
        totalIngresos,
        totalArticulos,
        valorInventario,
        articulosStockBajo: articulosStockBajo.length,
        articulosSinStock: articulosSinStock.length,
        articulosStockBajoDetalle,
        articulosSinStockDetalle,
        productosSolicitadosAgotados, // Nueva funcionalidad
      },
      ventasPorPeriodo,
      productosMasVendidos,
      clientesMasFrecuentes,
      reporteMensual,
    })
  } catch (error) {
    console.error("Error generando reporte:", error)
    res.status(500).json({ error: "Error generando reporte" })
  }
})

// GET estadísticas generales
router.get("/estadisticas", async (req, res) => {
  try {
    const db = getDB()
    const ventasCollection = db.collection("ventas")
    const articulosCollection = db.collection("articulos")

    const ventas = await ventasCollection.find({}).toArray()
    const articulos = await articulosCollection.find({}).toArray()

    const estadisticas = {
      totalVentas: ventas.length,
      totalIngresos: ventas.reduce((sum, venta) => sum + venta.total, 0),
      totalArticulos: articulos.length,
      valorInventario: articulos.reduce((sum, art) => sum + art.stock * (art.precioUnitario || 0), 0),
      articulosStockBajo: articulos.filter((art) => calculateStockStatus(art.stock) === "stock bajo").length,
      articulosSinStock: articulos.filter((art) => calculateStockStatus(art.stock) === "fuera de stock").length,
    }

    res.json(estadisticas)
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    res.status(500).json({ error: "Error obteniendo estadísticas" })
  }
})

module.exports = router
