"use client"

import { useEffect, useState, useRef } from "react"
import type { Venta, VentasPaginadas, ProductoVenta } from "@/domain/ventas/venta.types"
import {
  fetchVentas,
  agregarVenta as agregarVentaService,
  eliminarVenta as eliminarVentaService,
  editarVenta as editarVentaService,
} from "@/domain/ventas/venta.service"
import { Table, type TableColumn } from "@/shared/components/Table"
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
  const [telefono, setTelefono] = useState("")
  const [enviarWhatsApp, setEnviarWhatsApp] = useState(false)
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [metodoPago, setMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
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

  // Funciones para validar progreso del formulario
  const isStep1Complete = () => cliente.trim() !== ""
  const isStep2Complete = () => productosSeleccionados.length > 0
  const isStep3Complete = () => Boolean(metodoPago)

  // Estados para edición
  const [editId, setEditId] = useState<string | null>(null)
  const [editCliente, setEditCliente] = useState("")
  const [editTelefono, setEditTelefono] = useState("")
  const [editProductosSeleccionados, setEditProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [editMetodoPago, setEditMetodoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo")
  const [showEditModal, setShowEditModal] = useState(false)

  // Estado para reenvío de WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappVentaId, setWhatsappVentaId] = useState<string | null>(null)
  const [whatsappTelefono, setWhatsappTelefono] = useState("")
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false)

  const fetchVentasData = async (pageToFetch = page, search = searchTerm, inicio = fechaInicio, fin = fechaFin) => {
    setLoading(true)
    try {
      const res: VentasPaginadas = await fetchVentas(pageToFetch, 6, search, inicio, fin)
      setVentas(res.data || [])
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || 0)
    } catch (e) {
      setVentas([])
      setTotalPages(1)
      setTotal(0)
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
    if (!articuloSeleccionado || !cantidad || Number.parseInt(cantidad) <= 0) return

    const articulo = articulosDisponibles.find((a) => a._id === articuloSeleccionado)
    if (!articulo) return

    const cantidadNum = Number.parseInt(cantidad)
    if (cantidadNum > articulo.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    const nuevoProducto: ProductoVenta = {
      articuloId: articulo._id,
      nombre: articulo.nombre,
      cantidad: cantidadNum,
      precioVenta: articulo.precioUnitario || 0,
      subtotal: (articulo.precioUnitario || 0) * cantidadNum,
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

    if (enviarWhatsApp && !telefono) {
      alert("Por favor ingresa un número de teléfono para enviar el ticket por WhatsApp")
      return
    }

    const total = calcularTotal()
    const resultado = await agregarVentaService({
      cliente,
      productos: productosSeleccionados,
      total,
      metodoPago,
      telefono,
      enviarWhatsApp,
    })

    // Mostrar resultado del envío de WhatsApp
    if (enviarWhatsApp && resultado.whatsappEnviado) {
      if (resultado.whatsappEnviado.success) {
        alert("✅ Venta creada y ticket enviado por WhatsApp exitosamente")
      } else {
        alert(`⚠️ Venta creada pero error al enviar WhatsApp: ${resultado.whatsappEnviado.mensaje}`)
      }
    }

    setCliente("")
    setTelefono("")
    setEnviarWhatsApp(false)
    setProductosSeleccionados([])
    setMetodoPago("efectivo")
    setShowModal(false)
    fetchVentasData()
  }

  const eliminarVenta = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta venta?")) return
    await eliminarVentaService(id)
    fetchVentasData()
  }

  const cancelarVenta = async (id: string, cliente: string, total: number) => {
    const motivo = prompt(
      `⚠️ CANCELAR VENTA\n\n` +
      `Cliente: ${cliente}\n` +
      `Total: $${total.toFixed(2)}\n\n` +
      `Esta acción devolverá el stock de todos los productos al inventario.\n\n` +
      `Ingresa el motivo de la cancelación (opcional):`,
      "Cancelación administrativa"
    )
    
    if (motivo === null) return // Usuario canceló
    
    try {
      const response = await fetch(`http://localhost:3001/api/ventas/${id}/cancelar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo })
      })
      
      const resultado = await response.json()
      
      if (resultado.success) {
        alert(
          `✅ VENTA CANCELADA EXITOSAMENTE\n\n` +
          `💰 Monto a devolver: $${resultado.montoDevuelto.toFixed(2)} (${resultado.metodoPago})\n` +
          `📦 Stock devuelto:\n${resultado.productosDevueltos.map(p => `  • ${p.cantidad}x ${p.nombre}`).join('\n')}\n\n` +
          `${resultado.mensaje}`
        )
        fetchVentasData()
      } else {
        alert(`❌ Error: ${resultado.error}`)
      }
    } catch (error) {
      console.error('Error al cancelar venta:', error)
      alert('❌ Error al cancelar la venta')
    }
  }

  const iniciarEdicion = (venta: Venta) => {
    setEditId(venta._id)
    setEditCliente(venta.cliente)
    setEditTelefono(venta.telefono || "")
    setEditProductosSeleccionados([...venta.productos])
    setEditMetodoPago(venta.metodoPago)
    setShowEditModal(true)
  }

  const calcularTotalEdit = () => {
    return editProductosSeleccionados.reduce((acc, producto) => acc + producto.subtotal, 0)
  }

  const agregarProductoEdit = () => {
    if (!articuloSeleccionado || !cantidad || Number.parseInt(cantidad) <= 0) return

    const articulo = articulosDisponibles.find((a) => a._id === articuloSeleccionado)
    if (!articulo) return

    const cantidadNum = Number.parseInt(cantidad)
    if (cantidadNum > articulo.stock) {
      alert("No hay suficiente stock disponible")
      return
    }

    const nuevoProducto: ProductoVenta = {
      articuloId: articulo._id,
      nombre: articulo.nombre,
      cantidad: cantidadNum,
      precioVenta: articulo.precioUnitario || 0,
      subtotal: (articulo.precioUnitario || 0) * cantidadNum,
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
      metodoPago: editMetodoPago,
      telefono: editTelefono,
    })

    setEditId(null)
    setEditCliente("")
    setEditTelefono("")
    setEditProductosSeleccionados([])
    setEditMetodoPago("efectivo")
    setShowEditModal(false)
    fetchVentasData()
  }

  const abrirModalWhatsApp = (ventaId: string, telefonoExistente?: string) => {
    setWhatsappVentaId(ventaId)
    setWhatsappTelefono(telefonoExistente || "")
    setShowWhatsAppModal(true)
  }

  const reenviarWhatsApp = async () => {
    if (!whatsappTelefono) {
      alert("Por favor ingresa un número de teléfono")
      return
    }

    setEnviandoWhatsApp(true)
    try {
      const response = await fetch(`http://localhost:3001/api/ventas/${whatsappVentaId}/reenviar-whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: whatsappTelefono }),
      })

      const resultado = await response.json()

      if (resultado.success) {
        alert("✅ Ticket enviado por WhatsApp exitosamente")
      } else {
        alert(`❌ Error al enviar WhatsApp: ${resultado.mensaje}`)
      }
    } catch (error) {
      alert("❌ Error al enviar ticket por WhatsApp")
    }

    setEnviandoWhatsApp(false)
    setShowWhatsAppModal(false)
    setWhatsappVentaId(null)
    setWhatsappTelefono("")
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
    { key: "telefono", label: "Teléfono" },
    { key: "productos", label: "Productos" },
    { key: "total", label: "Total" },
    { key: "metodoPago", label: "Método de Pago" },
    { key: "acciones", label: "Acciones" },
  ]

  return (
    <main className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">Ventas</h1>
        <p className="text-gray-600">Registro y consulta de ventas</p>
        {/* Resumen de ventas */}
        <div className="mt-4 bg-white rounded-lg shadow p-4 flex flex-col items-start">
          <span className="text-xl font-semibold text-black">
            Total vendido: ${ventas.reduce((acc, v) => acc + v.total, 0).toFixed(2)}
          </span>
          <span className="text-sm text-gray-600 mt-1">Total de ventas registradas: {ventas.length}</span>
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
            {searchTerm && <span className="bg-blue-100 px-2 py-1 rounded">Búsqueda: "{searchTerm}"</span>}
            {fechaInicio && (
              <span className="bg-blue-100 px-2 py-1 rounded">Desde: {new Date(fechaInicio).toLocaleDateString()}</span>
            )}
            {fechaFin && (
              <span className="bg-blue-100 px-2 py-1 rounded">Hasta: {new Date(fechaFin).toLocaleDateString()}</span>
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
              {new Date(venta.fecha).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </td>
            <td className="p-4">{venta.cliente}</td>
            <td className="p-4">
              {venta.telefono ? (
                <span className="text-green-600">{venta.telefono}</span>
              ) : (
                <span className="text-gray-400">Sin teléfono</span>
              )}
            </td>
            <td className="p-4">
              <div className="max-w-xs">
                {venta.productos.map((producto, index) => (
                  <div key={index} className="text-sm">
                    {producto.cantidad}x {producto.nombre}
                  </div>
                ))}
              </div>
            </td>
            <td className="p-4 font-semibold">${venta.total.toFixed(2)}</td>
            <td className="p-4">
              <span className="capitalize">{venta.metodoPago}</span>
            </td>
            <td className="p-4 flex gap-2">
              <button
                className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                title="Enviar por WhatsApp"
                onClick={() => abrirModalWhatsApp(venta._id, venta.telefono)}
              >
                <span className="material-icons text-base">whatsapp</span>
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" 
                title="Editar venta" 
                onClick={() => iniciarEdicion(venta)}
              >
                <span className="material-icons text-base">edit</span>
              </button>
              <button
                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                title="Cancelar venta y devolver stock"
                onClick={() => cancelarVenta(venta._id, venta.cliente, venta.total)}
              >
                <span className="material-icons text-base">cancel</span>
              </button>
            </td>
          </tr>
        )}
      />

      {/* controles de paginacion */}
      <div className="flex justify-end items-center gap-4 mt-4 w-full">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center"
        >
          <span className="material-icons">chevron_left</span>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center"
        >
          Siguiente
          <span className="material-icons">chevron_right</span>
        </button>
      </div>

      {/* Modal de nueva venta simple con guinda */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)} 
        title=""
        maxWidth="30rem"
      >
        <div className="bg-white">
          {/* Header con progreso */}
          <div className="bg-white border-b border-gray-200 p-4 text-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Nueva Venta</h2>
            
            {/* Progreso simple */}
            <div className="flex justify-center items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isStep1Complete() ? 'bg-red-800 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <span className="material-icons text-xs">person</span>
              </div>
              <div className="w-4 h-px bg-gray-300"></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isStep2Complete() ? 'bg-red-800 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <span className="material-icons text-xs">shopping_cart</span>
              </div>
              <div className="w-4 h-px bg-gray-300"></div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isStep3Complete() ? 'bg-red-800 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <span className="material-icons text-xs">payment</span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-4 space-y-4">
            
            {/* Cliente */}
            <div>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:border-red-800"
                placeholder="Nombre del cliente *"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:border-red-800"
                placeholder="Teléfono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
              
              <label className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={enviarWhatsApp}
                  onChange={(e) => setEnviarWhatsApp(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="material-icons text-green-600 text-sm">whatsapp</span>
              </label>
            </div>

            {/* Productos */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-2 mb-3">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:border-red-800"
                  value={articuloSeleccionado}
                  onChange={(e) => setArticuloSeleccionado(e.target.value)}
                  title="Seleccionar producto"
                >
                  <option value="">Seleccionar producto</option>
                  {articulosDisponibles.map((art) => (
                    <option key={art._id} value={art._id}>
                      {art.nombre} - ${art.precioUnitario?.toFixed(2)}
                    </option>
                  ))}
                </select>
                
                <input
                  className="w-16 px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:border-red-800 text-center"
                  placeholder="Cant"
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
                
                <button
                  onClick={agregarProducto}
                  disabled={!articuloSeleccionado || !cantidad}
                  className="px-3 py-2 bg-red-800 text-white rounded hover:bg-red-900 transition-colors disabled:opacity-50"
                >
                  <span className="material-icons text-sm">add</span>
                </button>
              </div>

              {/* Lista de productos */}
              {productosSeleccionados.length > 0 && (
                <div className="border border-gray-200 rounded max-h-32 overflow-y-auto">
                  {productosSeleccionados.map((producto, index) => (
                    <div key={index} className="px-3 py-2 border-b border-gray-100 last:border-b-0 flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{producto.nombre}</div>
                        <div className="text-xs text-gray-600">{producto.cantidad} × ${producto.precioVenta.toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-800">${producto.subtotal.toFixed(2)}</span>
                        <button onClick={() => removerProducto(index)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pago */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-3">
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-black bg-white focus:outline-none focus:border-red-800"
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value as "efectivo" | "tarjeta" | "transferencia")}
                  title="Seleccionar método de pago"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                
                {productosSeleccionados.length > 0 && (
                  <div className="bg-red-800 text-white px-4 py-2 rounded text-center">
                    <div className="text-xs opacity-90">Total</div>
                    <div className="text-lg font-bold">${calcularTotal().toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded hover:bg-gray-50"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </button>
            
            <button
              className="px-5 py-2 bg-red-800 text-white rounded hover:bg-red-900 disabled:opacity-50"
              onClick={crearVenta}
              disabled={!cliente || productosSeleccionados.length === 0}
            >
              {enviarWhatsApp ? 'Crear y Enviar' : 'Crear Venta'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de reenvío por WhatsApp */}
      <Modal open={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} title="Enviar Ticket por WhatsApp">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Teléfono</label>
            <input
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: +5215512345678 o 5512345678"
              value={whatsappTelefono}
              onChange={(e) => setWhatsappTelefono(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Incluye el código de país si es necesario (ej: +52 para México)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              onClick={() => setShowWhatsAppModal(false)}
              disabled={enviandoWhatsApp}
            >
              Cancelar
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              onClick={reenviarWhatsApp}
              disabled={!whatsappTelefono || enviandoWhatsApp}
            >
              {enviandoWhatsApp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">whatsapp</span>
                  Enviar Ticket
                </>
              )}
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
              onChange={(e) => setEditCliente(e.target.value)}
              autoFocus
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Número de teléfono"
              value={editTelefono}
              onChange={(e) => setEditTelefono(e.target.value)}
            />
          </div>

          {/* seleccionde productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
            <div className="flex gap-2">
              <select
                className="border border-[#ececec] p-2 rounded-lg flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={articuloSeleccionado}
                onChange={(e) => setArticuloSeleccionado(e.target.value)}
                title="Seleccionar producto para editar"
              >
                <option value="">Selecciona un producto</option>
                {articulosDisponibles.map((art) => (
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
                onChange={(e) => setCantidad(e.target.value)}
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
                    <button onClick={() => removerProductoEdit(index)} className="text-red-600 hover:text-red-800">
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
              onChange={(e) => setEditMetodoPago(e.target.value as "efectivo" | "tarjeta" | "transferencia")}
              title="Seleccionar método de pago"
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
