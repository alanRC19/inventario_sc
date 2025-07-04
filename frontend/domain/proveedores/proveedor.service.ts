// Funciones de acceso a datos y lógica de negocio para Proveedores

import { Proveedor, ProveedoresPaginados } from './proveedor.types';

const API_URL = 'http://localhost:3001/api/proveedores';

export async function fetchProveedores(page = 1, limit = 6, search = ""): Promise<ProveedoresPaginados> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

export async function agregarProveedor(data: Omit<Proveedor, '_id'>) {
  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function eliminarProveedor(id: string) {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
}

export async function editarProveedor(id: string, data: Partial<Omit<Proveedor, '_id'>>) {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
} 