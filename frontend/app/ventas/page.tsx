"use client"
import { useEffect, useState, useRef } from "react"
import { Venta, VentasPaginadas, ProductoVenta } from "@/domain/ventas/venta.types"
import { fetchVentas, agregarVenta as agregarVentaService, eliminarVenta as eliminarVentaService, editarVenta as editarVentaService, VentasPaginadasConTotal } from "@/domain/ventas/venta.service"
import { Table, TableColumn } from "@/shared/components/Table"
import { Modal } from "@/shared/components/Modal"
import { SearchBar } from "@/shared/components/SearchBar"
import { DateRangeFilter } from "@/shared/components/DateRangeFilter"

type Articulo = {
  _id: string
  nombre: string
  stock: number
  precioUnitario?: number
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cliente, setCliente] = useState("")
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [showModal, setShowModal] = useState(false)
  const [modalMounted, setModalMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [articulosDisponibles, setArticulosDisponibles] = useState<Articulo[]>([])
  const [articuloSeleccionado, setArticuloSeleccionado] = useState("")
  const [cantidad, setCantidad] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  
  // Estados para edición
  const [editId, setEditId] = useState<string | null>(null)
  const [editCliente, setEditCliente] = useState("")
  const [editProductosSeleccionados, setEditProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [editMetodoPago, setEditMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [showEditModal, setShowEditModal] = useState(false)
  const [totalVendido, setTotalVendido] = useState(0)

  const fetchVentasData = async (pageToFetch = page, search = searchTerm, inicio = fechaInicio, fin = fechaFin) => {
    setLoading(true)
    try {
      const res: VentasPaginadasConTotal = await fetchVentas(pageToFetch, 6, search, inicio, fin)
      setVentas(res.data || [])
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || 0)
      setTotalVendido(res.totalVendido || 0)
    } catch (e) {
      setVentas([])
      setTotalPages(1)
      setTotal(0)
      setTotalVendido(0)
    }
    setLoading(false)
  }

  const fetchArticulosDisponibles = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/articulos?limit=1000")
      const data = await res.json()
      //solo mostrar stock disponible
      const articulosConStock = (data.data || data).filter((art: Articulo) => art.stock > 0)
      setArticulosDisponibles(articulosConStock)
    } catch (error) {
      console.error("Error fetching articulos:", error)
      setArticulosDisponibles([])
    }
  }

  const agregarProducto = () => {
    if (!articuloSeleccionado || !cantidad || parseInt(cantidad) <= 0) return

    const articulo = articulosDisponibles.find(a => a._id === articuloSeleccionado)
    if (!articulo) return

    const cantidadNum = parseInt(cantidad)
    if (cantidadNum > articulo.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    const nuevoProducto: ProductoVenta = {
      articuloId: articulo._id,
      nombre: articulo.nombre,
      cantidad: cantidadNum,
      precioUnitario: articulo.precioUnitario || 0,
      subtotal: (articulo.precioUnitario || 0) * cantidadNum,
      proveedor: (articulo as any).proveedor || undefined
    }

    setProductosSeleccionados([...productosSeleccionados, nuevoProducto])
    setArticuloSeleccionado("")
    setCantidad("")
  }

  const removerProducto = (index: number) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index))
  }

  const calcularTotal = () => {
    return productosSeleccionados.reduce((acc, producto) => acc + producto.subtotal, 0)
  }

  const crearVenta = async () => {
    if (!cliente || productosSeleccionados.length === 0) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    const total = calcularTotal()
    await agregarVentaService({
      cliente,
      productos: productosSeleccionados,
      total,
      metodoPago
    })

    setCliente("")
    setProductosSeleccionados([])
    setMetodoPago('efectivo')
    setShowModal(false)
    fetchVentasData()
  }

  const eliminarVenta = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta venta?")) return
    await eliminarVentaService(id)
    fetchVentasData()
  }

  const iniciarEdicion = (venta: Venta) => {
    setEditId(venta._id)
    setEditCliente(venta.cliente)
    setEditProductosSeleccionados([...venta.productos])
    setEditMetodoPago(venta.metodoPago)
    setShowEditModal(true)
  }

  const calcularTotalEdit = () => {
    return editProductosSeleccionados.reduce((acc, producto) => acc + producto.subtotal, 0)
  }

  const agregarProductoEdit = () => {
    if (!articuloSeleccionado || !cantidad || parseInt(cantidad) <= 0) return

    const articulo = articulosDisponibles.find(a => a._id === articuloSeleccionado)
    if (!articulo) return

    const cantidadNum = parseInt(cantidad)
    if (cantidadNum > articulo.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    const nuevoProducto: ProductoVenta = {
      articuloId: articulo._id,
      nombre: articulo.nombre,
      cantidad: cantidadNum,
      precioUnitario: articulo.precioUnitario || 0,
      subtotal: (articulo.precioUnitario || 0) * cantidadNum,
      proveedor: (articulo as any).proveedor || undefined
    }

    setEditProductosSeleccionados([...editProductosSeleccionados, nuevoProducto])
    setArticuloSeleccionado("")
    setCantidad("")
  }

  const removerProductoEdit = (index: number) => {
    setEditProductosSeleccionados(editProductosSeleccionados.filter((_, i) => i !== index))
  }

  const guardarEdicion = async () => {
    if (!editCliente || editProductosSeleccionados.length === 0) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    const total = calcularTotalEdit()
    await editarVentaService(editId!, {
      cliente: editCliente,
      productos: editProductosSeleccionados,
      total,
      metodoPago: editMetodoPago
    })

    setEditId(null)
    setEditCliente("")
    setEditProductosSeleccionados([])
    setEditMetodoPago('efectivo')
    setShowEditModal(false)
    fetchVentasData()
  }

  // Animación de entrada del modal
  useEffect(() => {
    if (showModal) {
      fetchArticulosDisponibles()
      setTimeout(() => setModalMounted(true), 10)
    } else {
      setModalMounted(false)
    }
  }, [showModal])

  useEffect(() => {
    fetchVentasData(page, searchTerm, fechaInicio, fechaFin)
  }, [page, searchTerm, fechaInicio, fechaFin])

  // columnas de la tabla
  const columns: TableColumn[] = [
    { key: "fecha", label: "Fecha" },
    { key: "cliente", label: "Cliente" },
    { key: "productos", label: "Productos" },
    { key: "total", label: "Total" },
    { key: "metodoPago", label: "Método de Pago" },
    { key: "acciones", label: "Acciones" },
  ]

  return (
    <main className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-card">Ventas</h1>
        <p className="text-muted">Registro y consulta de ventas</p>
        {/* Resumen de ventas */}
        <div className="mt-4 bg-card rounded-lg shadow-app p-4 flex flex-col items-start border border-app">
          <span className="text-xl font-semibold text-card">
            Total vendido: ${totalVendido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-sm text-muted mt-1">
            Total de ventas registradas: {total}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <SearchBar
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ventas..."
            className="w-64"
          />
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
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
        >
          <span className="material-icons">add</span>
          Nueva Venta
        </button>
      </div>

      {/* indicador para filtros activos */}
      {(searchTerm || fechaInicio || fechaFin) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span className="material-icons text-base">filter_list</span>
            <span className="font-medium">Filtros activos:</span>
            {searchTerm && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Búsqueda: "{searchTerm}"
              </span>
            )}
            {fechaInicio && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Desde: {new Date(fechaInicio).toLocaleDateString()}
              </span>
            )}
            {fechaFin && (
              <span className="bg-blue-100 px-2 py-1 rounded">
                Hasta: {new Date(fechaFin).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm("")
                setFechaInicio("")
                setFechaFin("")
              }}
              className="ml-auto text-blue-600 hover:text-blue-800"
            >
              Limpiar todos
            </button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={ventas || []}
        renderRow={(venta) => (
          <tr key={venta._id} className="border-b border-[#ececec] hover:bg-[#f3f4f6] transition">
            <td className="p-4">
              {new Date(venta.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </td>
            <td className="p-4">{venta.cliente}</td>
            <td className="p-4">
              <div className="max-w-xs">
                {venta.productos.map((producto, index) => (
                  <div key={index} className="text-sm">
                    {producto.cantidad}x {producto.nombre}
                  </div>
                ))}
              </div>
            </td>
            <td className="p-4 font-semibold">
              ${venta.total.toFixed(2)}
            </td>
            <td className="p-4">
              <span className="capitalize">{venta.metodoPago}</span>
            </td>
                              <td className="p-4 flex gap-2">
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6]"
                      title="Editar"
                      onClick={() => iniciarEdicion(venta)}
                    >
                      <span className="material-icons text-base">edit</span>
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6] text-red-600"
                      title="Eliminar"
                      onClick={() => eliminarVenta(venta._id)}
                    >
                      <span className="material-icons text-base">delete</span>
                    </button>
                  </td>
          </tr>
        )}
      />

      {/* controles de paginacion */}
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

      {/* modal o frame de nueva venta */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nueva Venta">
        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Nombre del cliente"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              autoFocus
            />
          </div>

          {/* seleccion de productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
            <div className="flex gap-2">
              <select
                className="border border-[#ececec] p-2 rounded-lg flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={articuloSeleccionado}
                onChange={e => setArticuloSeleccionado(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {articulosDisponibles.map(art => (
                  <option key={art._id} value={art._id}>
                    {art.nombre} - Stock: {art.stock} - ${art.precioUnitario?.toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                className="border border-[#ececec] p-2 rounded-lg w-20 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Cant."
                type="number"
                min="1"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
              />
              <button
                onClick={agregarProducto}
                disabled={!articuloSeleccionado || !cantidad}
                className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                <span className="material-icons text-sm">add</span>
              </button>
            </div>
          </div>

          {/* lista de productos seleccionados */}
          {productosSeleccionados.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Productos Seleccionados</label>
              <div className="border border-[#ececec] rounded-lg p-2 max-h-32 overflow-y-auto">
                {productosSeleccionados.map((producto, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm">
                      {producto.cantidad}x {producto.nombre} - ${producto.subtotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removerProducto(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <span className="material-icons text-sm">remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* tipo de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              value={metodoPago}
              onChange={e => setMetodoPago(e.target.value as any)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          {/* total */}
          {productosSeleccionados.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${calcularTotal().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* botones */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
              onClick={crearVenta}
              disabled={!cliente || productosSeleccionados.length === 0}
            >
              Crear Venta
            </button>
          </div>
        </div>
      </Modal>

      {/* modal o frame de editar venta */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Venta">
        <div className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Nombre del cliente"
              value={editCliente}
              onChange={e => setEditCliente(e.target.value)}
              autoFocus
            />
          </div>

          {/* seleccionde productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
            <div className="flex gap-2">
              <select
                className="border border-[#ececec] p-2 rounded-lg flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={articuloSeleccionado}
                onChange={e => setArticuloSeleccionado(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {articulosDisponibles.map(art => (
                  <option key={art._id} value={art._id}>
                    {art.nombre} - Stock: {art.stock} - ${art.precioUnitario?.toFixed(2)}
                  </option>
                ))}
              </select>
              <input
                className="border border-[#ececec] p-2 rounded-lg w-20 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Cant."
                type="number"
                min="1"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
              />
              <button
                onClick={agregarProductoEdit}
                disabled={!articuloSeleccionado || !cantidad}
                className="bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                <span className="material-icons text-sm">add</span>
              </button>
            </div>
          </div>

          {/* lista de productos seleccionados */}
          {editProductosSeleccionados.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Productos Seleccionados</label>
              <div className="border border-[#ececec] rounded-lg p-2 max-h-32 overflow-y-auto">
                {editProductosSeleccionados.map((producto, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <span className="text-sm">
                      {producto.cantidad}x {producto.nombre} - ${producto.subtotal.toFixed(2)}
                    </span>
                    <button
                      onClick={() => removerProductoEdit(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <span className="material-icons text-sm">remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* tipo de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
            <select
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              value={editMetodoPago}
              onChange={e => setEditMetodoPago(e.target.value as any)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          {/* total */}
          {editProductosSeleccionados.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${calcularTotalEdit().toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* botones */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </button>
            <button
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
              onClick={guardarEdicion}
              disabled={!editCliente || editProductosSeleccionados.length === 0}
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
} 