"use client"
import { useEffect, useState } from "react"
import { ReporteDetallado, EstadisticasGenerales } from "@/domain/reportes/reporte.types"
import { obtenerReporteGeneral } from "@/domain/reportes/reporte.service"
import { DateRangeFilter } from "@/shared/components/DateRangeFilter"

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteDetallado | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  const fetchReporte = async () => {
    setLoading(true)
    try {
      const data = await obtenerReporteGeneral(fechaInicio || undefined, fechaFin || undefined)
      setReporte(data)
    } catch (error) {
      console.error("Error obteniendo reporte:", error)
      setReporte(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReporte()
  }, [fechaInicio, fechaFin])

  if (loading) {
    return (
      <main className="p-8 w-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!reporte) {
    return (
      <main className="p-8 w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-600">No se pudieron cargar los reportes.</p>
        </div>
      </main>
    )
  }

  const { estadisticasGenerales, ventasPorPeriodo, productosMasVendidos, clientesMasFrecuentes, reporteMensual } = reporte

  return (
    <main className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">Reportes</h1>
        <p className="text-gray-600">Análisis detallado de ventas e inventario</p>
      </div>

      {/* Filtros de fecha */}
      <div className="mb-6">
        <DateRangeFilter
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onFechaInicioChange={setFechaInicio}
          onFechaFinChange={setFechaFin}
          onLimpiarFiltros={() => {
            setFechaInicio("")
            setFechaFin("")
          }}
        />
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Total Ventas</p>
              <p className="text-3xl font-bold text-black mt-2">
                {estadisticasGenerales.totalVentas}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">point_of_sale</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Ventas registradas en el período
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Ingresos Totales</p>
              <p className="text-3xl font-bold text-black mt-2">
                ${estadisticasGenerales.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">attach_money</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Ingresos generados en el período
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Valor Inventario</p>
              <p className="text-3xl font-bold text-black mt-2">
                ${estadisticasGenerales.valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">inventory_2</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Valor total del inventario actual
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Artículos</p>
              <p className="text-3xl font-bold text-black mt-2">
                {estadisticasGenerales.totalArticulos}
              </p>
            </div>
            <span className="material-icons text-2xl text-black bg-transparent">category</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Total de productos en inventario
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Stock Bajo</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {estadisticasGenerales.articulosStockBajo}
              </p>
            </div>
            <span className="material-icons text-2xl text-yellow-600 bg-transparent">warning</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Productos con stock menor a 5 unidades
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">Sin Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {estadisticasGenerales.articulosSinStock}
              </p>
            </div>
            <span className="material-icons text-2xl text-red-600 bg-transparent">error</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Productos agotados
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ventas por Período */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas Últimos 7 Días</h3>
          <div className="space-y-3">
            {ventasPorPeriodo.map((periodo, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">
                    {new Date(periodo.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">{periodo.cantidad} ventas</p>
                </div>
                <p className="font-semibold text-green-600">
                  ${periodo.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {productosMasVendidos.map((producto, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{producto.nombre}</p>
                  <p className="text-sm text-gray-600">{producto.cantidadVendida} unidades</p>
                </div>
                <p className="font-semibold text-green-600">
                  ${producto.ingresosGenerados.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clientes Más Frecuentes */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6">
          <h3 className="text-lg font-semibold mb-4">Clientes Más Frecuentes</h3>
          <div className="space-y-3">
            {clientesMasFrecuentes.map((cliente, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{cliente.nombre}</p>
                  <p className="text-sm text-gray-600">{cliente.cantidadCompras} compras</p>
                </div>
                <p className="font-semibold text-blue-600">
                  ${cliente.totalGastado.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Reporte Mensual */}
        <div className="bg-white rounded-xl shadow border border-[#ececec] p-6">
          <h3 className="text-lg font-semibold mb-4">Reporte Mensual</h3>
          <div className="space-y-3">
            {reporteMensual.map((mes, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{mes.mes}</p>
                  <p className="text-sm text-gray-600">{mes.ventas} ventas, {mes.productosVendidos} productos</p>
                </div>
                <p className="font-semibold text-green-600">
                  ${mes.ingresos.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen de Alertas */}
      {(estadisticasGenerales.articulosStockBajo > 0 || estadisticasGenerales.articulosSinStock > 0) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Alertas de Inventario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estadisticasGenerales.articulosStockBajo > 0 && (
              <div className="flex items-center gap-3">
                <span className="material-icons text-yellow-600">warning</span>
                <div>
                  <p className="font-medium text-yellow-800">
                    {estadisticasGenerales.articulosStockBajo} productos con stock bajo
                  </p>
                  <p className="text-sm text-yellow-700">Revisar inventario</p>
                </div>
              </div>
            )}
            {estadisticasGenerales.articulosSinStock > 0 && (
              <div className="flex items-center gap-3">
                <span className="material-icons text-red-600">error</span>
                <div>
                  <p className="font-medium text-red-800">
                    {estadisticasGenerales.articulosSinStock} productos sin stock
                  </p>
                  <p className="text-sm text-red-700">Reabastecer urgentemente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
} 