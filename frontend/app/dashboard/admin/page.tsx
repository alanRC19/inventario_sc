"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/shared/utils/useAuth";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { obtenerReporteGeneral, obtenerActividadesRecientes } from "@/domain/reportes/reporte.service";
import { StatsCard } from "@/shared/components/StatsCard";
import { QuickActions } from "@/shared/components/QuickActions";
import { RecentActivities } from "@/shared/components/RecentActivities";
import { ReporteDetallado, ActividadReciente } from "@/domain/reportes/reporte.types";
import InventoryFlow from "../components/InventoryFlow";
import ClientTime from "../components/ClientTime";

type Articulo = {
  _id: string;
  nombre: string;
  stock: number;
  precioVenta: number;
};

export default function AdminDashboard() {
  const { usuario } = useAuth();
  const router = useRouter();
  
  // Redirigir si no es admin
  useEffect(() => {
    if (usuario && usuario.rol !== 'admin') {
      router.push('/dashboard/user');
    }
  }, [usuario, router]);

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [ventasPorDia, setVentasPorDia] = useState<Array<{fecha: string; cantidad: number; total: number}>>([]);
  const [entradasPorDia, setEntradasPorDia] = useState<Array<{fecha: string; cantidad: number; total: number}>>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalEntradasMonto, setTotalEntradasMonto] = useState(0);
    const [reporte, setReporte] = useState<ReporteDetallado | null>(null);
  const [selectedChart, setSelectedChart] = useState<"ventasPorDia" | "entradasPorDia">("ventasPorDia");
  const [actividades, setActividades] = useState<ActividadReciente[]>([]);
  const [activeTab, setActiveTab] = useState("resumen");

  const fetchArticulos = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/articulos?limit=10000");
      const data = await res.json();
      setArticulos(data.data || data);
    } catch (error: unknown) {
      console.error("Error fetching articulos:", error instanceof Error ? error.message : "Unknown error");
    }
  };

  useEffect(() => {
      const fetchReporteGeneral = async () => {
        try {
          console.log('Iniciando fetchReporteGeneral...');
          const data = await obtenerReporteGeneral();
          console.log('Datos completos del reporte:', {
            estadisticasGenerales: data.estadisticasGenerales,
            entradasPorPeriodo: data.entradasPorPeriodo,
            ventasPorPeriodo: data.ventasPorPeriodo
          });
          console.log('Datos raw:', data);
          setReporte(data);
          // Actualizamos los valores usando las propiedades correctas de la API
          setTotalIngresos(data.estadisticasGenerales.totalIngresos || 0);
          // Usar las estadísticas de entradas del reporte general
          setTotalEntradas(data.estadisticasGenerales.totalEntradas || 0);
          setTotalEntradasMonto(data.estadisticasGenerales.valorTotalEntradas || 0);
          setVentasPorDia(data.ventasPorPeriodo || []);
          setEntradasPorDia(data.entradasPorPeriodo || []);

          // Obtener actividades recientes reales
          try {
            const actividadesReales = await obtenerActividadesRecientes();
            setActividades(actividadesReales || []);
          } catch (actError) {
            console.error("Error fetching actividades:", actError);
            // Fallback a actividades de ejemplo solo si falla la llamada
            setActividades([
              {
                icon: 'shopping_cart',
                title: 'Nueva venta registrada',
                description: 'Venta #1234 por $1,500.00',
                timestamp: 'Hace 5 minutos',
                status: 'success'
              },
              {
                icon: 'inventory',
                title: 'Stock actualizado',
                description: 'Producto "Biblia" actualizado',
                timestamp: 'Hace 15 minutos',
                status: 'info'
              },
              {
                icon: 'warning',
                title: 'Stock bajo detectado',
                description: 'Producto "Rosario" bajo mínimo',
                timestamp: 'Hace 30 minutos',
                status: 'warning'
              }
            ]);
          }
        } catch (error: unknown) {
          console.error("Error fetching reporte:", error);
          console.error("Error detallado:", error instanceof Error ? error.message : "Unknown error");
          setTotalIngresos(0);
          setTotalEntradas(0);
          setTotalEntradasMonto(0);
          setVentasPorDia([]);
          setEntradasPorDia([]);
        }
      };    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Función para obtener artículos no vendidos (solo todos los históricos)
        // Esta funcionalidad se movió a la página de reportes donde es más apropiada

        await Promise.all([
          fetchArticulos(), 
          fetchReporteGeneral()
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Sin dependencias - solo cargar una vez

  const valorInventario = articulos.reduce((acc, art) => acc + (art.stock * (art.precioVenta || 0)), 0);
  const stockBajo = reporte?.estadisticasGenerales?.articulosStockBajo ?? 0;
  const sinStock = reporte?.estadisticasGenerales?.articulosSinStock ?? 0;
  const productosMasVendidos = reporte?.productosMasVendidos?.slice(0, 3) ?? [];

  // Función para formatear fechas en las gráficas
  const formatearFechaGrafica = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Formatear datos para las gráficas con fechas legibles
  const ventasPorDiaFormateadas = ventasPorDia.map(venta => ({
    ...venta,
    fechaFormateada: formatearFechaGrafica(venta.fecha),
    totalFormateado: `$${venta.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }));

  const entradasPorDiaFormateadas = entradasPorDia.map(entrada => ({
    ...entrada,
    fechaFormateada: formatearFechaGrafica(entrada.fecha),
    totalFormateado: `$${entrada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
  }));

  if (!usuario || usuario.rol !== 'admin') {
    return null; // O un componente de carga
  }

  return (
    <main className="p-8 w-full bg-app min-h-screen theme-transition">
      {/* Header de bienvenida mejorado */}
      <div className="relative mb-10 p-8 rounded-3xl bg-card border border-app shadow-lg theme-transition overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <span className="material-icons text-2xl text-primary">dashboard</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                      Administrador
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-card leading-tight">
                    ¡Bienvenido, {usuario.nombre}!
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ClientTime />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-muted font-medium">Panel de Control</p>
              <p className="text-sm text-muted/80">
                Monitoreo y administración del sistema de inventario
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted font-medium">Estado del Sistema</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted/80">Todos los servicios operativos</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-muted font-medium">Última Actualización</p>
              <p className="text-sm text-muted/80">
                Datos sincronizados en tiempo real
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="mb-6">
        <nav className="flex gap-4">
          {['resumen', 'ventas', 'inventario', 'actividad'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Grid de estadísticas principales con animación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <StatsCard
          title="Ventas Totales"
          value={`$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon="point_of_sale"
          description="Ingresos generados por ventas"
          trend={{ value: 12, isPositive: true }}
          color="success"
          className="hover-scale"
        />
        <StatsCard
          title="Inversión en Stock"
          value={`$${totalEntradasMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon="input"
          description={`${totalEntradas} entradas registradas`}
          trend={{ value: 8, isPositive: true }}
          color="info"
          className="hover-scale"
        />
        <StatsCard
          title="Productos Activos"
          value={loading ? "..." : articulos.length.toLocaleString()}
          icon="inventory_2"
          description="Artículos disponibles en inventario"
          color="primary"
          className="hover-scale"
        />
        <StatsCard
          title="Valor del Inventario"
          value={`$${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon="account_balance"
          description="Valor total de productos en stock"
          color="primary"
          className="hover-scale"
        />
        <StatsCard
          title="Alertas de Stock"
          value={stockBajo + sinStock}
          icon="warning"
          description={`${stockBajo} bajo stock, ${sinStock} sin stock`}
          color={stockBajo + sinStock > 0 ? "warning" : "success"}
          className="hover-scale"
        />
      </div>

      {activeTab === 'resumen' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Gráficos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Gráfico principal */}
              <div className="bg-card rounded-xl shadow-app border border-app p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedChart.startsWith('ventas') ? 'Tendencia de Ventas' : 'Tendencia de Entradas'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedChart.startsWith('ventas') 
                        ? 'Análisis temporal de ventas e ingresos'
                        : 'Análisis temporal de entradas de inventario'
                      }
                    </p>
                  </div>
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value as "ventasPorDia" | "entradasPorDia")}
                    className="px-3 py-2 border rounded-lg text-sm bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all min-w-[180px]"
                    aria-label="Seleccionar tipo de visualización"
                    title="Tipo de visualización"
                  >
                    <option value="ventasPorDia">Ventas por Día</option>
                    <option value="entradasPorDia">Entradas por Día</option>
                  </select>
                </div>
                <div className="h-[300px] chart-container">
                  {(selectedChart.startsWith('ventas') ? ventasPorDiaFormateadas : entradasPorDiaFormateadas).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedChart.startsWith('ventas') ? ventasPorDiaFormateadas : entradasPorDiaFormateadas}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="fechaFormateada" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toLocaleString('es-MX')}`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '0.5rem',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number, name: string) => [
                            `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                            name
                          ]}
                          labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="total" 
                          name={selectedChart.startsWith('ventas') ? 'Total Ventas' : 'Total Entradas'} 
                          stroke={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} 
                          fillOpacity={1} 
                          fill="url(#colorTotal)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted">
                      <div className="text-center">
                        <span className="material-icons text-4xl mb-2 opacity-50">
                          {selectedChart.startsWith('ventas') ? 'trending_up' : 'inventory'}
                        </span>
                        <p>No hay datos de {selectedChart.startsWith('ventas') ? 'ventas' : 'entradas'} disponibles</p>
                        <p className="text-sm">Los datos aparecerán cuando se registren {selectedChart.startsWith('ventas') ? 'ventas' : 'entradas'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos más vendidos solo en resumen */}
              <div className="bg-card rounded-xl shadow-app border border-app p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
                    <p className="text-sm text-gray-500">Top 5 productos por unidades vendidas</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {productosMasVendidos.length > 0 ? (
                    productosMasVendidos.slice(0, 5).map((producto, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{producto.nombre}</p>
                          <p className="text-sm text-gray-600">{producto.cantidadVendida} unidades vendidas</p>
                        </div>
                        <p className="font-semibold text-green-600">
                          ${producto.ingresosGenerados.toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted py-4">
                      <span className="material-icons text-4xl mb-2 opacity-50">trending_up</span>
                      <p>No hay datos de productos vendidos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Columna derecha - Acciones rápidas y actividades */}
            <div className="space-y-6">
              {/* Acciones rápidas */}
              <QuickActions />
              
              {/* Actividades recientes */}
              <RecentActivities activities={actividades} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'ventas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de ventas detallado */}
          <div className="bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Análisis de Ventas</h3>
                <p className="text-sm text-gray-500">Tendencia de ventas últimos 7 días</p>
              </div>
            </div>
            <div className="h-[400px] chart-container">
              {ventasPorDiaFormateadas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ventasPorDiaFormateadas}>
                    <defs>
                      <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="fechaFormateada" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString('es-MX')}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        name
                      ]}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Ingresos por Ventas"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorVentas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  <div className="text-center">
                    <span className="material-icons text-4xl mb-2 opacity-50">point_of_sale</span>
                    <p>No hay datos de ventas disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabla detallada de ventas por día */}
          <div className="bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Desglose de Ventas</h3>
                <p className="text-sm text-gray-500">Resumen diario de ventas</p>
              </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {ventasPorDia.length > 0 ? (
                ventasPorDia.map((venta, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(venta.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{venta.cantidad} ventas realizadas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ${venta.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Promedio: ${(venta.total / (venta.cantidad || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-8">
                  <span className="material-icons text-4xl mb-2 opacity-50">receipt</span>
                  <p>No hay ventas registradas</p>
                </div>
              )}
            </div>
          </div>

          {/* Productos más vendidos detallado */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
                <p className="text-sm text-gray-500">Ranking completo por unidades vendidas</p>
              </div>
            </div>
            <div className="h-[400px] chart-container">
              {productosMasVendidos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productosMasVendidos}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="nombre" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toString()}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} unidades`,
                        name
                      ]}
                      labelFormatter={(label) => `Producto: ${label}`}
                    />
                    <Bar 
                      dataKey="cantidadVendida" 
                      name="Unidades vendidas"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  <div className="text-center">
                    <span className="material-icons text-4xl mb-2 opacity-50">trending_up</span>
                    <p>No hay datos de productos vendidos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventario' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flujo de inventario */}
          <div className="lg:col-span-2">
            <InventoryFlow />
          </div>

          {/* Gráfico de entradas */}
          <div className="bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Entradas de Inventario</h3>
                <p className="text-sm text-gray-500">Inversión en stock últimos 7 días</p>
              </div>
            </div>
            <div className="h-[400px] chart-container">
              {entradasPorDiaFormateadas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={entradasPorDiaFormateadas}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="fechaFormateada" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${value.toLocaleString('es-MX')}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '0.5rem',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
                        name
                      ]}
                      labelFormatter={(label) => `Fecha: ${label}`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Inversión en Stock"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorEntradas)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted">
                  <div className="text-center">
                    <span className="material-icons text-4xl mb-2 opacity-50">inventory</span>
                    <p>No hay datos de entradas disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desglose de entradas */}
          <div className="bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Desglose de Entradas</h3>
                <p className="text-sm text-gray-500">Resumen diario de compras</p>
              </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {entradasPorDia.length > 0 ? (
                entradasPorDia.map((entrada, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {new Date(entrada.fecha).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{entrada.cantidad} productos ingresados</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">
                        ${entrada.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Promedio: ${(entrada.total / (entrada.cantidad || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-8">
                  <span className="material-icons text-4xl mb-2 opacity-50">local_shipping</span>
                  <p>No hay entradas registradas</p>
                </div>
              )}
            </div>
          </div>

          {/* Alertas de stock */}
          <div className="lg:col-span-2 bg-card rounded-xl shadow-app border border-app p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Estado del Inventario</h3>
                <p className="text-sm text-gray-500">Productos que requieren atención</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <span className="material-icons text-4xl text-green-600 mb-2">check_circle</span>
                <p className="text-2xl font-bold text-green-700">
                  {articulos.length - stockBajo - sinStock}
                </p>
                <p className="text-sm text-green-600">Productos con stock normal</p>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="material-icons text-4xl text-yellow-600 mb-2">warning</span>
                <p className="text-2xl font-bold text-yellow-700">{stockBajo}</p>
                <p className="text-sm text-yellow-600">Productos con stock bajo</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <span className="material-icons text-4xl text-red-600 mb-2">error</span>
                <p className="text-2xl font-bold text-red-700">{sinStock}</p>
                <p className="text-sm text-red-600">Productos sin stock</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'actividad' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividades recientes ampliadas */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl shadow-app border border-app p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Registro de Actividades</h3>
                  <p className="text-sm text-gray-500">Historial completo de operaciones del sistema</p>
                </div>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {actividades.length > 0 ? (
                  actividades.map((actividad, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-lg ${
                        actividad.status === 'success' ? 'bg-green-100 text-green-600' :
                        actividad.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        actividad.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <span className="material-icons text-sm">{actividad.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{actividad.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{actividad.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{actividad.timestamp}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-12">
                    <span className="material-icons text-4xl mb-2 opacity-50">history</span>
                    <p>No hay actividades registradas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel lateral de estadísticas de actividad */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl shadow-app border border-app p-6">
              <h3 className="text-lg font-semibold mb-4">Estadísticas de Actividad</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actividades hoy</span>
                  <span className="font-semibold">{actividades.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Ventas procesadas</span>
                  <span className="font-semibold text-green-600">
                    {reporte?.estadisticasGenerales?.totalVentas || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Entradas registradas</span>
                  <span className="font-semibold text-blue-600">{totalEntradas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Productos activos</span>
                  <span className="font-semibold">{articulos.length}</span>
                </div>
              </div>
            </div>

            <QuickActions />
          </div>
        </div>
      )}
    </main>
  );
}
