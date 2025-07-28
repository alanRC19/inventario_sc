"use client"
import { EstadisticasGenerales } from '@/domain/reportes/reporte.types'

interface StatsOverviewProps {
  stats: EstadisticasGenerales
  ventasHoy: number
  inventarioBajo: number
}

export default function StatsOverview({ stats, ventasHoy, inventarioBajo }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-app border border-app">
        <div className="flex items-center gap-2">
          <span className="material-icons text-2xl text-primary">paid</span>
          <div>
            <h3 className="text-lg font-semibold text-card">Ventas de Hoy</h3>
            <p className="text-muted">{ventasHoy} ventas</p>
            <p className="text-sm text-primary font-medium mt-1">
              ${stats.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-app border border-app">
        <div className="flex items-center gap-2">
          <span className="material-icons text-2xl text-orange-500">inventory_2</span>
          <div>
            <h3 className="text-lg font-semibold text-card">Stock Bajo</h3>
            <p className="text-muted">{inventarioBajo} productos</p>
            <p className="text-sm text-orange-500 font-medium mt-1">
              {stats.articulosStockBajo > 0 ? 'Requiere atención' : 'Stock saludable'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-app border border-app">
        <div className="flex items-center gap-2">
          <span className="material-icons text-2xl text-blue-500">analytics</span>
          <div>
            <h3 className="text-lg font-semibold text-card">Valor de Inventario</h3>
            <p className="text-muted">{stats.totalArticulos} artículos</p>
            <p className="text-sm text-blue-500 font-medium mt-1">
              ${stats.valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-app border border-app">
        <div className="flex items-center gap-2">
          <span className="material-icons text-2xl text-red-500">error_outline</span>
          <div>
            <h3 className="text-lg font-semibold text-card">Sin Stock</h3>
            <p className="text-muted">{stats.articulosSinStock} productos</p>
            <p className="text-sm text-red-500 font-medium mt-1">
              Necesitan reposición
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
