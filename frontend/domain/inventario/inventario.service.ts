// Funciones de acceso a datos y lógica de negocio para Inventario

import { Articulo, ArticulosPaginados } from './inventario.types';

const API_URL = 'http://localhost:3001/api/articulos';

export async function fetchArticulos(page = 1, limit = 6, search = ""): Promise<ArticulosPaginados> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

export async function agregarArticulo(data: Omit<Articulo, '_id' | 'estado'>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
}

export async function eliminarArticulo(id: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function editarArticulo(id: string, data: Partial<Omit<Articulo, '_id' | 'estado'>>) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
}

// Puedes agregar aquí funciones para agregar, editar, eliminar, etc. 