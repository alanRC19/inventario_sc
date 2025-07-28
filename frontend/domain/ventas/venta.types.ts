// Tipos e interfaces del dominio Ventas

export interface ProductoVenta {
  articuloId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  proveedor?: string;
}

export interface Venta {
  _id: string;
  cliente: string;
  productos: ProductoVenta[];
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  fecha: string;
  estado: 'completada' | 'cancelada';
}

export interface VentasPaginadas {
  data: Venta[];
  total: number;
  page: number;
  totalPages: number;
}

export interface NuevaVenta {
  cliente: string;
  productos: ProductoVenta[];
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
} 