export interface EstadisticasGenerales {
  totalVentas: number
  totalIngresos: number
  totalArticulos: number
  valorInventario: number
  articulosStockBajo: number
  articulosSinStock: number
  articulosStockBajoDetalle?: ArticuloStockBajo[]
  articulosSinStockDetalle?: ArticuloSinStock[]
  productosSolicitadosAgotados?: ProductoSolicitadoAgotado[]
}

export interface ArticuloStockBajo {
  nombre: string
  stock: number
  stockMinimo: number
  categoria: string
  fechaUltimaActualizacion: Date
}

export interface ArticuloSinStock {
  nombre: string
  categoria: string
  fechaAgotamiento: Date
  precioUnitario: number
}

export interface ProductoSolicitadoAgotado {
  nombre: string
  categoria: string
  totalVendidoHistorico: number
  ventasUltimos30Dias: number
  ultimaVenta: Date
  diasSinVenta: number
  precioUnitario: number
  prioridad: "alta" | "media" | "baja"
}

export interface VentaPorPeriodo {
  fecha: string
  total: number
  cantidad: number
}

export interface ProductoMasVendido {
  nombre: string
  cantidadVendida: number
  ingresosGenerados: number
}

export interface ClienteFrecuente {
  nombre: string
  cantidadCompras: number
  totalGastado: number
}

export interface ReporteMensual {
  mes: string
  ventas: number
  ingresos: number
  productosVendidos: number
}

export interface ReporteDetallado {
  estadisticasGenerales: EstadisticasGenerales
  ventasPorPeriodo: VentaPorPeriodo[]
  productosMasVendidos: ProductoMasVendido[]
  clientesMasFrecuentes: ClienteFrecuente[]
  reporteMensual: ReporteMensual[]
}
