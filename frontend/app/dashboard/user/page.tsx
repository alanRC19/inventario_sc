"use client";

import { useAuth } from "@/shared/utils/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClientTime from "../components/ClientTime";

type Venta = {
  _id: string;
  cliente: string;
  fecha: string;
  total: number;
  productos: Array<{
    nombre: string;
    cantidad: number;
  }>;
};

export default function UserDashboard() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [ventasHoy, setVentasHoy] = useState(0);
  const [inventarioBajo, setInventarioBajo] = useState(0);
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({
    totalVentas: 0,
    totalIngresos: 0,
    totalArticulos: 0,
    valorInventario: 0,
    articulosStockBajo: 0,
    articulosSinStock: 0
  });

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [ventasRes, inventarioRes, estadisticasRes] = await Promise.all([
          fetch('http://localhost:3001/api/ventas?limit=5'),
          fetch('http://localhost:3001/api/articulos?stock_bajo=true'),
          fetch('http://localhost:3001/api/reportes/estadisticas')
        ]);

        const ventasData = await ventasRes.json();
        const inventarioData = await inventarioRes.json();
        const estadisticasData = await estadisticasRes.json();

        // Contar ventas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventasData.data.filter(
          (venta: Venta) => venta.fecha.startsWith(hoy)
        ).length;

        setVentasHoy(ventasHoy);
        setUltimasVentas(ventasData.data.slice(0, 5));
        setInventarioBajo(inventarioData.data.length);
        setEstadisticasGenerales(estadisticasData);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Redirigir a admin si el usuario es administrador
    if (usuario?.rol === 'admin') {
      router.replace('/');
    }
  }, [usuario, router]);

  return (
    <main className="p-8 w-full">
      {/* Encabezado con información del usuario y fecha/hora */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 w-12 h-12 rounded-full flex items-center justify-center">
              <span className="material-icons text-2xl text-white">person</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-card">Dashboard</h1>
              <p className="text-muted flex items-center gap-2">
                {usuario?.nombre}
                <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                  Usuario
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <ClientTime />
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-app p-6 border border-app">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="material-icons text-blue-600">point_of_sale</span>
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Hoy</span>
          </div>
          <h3 className="text-sm text-muted mb-1">Ventas Realizadas</h3>
          <p className="text-2xl font-bold text-card">{ventasHoy}</p>
        </div>

        <div className="bg-card rounded-lg shadow-app p-6 border border-app">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <span className="material-icons text-amber-600">inventory_2</span>
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Atención</span>
          </div>
          <h3 className="text-sm text-muted mb-1">Productos Bajos en Stock</h3>
          <p className="text-2xl font-bold text-card">{inventarioBajo}</p>
        </div>

        <div className="bg-card rounded-lg shadow-app p-6 border border-app">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <span className="material-icons text-green-600">verified_user</span>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Activo</span>
          </div>
          <h3 className="text-sm text-muted mb-1">Estado de la Cuenta</h3>
          <p className="text-2xl font-bold text-green-600">Activa</p>
        </div>
      </div>

      {/* Contenedor principal de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg shadow-app p-6 border border-app">
            <h2 className="text-xl font-semibold mb-6 text-card flex items-center gap-2">
              <span className="material-icons">receipt_long</span>
              Últimas Ventas
            </h2>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4 text-muted">Cargando...</div>
              ) : ultimasVentas.length > 0 ? (
                ultimasVentas.map((venta) => (
                  <div key={venta._id} className="flex items-center justify-between p-4 rounded-lg border border-app">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-2 rounded-full">
                        <span className="material-icons text-blue-600">shopping_cart</span>
                      </div>
                      <div>
                        <p className="font-medium">{venta.cliente}</p>
                        <p className="text-sm text-muted">
                          {new Date(venta.fecha).toLocaleString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${venta.total.toFixed(2)}</p>
                      <p className="text-sm text-muted">{venta.productos.length} productos</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">No hay ventas recientes</div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha - Accesos Rápidos */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-card flex items-center gap-2">
            <span className="material-icons">apps</span>
            Accesos Rápidos
          </h2>

          {/* Tarjetas de acceso rápido */}
          <div className="space-y-4">
            <div 
              onClick={() => router.push('/ventas')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <span className="material-icons text-2xl text-blue-600">point_of_sale</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Nueva Venta</h3>
                  <p className="text-sm text-muted">Registrar una venta</p>
                </div>
                <span className="material-icons text-blue-600 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>

            <div 
              onClick={() => router.push('/inventario')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-full group-hover:scale-110 transition-transform">
                  <span className="material-icons text-2xl text-green-600">inventory_2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Inventario</h3>
                  <p className="text-sm text-muted">Consultar existencias</p>
                </div>
                <span className="material-icons text-green-600 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="material-icons text-amber-600">tips_and_updates</span>
                Consejos Rápidos
              </h3>
              <div className="space-y-3 text-sm">
                <p className="flex items-center gap-2">
                  <span className="material-icons text-green-600 text-base">check_circle</span>
                  Verifica el stock antes de registrar una venta
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-icons text-green-600 text-base">check_circle</span>
                  Confirma los datos del cliente
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-icons text-green-600 text-base">check_circle</span>
                  Revisa el total antes de finalizar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
