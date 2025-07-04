"use client"
import { useEffect, useState } from "react"

type Articulo = {
  _id: string
  nombre: string
  stock: number
  precioUnitario?: number
}

export default function DashboardPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticulos = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/articulos?limit=10000")
      const data = await res.json()
      setArticulos(data.data || data)
    } catch (error) {
      console.error("Error fetching articulos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticulos()
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
              <p className="text-3xl font-bold text-black mt-2">0</p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">point_of_sale</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Total de ventas registradas
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {/* Card Inventario */}
        <a href="/inventario" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <svg className="w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7V6a2 2 0 012-2h14a2 2 0 012 2v1M3 7h18M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M9 10h6" /></svg>
          <span className="text-lg font-semibold text-black">Inventario</span>
        </a>
        {/* Card Categorías */}
        <a href="/categorias" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <svg className="w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span className="text-lg font-semibold text-black">Categorías</span>
        </a>
        {/* Card Proveedores */}
        <a href="/proveedores" className="bg-white rounded-xl shadow p-8 flex flex-col items-center hover:shadow-lg transition group border border-[#ececec]">
          <svg className="w-10 h-10 mb-4 text-black group-hover:text-[#b91c1c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-lg font-semibold text-black">Proveedores</span>
        </a>
      </div>
    </main>
  );
}


