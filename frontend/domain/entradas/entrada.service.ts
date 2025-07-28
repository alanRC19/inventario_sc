import { Entrada, EntradaFiltros, EntradaResumen } from './entrada.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getEntradas(
  filtros?: EntradaFiltros, 
  page = 1, 
  limit = 10
): Promise<PaginatedResponse<EntradaResumen>> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());

  if (filtros) {
    if (filtros.fechaInicio) queryParams.append('fechaInicio', filtros.fechaInicio.toISOString());
    if (filtros.fechaFin) queryParams.append('fechaFin', filtros.fechaFin.toISOString());
    if (filtros.proveedor) queryParams.append('proveedor', filtros.proveedor);
    if (filtros.estado) queryParams.append('estado', filtros.estado);
    if (filtros.tipo) queryParams.append('tipo', filtros.tipo);
    if (filtros.busqueda) queryParams.append('busqueda', filtros.busqueda);
  }

  const url = `${API_URL}/api/entradas?${queryParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Error al obtener las entradas');
  }

  return response.json();
}

export async function getEntrada(id: string): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Error al obtener la entrada');
  }

  return response.json();
}

export async function createEntrada(entrada: Omit<Entrada, '_id'>): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(entrada)
  });

  if (!response.ok) {
    throw new Error('Error al crear la entrada');
  }

  return response.json();
}

export async function updateEntrada(id: string, entrada: Partial<Entrada>): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(entrada)
  });

  if (!response.ok) {
    throw new Error('Error al actualizar la entrada');
  }

  return response.json();
}

export async function deleteEntrada(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/entradas/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Error al eliminar la entrada');
  }
}

export async function registrarPago(entradaId: string, pago: Entrada['pagos'] extends Array<infer T> ? T : never): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas/${entradaId}/pagos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(pago)
  });

  if (!response.ok) {
    throw new Error('Error al registrar el pago');
  }

  return response.json();
}

export async function registrarCalidad(entradaId: string, calidad: Entrada['calidad']): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas/${entradaId}/calidad`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(calidad)
  });

  if (!response.ok) {
    throw new Error('Error al registrar el control de calidad');
  }

  return response.json();
}

export async function subirAdjunto(entradaId: string, formData: FormData): Promise<Entrada> {
  const response = await fetch(`${API_URL}/api/entradas/${entradaId}/adjuntos`, {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Error al subir el archivo adjunto');
  }

  return response.json();
}

export async function eliminarAdjunto(entradaId: string, adjuntoId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/entradas/${entradaId}/adjuntos/${adjuntoId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Error al eliminar el archivo adjunto');
  }
}

export async function getEntradasStats(): Promise<{ 
  totalEntradas: number; 
  totalMontoEntradas: number;
  porEstado: { [key: string]: number };
  porTipo: { [key: string]: number };
}> {
  const response = await fetch(`${API_URL}/api/entradas/stats`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Error al obtener estadísticas de entradas');
  }

  return response.json();
}