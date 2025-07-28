"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/shared/utils/useAuth";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts/es6';
import { obtenerReporteGeneral } from "@/domain/reportes/reporte.service";
import { StatsCard } from "@/shared/components/StatsCard";
import { QuickActions } from "@/shared/components/QuickActions";
import { RecentActivities } from "@/shared/components/RecentActivities";
import { Activity } from "@/shared/components/RecentActivities";
import { ReporteData } from "@/domain/reportes/reporte.types";
import { InventoryFlow } from "../components/InventoryFlow";
import ClientTime from "../components/ClientTime";

type Articulo = {
  _id: string;
  nombre: string;
  stock: number;
  precioUnitario?: number;
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
  const [reporte, setReporte] = useState<ReporteData | null>(null);
  const [selectedChart, setSelectedChart] = useState<"ventasPorDia" | "entradasPorDia">("ventasPorDia");
  const [actividades, setActividades] = useState<Activity[]>([]);
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

  const fetchReporteGeneral = async () => {
    try {
      const data = await obtenerReporteGeneral();
      console.log('Datos del reporte:', {
        entradasPorPeriodo: data.entradasPorPeriodo,
        ventasPorPeriodo: data.ventasPorPeriodo
      });
      setReporte(data);
      setTotalIngresos(data.estadisticasGenerales.totalIngresos || 0);
      setVentasPorDia(data.ventasPorPeriodo || []);
      setEntradasPorDia(data.entradasPorPeriodo || []);

      // Actividades recientes
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
    } catch (error: unknown) {
      console.error("Error fetching reporte:", error instanceof Error ? error.message : "Unknown error");
      setTotalIngresos(0);
      setVentasPorDia([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchArticulos(), fetchReporteGeneral()]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const valorInventario = articulos.reduce((acc, art) => acc + (art.stock * (art.precioUnitario || 0)), 0);
  const stockBajo = reporte?.estadisticasGenerales?.articulosStockBajo ?? 0;
  const sinStock = reporte?.estadisticasGenerales?.articulosSinStock ?? 0;
  const productosMasVendidos = reporte?.productosMasVendidos?.slice(0, 3) ?? [];

  const quickActions = [
    {
      icon: 'add_shopping_cart',
      title: 'Nueva Venta',
      description: 'Registrar una nueva venta',
      onClick: () => router.push('/ventas')
    },
    {
      icon: 'inventory',
      title: 'Gestionar Inventario',
      description: 'Ver y editar productos',
      onClick: () => router.push('/inventario')
    },
    {
      icon: 'receipt_long',
      title: 'Ver Reportes',
      description: 'Acceder a reportes detallados',
      onClick: () => router.push('/reportes')
    },
    {
      icon: 'group',
      title: 'Gestionar Usuarios',
      description: 'Administrar usuarios del sistema',
      onClick: () => router.push('/usuarios')
    }
  ];

  if (!usuario || usuario.rol !== 'admin') {
    return null; // O un componente de carga
  }

  return (
    <main className="p-8 w-full bg-background min-h-screen">
      {/* Header con efecto de gradiente */}
      <div className="relative mb-8 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="absolute top-0 left-0 w-full h-full bg-pattern opacity-10 rounded-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold backdrop-blur-sm">
              Administrador
            </span>
            <ClientTime />
          </div>
          <h1 className="text-4xl font-bold mb-2">¡Bienvenido, {usuario.nombre}!</h1>
          <p className="text-white/80">Panel de control y monitoreo del sistema</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Ventas"
          value={`$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon="payments"
          description="Ingresos totales por ventas"
          trend={{ value: 12, isPositive: true }}
          className="stats-card animate-fadeIn"
        />
        <StatsCard
          title="Total Entradas"
          value={reporte?.estadisticasGenerales.totalEntradas ?? 0}
          icon="input"
          description="Total de productos ingresados"
          className="stats-card animate-fadeIn delay-50"
        />
        <StatsCard
          title="Productos"
          value={loading ? "..." : articulos.length}
          icon="inventory_2"
          description="Total de productos en inventario"
          className="stats-card animate-fadeIn delay-100"
        />
        <StatsCard
          title="Valor Inventario"
          value={`$${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          icon="account_balance"
          description="Valor total del inventario"
          className="stats-card animate-fadeIn delay-200"
        />
        <StatsCard
          title="Alertas"
          value={stockBajo + sinStock}
          icon="warning"
          description="Productos que requieren atención"
          className={`stats-card animate-fadeIn delay-300 ${stockBajo + sinStock > 0 ? 'border-yellow-400 action-highlight' : ''}`}
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedChart.startsWith('ventas') ? ventasPorDia : entradasPorDia}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '0.5rem',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        name={selectedChart.startsWith('ventas') ? 'Ventas' : 'Entradas'} 
                        stroke={selectedChart.startsWith('ventas') ? '#3b82f6' : '#10b981'} 
                        fillOpacity={1} 
                        fill="url(#colorTotal)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de flujo de inventario */}
              <InventoryFlow />

              {/* Productos más vendidos */}
              <div className="bg-card rounded-xl shadow-app border border-app p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Productos Más Vendidos</h3>
                    <p className="text-sm text-gray-500">Top productos por unidades vendidas</p>
                  </div>
                </div>
                <div className="h-[300px] chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productosMasVendidos}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '0.5rem',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="cantidadVendida" 
                        name="Unidades vendidas"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Columna derecha - Acciones rápidas y actividades */}
            <div className="space-y-6">
              {/* Acciones rápidas */}
              <QuickActions actions={quickActions} />
              
              {/* Actividades recientes */}
              <RecentActivities activities={actividades} />
            </div>
          </div>
        </>
      )}

      {activeTab === 'inventario' && (
        <div className="grid grid-cols-1 gap-6">
          <InventoryFlow />
        </div>
      )}
    </main>
  );
}
