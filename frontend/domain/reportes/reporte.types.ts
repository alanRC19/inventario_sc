// Tipos e interfaces para reportes y estadísticas

export interface EstadisticasGenerales {
  totalVentas: number;
  totalIngresos: number;
  totalArticulos: number;
  valorInventario: number;
  articulosStockBajo: number;
  articulosSinStock: number;
}

export interface VentaPorPeriodo {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface ProductoMasVendido {
  nombre: string;
  cantidadVendida: number;
  ingresosGenerados: number;
}

export interface ClienteMasFrecuente {
  nombre: string;
  cantidadCompras: number;
  totalGastado: number;
}

export interface ReporteMensual {
  mes: string;
  ventas: number;
  ingresos: number;
  productosVendidos: number;
}

export interface ReporteDetallado {
  estadisticasGenerales: EstadisticasGenerales;
  ventasPorPeriodo: VentaPorPeriodo[];
  productosMasVendidos: ProductoMasVendido[];
  clientesMasFrecuentes: ClienteMasFrecuente[];
  reporteMensual: ReporteMensual[];
} 