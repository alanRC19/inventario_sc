"use client"
import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/shared/contexts/AuthContext"
import { MovimientoInventario, MovimientosPaginados, FiltrosMovimiento } from "@/domain/inventario/movimiento.types"
import { fetchMovimientos } from "@/domain/inventario/movimiento.service"
import { Table, TableColumn } from "@/shared/components/Table"
import { SearchBar } from "@/shared/components/SearchBar"

export default function HistorialMovimientosPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState<FiltrosMovimiento>({})
  const [searchTerm, setSearchTerm] = useState("")

  const fetchMovimientosData = useCallback(async (pageToFetch = page, currentFiltros = filtros) => {
    if (!user || authLoading) return
    
    setLoading(true)
    try {
      const res: MovimientosPaginados = await fetchMovimientos(pageToFetch, 10, currentFiltros)
      setMovimientos(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.pages || 1)
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }, [page, filtros, user, authLoading])

  useEffect(() => {
    // Solo cargar datos cuando el usuario esté autenticado y no esté cargando
    if (user && !authLoading) {
      fetchMovimientosData()
    }
  }, [fetchMovimientosData, user, authLoading])

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Verificando autenticación...</div>
      </div>
    )
  }

  // Redirigir al login si no hay usuario autenticado
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Debes iniciar sesión para ver esta página</div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'add_circle'
      case 'venta': return 'shopping_cart'
      case 'ajuste': return 'tune'
      case 'devolucion': return 'undo'
      default: return 'circle'
    }
  }

  const getBadgeClass = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800'
      case 'venta': return 'bg-blue-100 text-blue-800'
      case 'ajuste': return 'bg-yellow-100 text-yellow-800'
      case 'devolucion': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada'
      case 'venta': return 'Venta'
      case 'ajuste': return 'Ajuste'
      case 'devolucion': return 'Devolución'
      default: return tipo
    }
  }

  const handleFiltroTipo = (tipo: string) => {
    const newFiltros = { ...filtros }
    if (tipo === 'todos' || filtros.tipo === tipo) {
      delete newFiltros.tipo
    } else {
      newFiltros.tipo = tipo
    }
    setFiltros(newFiltros)
    setPage(1)
  }

  const columns: TableColumn[] = [
    { key: "fecha", label: "Fecha y Hora" },
    { key: "tipo", label: "Tipo" },
    { key: "articulo", label: "Artículo" },
    { key: "cantidad", label: "Cambio", align: "center" },
    { key: "usuario", label: "Usuario" },
    { key: "descripcion", label: "Descripción" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="material-icons text-4xl text-gray-600">history</span>
              Historial de Movimientos
            </h1>
            <p className="text-gray-600 mt-1">
              Registro completo de todos los movimientos de inventario
            </p>
          </div>
          
          <div className="flex gap-2">
            <a
              href="/inventario"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2"
            >
              <span className="material-icons">arrow_back</span>
              Volver a Inventario
            </a>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filtros por tipo */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center">Filtrar por tipo:</span>
            {[
              { key: 'todos', label: 'Todos', icon: 'all_inclusive' },
              { key: 'entrada', label: 'Entradas', icon: 'add_circle' },
              { key: 'venta', label: 'Ventas', icon: 'shopping_cart' },
              { key: 'ajuste', label: 'Ajustes', icon: 'tune' },
              { key: 'devolucion', label: 'Devoluciones', icon: 'undo' }
            ].map((tipo) => (
              <button
                key={tipo.key}
                onClick={() => handleFiltroTipo(tipo.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                  (tipo.key === 'todos' && !filtros.tipo) || filtros.tipo === tipo.key
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <span className="material-icons text-sm">{tipo.icon}</span>
                {tipo.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <span className="material-icons text-green-600">add_circle</span>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Movimientos</div>
              <div className="text-2xl font-bold text-gray-900">{total}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Movimientos Recientes
            </h2>
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por artículo o usuario..."
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={movimientos}
          renderRow={(movimiento: MovimientoInventario) => (
            <tr key={movimiento._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
              <td className="p-4">
                <div className="text-sm">
                  <div className="font-medium">{formatDate(movimiento.fecha).split(' ')[0]}</div>
                  <div className="text-gray-500">{formatDate(movimiento.fecha).split(' ')[1]}</div>
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-lg">
                    {getTipoIcon(movimiento.tipo)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(movimiento.tipo)}`}>
                    {getTipoLabel(movimiento.tipo)}
                  </span>
                </div>
              </td>
              <td className="p-4">
                <div className="font-medium">{movimiento.articuloNombre}</div>
              </td>
              <td className="p-4 text-center">
                <div className={`font-bold text-lg ${
                  movimiento.cantidad > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                </div>
                <div className="text-xs text-gray-500">
                  {movimiento.cantidadAnterior} → {movimiento.cantidadNueva}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-600">person</span>
                  <span className="font-medium">{movimiento.usuario}</span>
                </div>
              </td>
              <td className="p-4">
                <div className="text-sm text-gray-600">
                  {movimiento.descripcion || '-'}
                </div>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Controles de paginación */}
      <div className="flex justify-end items-center gap-4 mt-4 w-full">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center"
        >
          <span className="material-icons">chevron_left</span>
          Anterior
        </button>
        <span>Página {page} de {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center"
        >
          Siguiente
          <span className="material-icons">chevron_right</span>
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <span className="text-gray-500">Cargando movimientos...</span>
        </div>
      )}

      {!loading && movimientos.length === 0 && (
        <div className="text-center py-8">
          <span className="material-icons text-6xl text-gray-300 mb-4">history</span>
          <p className="text-gray-500 text-lg">No se encontraron movimientos</p>
          <p className="text-gray-400 text-sm">Los movimientos aparecerán aquí cuando realices operaciones de inventario</p>
        </div>
      )}
    </div>
  )
}