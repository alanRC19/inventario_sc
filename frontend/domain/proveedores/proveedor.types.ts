// Tipos e interfaces del dominio Proveedores

export interface Proveedor {
  _id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
}

export interface ProveedoresPaginados {
  data: Proveedor[];
  total: number;
  page: number;
  totalPages: number;
} 