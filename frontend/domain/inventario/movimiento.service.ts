// Servicio para movimientos de inventario

import { MovimientoInventario, MovimientosPaginados, FiltrosMovimiento } from './movimiento.types';

const API_URL = 'http://localhost:3001/api/movimientos';

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function fetchMovimientos(
  page = 1, 
  limit = 10, 
  filtros: FiltrosMovimiento = {}
): Promise<MovimientosPaginados> {
  const params = new URLSearchParams({ 
    page: String(page), 
    limit: String(limit) 
  });
  
  if (filtros.tipo) params.append("tipo", filtros.tipo);
  if (filtros.articuloId) params.append("articuloId", filtros.articuloId);
  if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
  if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
  
  const res = await fetch(`${API_URL}?${params.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}

export async function crearMovimiento(movimiento: Omit<MovimientoInventario, '_id' | 'fecha'>) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(movimiento),
  });

  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  
  return res.json();
}
