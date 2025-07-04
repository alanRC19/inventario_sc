// Tipos e interfaces del dominio Categorías

export interface Categoria {
  _id: string;
  nombre: string;
}

export interface CategoriasPaginadas {
  data: Categoria[];
  total: number;
  page: number;
  totalPages: number;
} 