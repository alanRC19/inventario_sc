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
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [montoEntradas, setMontoEntradas] = useState(0);
  const [ultimasVentas, setUltimasVentas] = useState<Venta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumen");

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [ventasRes, inventarioRes, entradasRes] = await Promise.all([
          fetch('http://localhost:3001/api/ventas?limit=5'),
          fetch('http://localhost:3001/api/articulos?stock_bajo=true'),
          fetch('http://localhost:3001/api/entradas?limit=100')
        ]);

        const ventasData = await ventasRes.json();
        const inventarioData = await inventarioRes.json();
        const entradasData = await entradasRes.json();

        // Contar ventas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ventasHoy = ventasData.data.filter(
          (venta: Venta) => venta.fecha.startsWith(hoy)
        ).length;

        // Calcular datos de entradas
        const entradas = entradasData.data || [];
        const totalEntradas = entradas.length;
        const montoTotalEntradas = entradas.reduce((acc: number, entrada: { precioTotal?: number }) => 
          acc + (entrada.precioTotal || 0), 0
        );

        setVentasHoy(ventasHoy);
        setUltimasVentas(ventasData.data.slice(0, 5));
        setInventarioBajo(inventarioData.data.length);
        setTotalEntradas(totalEntradas);
        setMontoEntradas(montoTotalEntradas);
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

  const statsCards = [
    {
      title: "Ventas Hoy",
      value: ventasHoy.toString(),
      icon: "point_of_sale",
      color: "primary",
      description: "Ventas realizadas"
    },
    {
      title: "Entradas Inventario",
      value: `$${montoEntradas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
      icon: "input",
      color: "success",
      description: `${totalEntradas} entradas registradas`
    },
    {
      title: "Stock Bajo",
      value: inventarioBajo.toString(),
      icon: "inventory_2",
      color: "warning",
      description: "Productos con stock bajo"
    },
    {
      title: "Estado Cuenta",
      value: "Activa",
      icon: "verified_user",
      color: "info",
      description: "Usuario registrado"
    }
  ];

  const quickActions = [
    {
      title: "Nueva Venta",
      description: "Registrar una venta rápidamente",
      icon: "point_of_sale",
      color: "primary",
      onClick: () => router.push('/ventas')
    },
    {
      title: "Consultar Inventario",
      description: "Ver existencias de productos",
      icon: "inventory_2",
      color: "success",
      onClick: () => router.push('/inventario')
    },
    {
      title: "Historial de Ventas",
      description: "Ver ventas anteriores",
      icon: "receipt_long",
      color: "info",
      onClick: () => router.push('/ventas')
    }
  ];

  const actividades = ultimasVentas.slice(0, 3).map(venta => ({
    icon: 'shopping_cart',
    title: `Venta a ${venta.cliente}`,
    description: `$${venta.total.toFixed(2)} - ${venta.productos.length} productos`,
    timestamp: new Date(venta.fecha).toLocaleString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    }),
    status: 'success' as const
  }));

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
                  <span className="material-icons text-2xl text-primary">person</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                      Usuario
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-card leading-tight">
                    ¡Bienvenido, {usuario?.nombre}!
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
              <p className="text-muted font-medium">Panel de Usuario</p>
              <p className="text-sm text-muted/80">
                Gestión de ventas e inventario
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted font-medium">Estado de Sesión</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted/80">Usuario activo</span>
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

      {/* Navegación por pestañas */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-card/50 p-1 rounded-lg w-fit border border-app theme-transition">
          <button
            onClick={() => setActiveTab("resumen")}
            className={`px-4 py-2 rounded-md font-medium transition-all theme-transition ${
              activeTab === "resumen"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-muted hover:text-card hover:bg-card/30"
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab("ventas")}
            className={`px-4 py-2 rounded-md font-medium transition-all theme-transition ${
              activeTab === "ventas"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-muted hover:text-card hover:bg-card/30"
            }`}
          >
            Últimas Ventas
          </button>
          <button
            onClick={() => setActiveTab("acciones")}
            className={`px-4 py-2 rounded-md font-medium transition-all theme-transition ${
              activeTab === "acciones"
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "text-muted hover:text-card hover:bg-card/30"
            }`}
          >
            Acciones Rápidas
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-card rounded-xl shadow-app p-6 border border-app theme-transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full theme-transition ${
                card.color === 'primary' ? 'bg-primary/10' :
                card.color === 'success' ? 'bg-green-100' :
                card.color === 'warning' ? 'bg-amber-100' :
                'bg-blue-100'
              }`}>
                <span className={`material-icons ${
                  card.color === 'primary' ? 'text-primary' :
                  card.color === 'success' ? 'text-green-600' :
                  card.color === 'warning' ? 'text-amber-600' :
                  'text-blue-600'
                }`}>
                  {card.icon}
                </span>
              </div>
            </div>
            <h3 className="text-sm text-muted mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-card">{card.value}</p>
            {card.description && (
              <p className="text-xs text-muted mt-1">{card.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Contenido por pestañas */}
      {activeTab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl shadow-app p-6 border border-app theme-transition">
              <h2 className="text-xl font-semibold mb-6 text-card flex items-center gap-2">
                <span className="material-icons text-primary">insights</span>
                Resumen de Actividades
              </h2>
              
              {/* Actividades recientes resumidas */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted">
                    <span className="material-icons animate-spin text-4xl mb-2">refresh</span>
                    <p>Cargando datos...</p>
                  </div>
                ) : actividades.length > 0 ? (
                  actividades.map((actividad, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/10 border border-app/50 theme-transition">
                      <div className={`p-2 rounded-full bg-green-100 theme-transition`}>
                        <span className={`material-icons text-green-600`}>{actividad.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-card">{actividad.title}</p>
                        <p className="text-sm text-muted">{actividad.description}</p>
                      </div>
                      <span className="text-xs text-muted">{actividad.timestamp}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted">
                    <span className="material-icons text-4xl mb-2">receipt_long</span>
                    <p>No hay actividades recientes</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Acciones Rápidas */}
            <div className="bg-card rounded-xl shadow-app p-6 border border-app theme-transition">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-card">
                <span className="material-icons text-primary">flash_on</span>
                Acciones Rápidas
              </h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    onClick={action.onClick}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/10 transition-all group border border-transparent hover:border-app theme-transition"
                  >
                    <div className={`p-2 rounded-full theme-transition ${
                      action.color === 'primary' ? 'bg-primary/10' :
                      action.color === 'success' ? 'bg-green-100' :
                      'bg-blue-100'
                    }`}>
                      <span className={`material-icons text-sm ${
                        action.color === 'primary' ? 'text-primary' :
                        action.color === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {action.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-card text-sm">{action.title}</p>
                      <p className="text-xs text-muted">{action.description}</p>
                    </div>
                    <span className="material-icons text-muted text-sm group-hover:text-primary group-hover:translate-x-0.5 transition-all">
                      arrow_forward
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tips para usuarios */}
            <div className="bg-card rounded-xl shadow-app p-6 border border-app theme-transition">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-card">
                <span className="material-icons text-primary">tips_and_updates</span>
                Consejos Útiles
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="material-icons text-primary text-base mt-0.5">check_circle</span>
                  <p className="text-muted">Verifica el stock antes de registrar una venta</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-icons text-primary text-base mt-0.5">check_circle</span>
                  <p className="text-muted">Confirma los datos del cliente cuidadosamente</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-icons text-primary text-base mt-0.5">check_circle</span>
                  <p className="text-muted">Revisa el total antes de finalizar la venta</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ventas" && (
        <div className="bg-card rounded-xl shadow-app p-6 border border-app theme-transition">
          <h2 className="text-xl font-semibold mb-6 text-card flex items-center gap-2">
            <span className="material-icons text-primary">receipt_long</span>
            Últimas Ventas Registradas
          </h2>
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted">
                <span className="material-icons animate-spin text-4xl mb-2">refresh</span>
                <p>Cargando ventas...</p>
              </div>
            ) : ultimasVentas.length > 0 ? (
              ultimasVentas.map((venta) => (
                <div key={venta._id} className="flex items-center justify-between p-4 rounded-lg border border-app hover:bg-muted/5 transition-colors theme-transition">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <span className="material-icons text-primary">shopping_cart</span>
                    </div>
                    <div>
                      <p className="font-medium text-card">{venta.cliente}</p>
                      <p className="text-sm text-muted">
                        {new Date(venta.fecha).toLocaleString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-card">${venta.total.toFixed(2)}</p>
                    <p className="text-sm text-muted">{venta.productos.length} productos</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted">
                <span className="material-icons text-4xl mb-2">receipt_long</span>
                <p>No hay ventas registradas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "acciones" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <div
              key={index}
              onClick={action.onClick}
              className="bg-card rounded-xl shadow-app p-6 border border-app cursor-pointer hover:shadow-lg transition-all group theme-transition"
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full group-hover:scale-110 transition-transform theme-transition ${
                  action.color === 'primary' ? 'bg-primary/10' :
                  action.color === 'success' ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  <span className={`material-icons text-2xl ${
                    action.color === 'primary' ? 'text-primary' :
                    action.color === 'success' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {action.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted">{action.description}</p>
                </div>
                <span className="material-icons text-primary group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
