// Tipos e interfaces del dominio Inventario

export interface Articulo {
  _id: string;
  nombre: string;
  stock: number;
  precioUnitario?: number;
  categoria?: string;
  proveedor?: string;
  estado?: "disponible" | "stock bajo" | "fuera de stock";
}

export interface ArticulosPaginados {
  data: Articulo[];
  total: number;
  page: number;
  totalPages: number;
} 