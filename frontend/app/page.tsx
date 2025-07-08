"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts/es6';
import { obtenerReporteGeneral } from "@/domain/reportes/reporte.service";

type Articulo = {
  _id: string
  nombre: string
  stock: number
  precioUnitario?: number
}

export default function DashboardPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [ventasCount, setVentasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ventasPorDia, setVentasPorDia] = useState<any[]>([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [reporte, setReporte] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState("ventasPorDia");

  const fetchArticulos = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/articulos?limit=10000")
      const data = await res.json()
      setArticulos(data.data || data)
    } catch (error) {
      console.error("Error fetching articulos:", error)
    }
  }

  const fetchVentasCount = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/ventas?limit=1")
      const data = await res.json()
      setVentasCount(data.total || 0)
    } catch (error) {
      console.error("Error fetching ventas count:", error)
      setVentasCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchVentasPorDia = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/reportes");
      const data = await res.json();
      setVentasPorDia(data.ventasPorPeriodo || []);
    } catch (error) {
      setVentasPorDia([]);
    }
  };

  const fetchReporteGeneral = async () => {
    try {
      const data = await obtenerReporteGeneral();
      setReporte(data);
      setTotalVentas(data.estadisticasGenerales.totalVentas || 0);
      setTotalIngresos(data.estadisticasGenerales.totalIngresos || 0);
      setVentasPorDia(data.ventasPorPeriodo || []);
    } catch (error) {
      setTotalVentas(0);
      setTotalIngresos(0);
      setVentasPorDia([]);
    }
  };

  useEffect(() => {
    fetchArticulos()
    fetchVentasCount()
    fetchVentasPorDia()
    fetchReporteGeneral();
  }, [])

  const valorInventario = articulos.reduce((acc, art) => acc + (art.stock * (art.precioUnitario || 0)), 0);

  return (
    <main className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">Dashboard</h1>
        <p className="text-gray-600">Resumen general del sistema de inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Artículos en Inventario */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Artículos en Inventario</p>
              <p className="text-3xl font-bold text-black mt-2">
                {loading ? "..." : articulos.length}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">inventory_2</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Total de productos registrados en el sistema
            </p>
          </div>
        </div>
        {/* Card de Valor del Inventario */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Valor del Inventario</p>
              <p className="text-3xl font-bold text-black mt-2">
                {loading ? "..." : `$${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">attach_money</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Suma total del valor de todos los productos en inventario
            </p>
          </div>
        </div>
        {/* Card de Ventas */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Ventas</p>
              <p className="text-3xl font-bold text-black mt-2">
                {loading ? "..." : `$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {loading ? "..." : `${totalVentas} ventas registradas`}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">point_of_sale</span>
          </div>
        </div>
      </div>

      {/* Gráfica de ventas por día */}
      <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 mb-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <select
            className="border border-gray-300 rounded px-3 py-1 text-black bg-white font-semibold"
            value={selectedChart}
            onChange={e => setSelectedChart(e.target.value)}
          >
            <option value="ventasPorDia">Ventas últimos 7 días</option>
            <option value="productosMasVendidos">Productos más vendidos</option>
            <option value="clientesMasFrecuentes">Clientes más frecuentes</option>
            <option value="reporteMensual">Ventas mensuales</option>
          </select>
        </div>
        {selectedChart === "ventasPorDia" && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventasPorDia} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" fill="#2563eb" name="Ventas" />
              <Bar dataKey="total" fill="#22c55e" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {selectedChart === "productosMasVendidos" && reporte && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reporte.productosMasVendidos} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidadVendida" fill="#2563eb" name="Cantidad Vendida" />
              <Bar dataKey="ingresosGenerados" fill="#22c55e" name="Ingresos ($)" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {selectedChart === "clientesMasFrecuentes" && reporte && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reporte.clientesMasFrecuentes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidadCompras" fill="#2563eb" name="Compras" />
              <Bar dataKey="totalGastado" fill="#22c55e" name="Gastado ($)" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {selectedChart === "reporteMensual" && reporte && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reporte.reporteMensual} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ventas" fill="#2563eb" name="Ventas" />
              <Bar dataKey="ingresos" fill="#22c55e" name="Ingresos ($)" />
              <Bar dataKey="productosVendidos" fill="#f59e42" name="Productos Vendidos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        {/* Card Inventario */}
        <a href="/inventario" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <span className="material-icons w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" style={{ fontSize: 40 }}>inventory_2</span>
          <span className="text-lg font-semibold text-black">Inventario</span>
        </a>
        {/* Card Categorías */}
        <a href="/categorias" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <svg className="w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M4 10h16" stroke="currentColor" strokeWidth="2" /></svg>
          <span className="text-lg font-semibold text-black">Categorías</span>
        </a>
        {/* Card Proveedores */}
        <a href="/proveedores" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <svg className="w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M16 13V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="2" />
            <rect x="16" y="13" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <circle cx="7.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="18.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-lg font-semibold text-black">Proveedores</span>
        </a>
        {/* Card Ventas */}
        <a href="/ventas" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <span className="material-icons w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" style={{ fontSize: 40 }}>point_of_sale</span>
          <span className="text-lg font-semibold text-black">Ventas</span>
        </a>
      </div>
    </main>
  );
}


