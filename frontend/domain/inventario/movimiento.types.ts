export interface MovimientoInventario {
  _id: string
  tipo: 'entrada' | 'venta' | 'ajuste' | 'devolucion'
  articuloId: string
  articuloNombre: string
  cantidad: number
  cantidadAnterior: number
  cantidadNueva: number
  usuario: string
  fecha: string
  descripcion?: string
  referencia?: string // ID de la venta, entrada, etc.
}

export interface MovimientosPaginados {
  data: MovimientoInventario[]
  total: number
  page: number
  pages: number
}

export interface FiltrosMovimiento {
  tipo?: string
  articuloId?: string
  fechaInicio?: string
  fechaFin?: string
}
