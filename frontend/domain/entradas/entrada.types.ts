export interface Producto {
  articuloId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  lote?: string;
  fechaCaducidad?: Date;
  ubicacion?: string;
}

export interface Pago {
  fecha: Date;
  monto: number;
  metodoPago: 'efectivo' | 'transferencia' | 'cheque';
  referencia?: string;
}

export interface Adjunto {
  tipo: 'factura' | 'ordenCompra' | 'remision' | 'otro';
  url: string;
  nombre: string;
  fechaSubida: Date;
}

export interface ItemCalidad {
  productoId: string;
  estado: 'aprobado' | 'rechazado' | 'pendiente';
  cantidad: number;
  observaciones?: string;
}

export interface Calidad {
  revisadoPor?: string;
  fecha?: Date;
  estado?: 'aprobado' | 'rechazado' | 'parcial';
  notas?: string;
  items: ItemCalidad[];
}

export interface Entrada {
  _id?: string;
  fecha: Date;
  proveedor: string;
  productos: Producto[];
  total: number;
  tipo: 'compra' | 'devolucion' | 'ajuste' | 'inicial';
  numeroFactura?: string;
  ordenCompra?: string;
  estado: 'pendiente' | 'parcial' | 'completada' | 'cancelada';
  recibidoPor: string;
  ubicacion?: string;
  costoEnvio?: number;
  impuestos?: number;
  notas?: string;
  adjuntos?: Adjunto[];
  calidad?: Calidad;
  pagos?: Pago[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EntradaResumen {
  _id: string;
  fecha: Date;
  numeroFactura?: string;
  proveedor: {
    _id: string;
    nombre: string;
  };
  tipo: string;
  estado: string;
  total: number;
  productos: {
    cantidad: number;
    valor: number;
  };
}

export interface EntradaFiltros {
  fechaInicio?: Date;
  fechaFin?: Date;
  proveedor?: string;
  estado?: string;
  tipo?: string;
  busqueda?: string;
}