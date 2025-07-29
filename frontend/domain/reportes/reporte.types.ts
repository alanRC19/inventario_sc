// Tipos e interfaces para reportes y estadísticas

export interface EstadisticasGenerales {
  totalVentas: number;
  totalIngresos: number;
  totalArticulos: number;
  valorInventario: number;
  articulosStockBajo: number;
  articulosSinStock: number;
  totalEntradas: number;
  valorTotalEntradas: number;
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
  entradasPorPeriodo: VentaPorPeriodo[];
  productosMasVendidos: ProductoMasVendido[];
  clientesMasFrecuentes: ClienteMasFrecuente[];
  reporteMensual: ReporteMensual[];
}

export interface ActividadReciente {
  icon: string;
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

export interface ArticuloNoVendido {
  _id: string;
  nombre: string;
  categoria?: string;
  proveedor?: string;
  stock: number;
  precioUnitario?: number;
}

export interface SolicitudArticulo {
  _id?: string;
  nombre: string;
  descripcion?: string;
  cliente: string;
  telefono?: string;
  observaciones?: string;
  fecha?: Date;
  fechaActualizacion?: Date;
  estado: 'pendiente' | 'en_proceso' | 'completada' | 'cancelada';
}

export interface RespuestaAPI<T> {
  data: T;
  total: number;
}

export interface RespuestaSolicitud {
  message: string;
  data: SolicitudArticulo;
} 