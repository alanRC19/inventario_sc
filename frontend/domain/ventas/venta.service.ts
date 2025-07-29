// Funciones de acceso a datos y lógica de negocio para Ventas

import { Venta, NuevaVenta, VentasPaginadas } from './venta.types';

export interface VentasPaginadasConTotal extends Omit<VentasPaginadas, 'data'> {
  data: Venta[];
  totalVendido: number;
}

const API_URL = 'http://localhost:3001/api/ventas';

// Helper para obtener headers de autenticación
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function fetchVentas(page = 1, limit = 6, search = "", fechaInicio = "", fechaFin = ""): Promise<VentasPaginadasConTotal> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.append("search", search);
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

export async function agregarVenta(data: NuevaVenta): Promise<Venta> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function eliminarVenta(id: string): Promise<void> {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function obtenerVenta(id: string): Promise<Venta> {
  const res = await fetch(`${API_URL}/${id}`);
  return res.json();
}

export async function editarVenta(id: string, data: NuevaVenta): Promise<void> {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
}

export async function cancelarVenta(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}/cancelar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error al cancelar la venta');
  }
} 