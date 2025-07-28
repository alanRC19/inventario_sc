"use client"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts/es6';
import { obtenerReporteGeneral } from "@/domain/reportes/reporte.service";
import { useEffect as useLayoutEffect } from "react";
import { jwtDecode } from "jwt-decode";

type Articulo = {
  _id: string
  nombre: string
  stock: number
  precioUnitario?: number
}

type UsuarioJWT = { nombre: string; rol: string; email: string; _id: string };

export default function DashboardPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [ventasCount, setVentasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ventasPorDia, setVentasPorDia] = useState<any[]>([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [reporte, setReporte] = useState<any>(null);
  const [selectedChart, setSelectedChart] = useState("ventasPorDia");
  const [usuario, setUsuario] = useState<UsuarioJWT | null>(null);

  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setUsuario(jwtDecode<UsuarioJWT>(token));
        } catch {
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
    }
  }, []);

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
  // KPIs adicionales
  const stockBajo = reporte?.estadisticasGenerales?.articulosStockBajo ?? 0;
  const sinStock = reporte?.estadisticasGenerales?.articulosSinStock ?? 0;
  const articulosNoVendidos = reporte?.articulosNoVendidos?.length ?? 0;
  const productosMasVendidos = reporte?.productosMasVendidos?.slice(0, 3) ?? [];
  const clientesFrecuentes = reporte?.clientesMasFrecuentes?.slice(0, 3) ?? [];

  return (
    <main className="p-8 w-full">
      {/* Mensaje de bienvenida */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-card">¡Bienvenido{usuario ? `, ${usuario.nombre}` : ""}!</h1>
          <p className="text-muted">Aquí puedes consultar el estado general de tu inventario y ventas.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
            {usuario?.rol === "admin" ? "Administrador" : "Usuario"}
          </span>
        </div>
      </div>

      {/* Alertas importantes */}
      {(stockBajo > 0 || sinStock > 0 || articulosNoVendidos > 0) && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockBajo > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow">
              <span className="material-icons text-yellow-600">warning</span>
              <div>
                <p className="font-semibold text-yellow-800">{stockBajo} producto(s) con stock bajo</p>
                <p className="text-sm text-yellow-700">Revisa tu inventario.</p>
              </div>
            </div>
          )}
          {sinStock > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow">
              <span className="material-icons text-red-600">error</span>
              <div>
                <p className="font-semibold text-red-800">{sinStock} producto(s) sin stock</p>
                <p className="text-sm text-red-700">Reabastece tu inventario.</p>
              </div>
            </div>
          )}
          {articulosNoVendidos > 0 && (
            <div className="flex items-center gap-3 bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg shadow">
              <span className="material-icons text-gray-600">remove_shopping_cart</span>
              <div>
                <p className="font-semibold text-gray-800">{articulosNoVendidos} artículos no vendidos</p>
                <p className="text-sm text-gray-700">Considera promociones o revisa su rotación.</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card de Artículos en Inventario */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Artículos en Inventario</p>
              <p className="text-3xl font-bold text-card mt-2">
                {loading ? "..." : articulos.length}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">inventory_2</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Total de productos registrados en el sistema
            </p>
          </div>
        </div>
        {/* Card de Valor del Inventario */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Valor del Inventario</p>
              <p className="text-3xl font-bold text-card mt-2">
                {loading ? "..." : `$${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">attach_money</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Suma total del valor de todos los productos en inventario
            </p>
          </div>
        </div>
        {/* Card de Ventas */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Ventas</p>
              <p className="text-3xl font-bold text-card mt-2">
                {loading ? "..." : `$${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              </p>
              <p className="text-sm text-muted mt-1">
                {loading ? "..." : `${totalVentas} ventas registradas`}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">point_of_sale</span>
          </div>
        </div>
      </div>

      {/* Gráfica de ventas por día */}
      <div className="bg-card rounded-xl shadow-app border border-app p-6 mb-8 mt-8">
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

      {/* Visualización rápida de productos y clientes destacados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-8">
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Top 3 productos más vendidos</h3>
          <ul className="space-y-2">
            {productosMasVendidos.length === 0 && <li className="text-gray-500">No hay datos suficientes.</li>}
            {productosMasVendidos.map((prod: any, i: number) => (
              <li key={prod.nombre} className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm font-bold">#{i+1}</span>
                <span className="font-medium text-card">{prod.nombre}</span>
                <span className="ml-auto text-green-700 font-semibold">{prod.cantidadVendida} ventas</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Top 3 clientes frecuentes</h3>
          <ul className="space-y-2">
            {clientesFrecuentes.length === 0 && <li className="text-gray-500">No hay datos suficientes.</li>}
            {clientesFrecuentes.map((cli: any, i: number) => (
              <li key={cli.nombre} className="flex items-center gap-3">
                <span className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm font-bold">#{i+1}</span>
                <span className="font-medium text-card">{cli.nombre}</span>
                <span className="ml-auto text-blue-700 font-semibold">{cli.cantidadCompras} compras</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        {/* Card Inventario */}
        <a href="/inventario" className="bg-card rounded-xl shadow-app p-8 flex flex-col items-center hover:shadow-lg transition group border border-app">
          <span className="material-icons w-10 h-10 mb-4 text-card group-hover:text-[#b91c1c]" style={{ fontSize: 40 }}>inventory_2</span>
          <span className="text-lg font-semibold text-card">Inventario</span>
        </a>
        {/* Card Categorías */}
        <a href="/categorias" className="bg-card rounded-xl shadow-app p-8 flex flex-col items-center hover:shadow-lg transition group border border-app">
          <svg className="w-10 h-10 mb-4 text-card group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M4 10h16" stroke="currentColor" strokeWidth="2" /></svg>
          <span className="text-lg font-semibold text-card">Categorías</span>
        </a>
        {/* Card Proveedores */}
        <a href="/proveedores" className="bg-card rounded-xl shadow-app p-8 flex flex-col items-center hover:shadow-lg transition group border border-app">
          <svg className="w-10 h-10 mb-4 text-card group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M16 13V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1" stroke="currentColor" strokeWidth="2" />
            <rect x="16" y="13" width="5" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <circle cx="7.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="18.5" cy="19" r="1.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-lg font-semibold text-card">Proveedores</span>
        </a>
        {/* Card Ventas */}
        <a href="/ventas" className="bg-card rounded-xl shadow-app p-8 flex flex-col items-center hover:shadow-lg transition group border border-app">
          <span className="material-icons w-10 h-10 mb-4 text-card group-hover:text-[#b91c1c]" style={{ fontSize: 40 }}>point_of_sale</span>
          <span className="text-lg font-semibold text-card">Ventas</span>
        </a>
      </div>
    </main>
  );
}


