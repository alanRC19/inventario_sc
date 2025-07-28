// Funciones de acceso a datos y lógica de negocio para Ventas

import { Venta, NuevaVenta, VentasPaginadas } from './venta.types';

export interface VentasPaginadasConTotal extends Omit<VentasPaginadas, 'data'> {
  data: Venta[];
  totalVendido: number;
}

const API_URL = 'http://localhost:3001/api/ventas';

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
  });
}

export async function obtenerVenta(id: string): Promise<Venta> {
  const res = await fetch(`${API_URL}/${id}`);
  return res.json();
}

export async function editarVenta(id: string, data: NuevaVenta): Promise<void> {
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
} 