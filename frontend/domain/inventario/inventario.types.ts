// Tipos e interfaces del dominio Inventario

export interface Articulo {
  _id: string;
  nombre: string;
  stock: number;
  precioUnitario?: number;
  precioVenta?: number;
  precioCompra?: number;
  categoria?: string;
  proveedor?: string;
  estado?: "disponible" | "stock bajo" | "fuera de stock";
  proveedores?: ProveedorArticulo[];
  fechaCreacion?: string;
  ultimaActualizacion?: string;
  ultimaEntrada?: string;
  ultimoPrecioCompra?: number;
}

export interface ProveedorArticulo {
  proveedorId: string;
  nombre?: string;
  ultimoPrecio: number;
  ultimaCompra: string;
  totalCompras: number;
  fechaPrimeraCompra: string;
  contacto?: string;
  email?: string;
}

export interface ArticulosPaginados {
  data: Articulo[];
  total: number;
  page: number;
  totalPages: number;
} 