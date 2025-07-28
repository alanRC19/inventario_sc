// Servicio para obtener reportes y estadísticas

import { ReporteDetallado } from './reporte.types';

const API_URL = 'http://localhost:3001/api/reportes';

export async function obtenerReporteGeneral(fechaInicio?: string, fechaFin?: string): Promise<ReporteDetallado> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);
  
  const res = await fetch(`${API_URL}?${params.toString()}`);
  return res.json();
}

export async function obtenerEstadisticasGenerales(): Promise<any> {
  const res = await fetch(`${API_URL}/estadisticas`);
  return res.json();
}

export async function obtenerVentasPorPeriodo(fechaInicio?: string, fechaFin?: string): Promise<any> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);
  
  const res = await fetch(`${API_URL}/ventas-periodo?${params.toString()}`);
  return res.json();
} 

export async function obtenerArticulosNoVendidos(): Promise<any> {
  const res = await fetch('http://localhost:3001/api/reportes/no-vendidos');
  return res.json();
} 