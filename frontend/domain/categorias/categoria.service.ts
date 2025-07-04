// Funciones de acceso a datos y lógica de negocio para Categorías

import { Categoria, CategoriasPaginadas } from './categoria.types';

const API_URL = 'http://localhost:3001/api/categorias';

export async function fetchCategorias(page = 1, limit = 6, search = ""): Promise<CategoriasPaginadas> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

export async function agregarCategoria(data: Omit<Categoria, '_id'>) {
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function eliminarCategoria(id: string) {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function editarCategoria(id: string, data: Partial<Omit<Categoria, '_id'>>) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
} 