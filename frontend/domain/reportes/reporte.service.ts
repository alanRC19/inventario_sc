// Servicio para obtener reportes y estadísticas

import { ReporteDetallado, ActividadReciente, ArticuloNoVendido, SolicitudArticulo, RespuestaAPI, RespuestaSolicitud } from './reporte.types';

const API_URL = 'http://localhost:3001/api/reportes';

type Entrada = {
  _id: string;
  cantidad: number;
  fecha: string;
  observaciones?: string;
  articulo?: {
    _id: string;
    nombre: string;
    precioUnitario?: number;
    precioCompra?: number;
  };
};

type Venta = {
  _id: string;
  cliente: string;
  fecha: string;
  total: number;
  productos?: Array<{ nombre: string; cantidad: number; }>;
};

type Movimiento = {
  _id: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  fecha: string;
  articulo?: { nombre: string; };
};

export async function obtenerReporteGeneral(fechaInicio?: string, fechaFin?: string): Promise<ReporteDetallado> {
  try {
    // Obtener reporte base y datos de entradas en paralelo
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const [reporteRes, entradasRes] = await Promise.all([
      fetch(`${API_URL}?${params.toString()}`),
      fetch('http://localhost:3001/api/entradas?limit=1000')
    ]);
    
    if (!reporteRes.ok || !entradasRes.ok) {
      throw new Error('Error al obtener datos del reporte');
    }
    
    const reporteData = await reporteRes.json();
    const entradasData = await entradasRes.json();
    
    // Calcular datos de entradas
    const entradas = entradasData.data || [];
    const totalEntradas = entradas.length;
    const valorTotalEntradas = entradas.reduce((acc: number, entrada: Entrada) => {
      const precioUnitario = entrada.articulo?.precioCompra || entrada.articulo?.precioUnitario || 0;
      return acc + (precioUnitario * entrada.cantidad);
    }, 0);
    
    // Calcular entradas por período (últimos 7 días)
    const entradasPorPeriodo = [];
    const hoy = new Date();
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const entradasDelDia = entradas.filter((entrada: Entrada) => {
        const entradaFecha = new Date(entrada.fecha).toISOString().split('T')[0];
        return entradaFecha === fechaStr;
      });
      
      entradasPorPeriodo.push({
        fecha: fechaStr,
        total: entradasDelDia.reduce((sum: number, entrada: Entrada) => {
          const precioUnitario = entrada.articulo?.precioCompra || entrada.articulo?.precioUnitario || 0;
          return sum + (precioUnitario * entrada.cantidad);
        }, 0),
        cantidad: entradasDelDia.length
      });
    }
    
    // Extender las estadísticas generales con datos de entradas
    const estadisticasExtendidas = {
      ...reporteData.estadisticasGenerales,
      totalEntradas,
      valorTotalEntradas,
      entradasPorPeriodo
    };
    
    return {
      ...reporteData,
      estadisticasGenerales: estadisticasExtendidas,
      entradasPorPeriodo
    };
  } catch (error) {
    console.error('Error al obtener reporte general:', error);
    throw error;
  }
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

export async function obtenerArticulosNoVendidos(fechaInicio?: string, fechaFin?: string): Promise<RespuestaAPI<ArticuloNoVendido[]>> {
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fechaInicio', fechaInicio);
  if (fechaFin) params.append('fechaFin', fechaFin);
  
  const res = await fetch(`http://localhost:3001/api/reportes/no-vendidos?${params.toString()}`);
  return res.json();
}

export async function agregarSolicitudArticulo(solicitud: {
  nombre: string;
  descripcion?: string;
  cliente: string;
  telefono?: string;
  observaciones?: string;
}): Promise<RespuestaSolicitud> {
  const res = await fetch('http://localhost:3001/api/reportes/solicitudes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(solicitud),
  });
  return res.json();
}

export async function obtenerSolicitudesArticulos(): Promise<RespuestaAPI<SolicitudArticulo[]>> {
  const res = await fetch('http://localhost:3001/api/reportes/solicitudes');
  return res.json();
}

export async function actualizarEstadoSolicitud(id: string, estado: string): Promise<{ message: string }> {
  const res = await fetch(`http://localhost:3001/api/reportes/solicitudes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ estado }),
  });
  return res.json();
}

export async function obtenerActividadesRecientes(): Promise<ActividadReciente[]> {
  try {
    // Obtener ventas recientes y movimientos de inventario
    const [ventasRes, movimientosRes] = await Promise.all([
      fetch('http://localhost:3001/api/ventas?limit=10'),
      fetch('http://localhost:3001/api/articulos/movimientos?limit=10')
    ]);

    const actividades: ActividadReciente[] = [];

    if (ventasRes.ok) {
      const ventasData = await ventasRes.json();
      const ventas = ventasData.data || [];
      
      ventas.slice(0, 3).forEach((venta: Venta) => {
        actividades.push({
          icon: 'shopping_cart',
          title: `Venta a ${venta.cliente}`,
          description: `$${venta.total.toFixed(2)} - ${venta.productos?.length || 0} productos`,
          timestamp: new Date(venta.fecha).toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
          }),
          status: 'success'
        });
      });
    }

    if (movimientosRes.ok) {
      const movimientosData = await movimientosRes.json();
      const movimientos = movimientosData.data || [];
      
      movimientos.slice(0, 2).forEach((mov: Movimiento) => {
        actividades.push({
          icon: mov.tipo === 'entrada' ? 'input' : 'output',
          title: `${mov.tipo === 'entrada' ? 'Entrada' : 'Salida'} de inventario`,
          description: `${mov.articulo?.nombre || 'Producto'} - ${mov.cantidad} unidades`,
          timestamp: new Date(mov.fecha).toLocaleString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: 'short'
          }),
          status: mov.tipo === 'entrada' ? 'success' : 'warning'
        });
      });
    }

    // Ordenar por fecha más reciente
    return actividades.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5);
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    // Fallback a datos de ejemplo
    return [
      {
        icon: 'shopping_cart',
        title: 'Sistema iniciado',
        description: 'Dashboard cargado correctamente',
        timestamp: new Date().toLocaleString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short'
        }),
        status: 'success'
      }
    ];
  }
} 