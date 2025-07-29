"use client"
import { useEffect, useState, useRef } from "react"
import { Venta, VentasPaginadas, ProductoVenta } from "@/domain/ventas/venta.types"
import { fetchVentas, agregarVenta as agregarVentaService, eliminarVenta as eliminarVentaService, editarVenta as editarVentaService, cancelarVenta as cancelarVentaService, VentasPaginadasConTotal } from "@/domain/ventas/venta.service"
import { Table, TableColumn } from "@/shared/components/Table"
import { Modal } from "@/shared/components/Modal"
import { SearchBar } from "@/shared/components/SearchBar"
import { DateRangeFilter } from "@/shared/components/DateRangeFilter"
import { VentaStatusBadge } from "@/shared/components/VentaStatusBadge"
import { WhatsAppManager } from "@/shared/components/WhatsAppManager"
import { useAuth } from "@/shared/utils/useAuth"

type Articulo = {
  _id: string
  nombre: string
  stock: number
  precioUnitario?: number
}

export default function VentasPage() {
  const { usuario } = useAuth()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [cliente, setCliente] = useState("")
  const [telefono, setTelefono] = useState("") // Nuevo estado para teléfono
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [showModal, setShowModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false) // Nuevo estado para modal de WhatsApp
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
  const [editTelefono, setEditTelefono] = useState("") // Nuevo estado para teléfono
  const [editProductosSeleccionados, setEditProductosSeleccionados] = useState<ProductoVenta[]>([])
  const [editMetodoPago, setEditMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo')
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Estados para modal de WhatsApp
  const [showWhatsAppTicketModal, setShowWhatsAppTicketModal] = useState(false)
  const [selectedVentaForWhatsApp, setSelectedVentaForWhatsApp] = useState<Venta | null>(null)
  const [whatsappTelefono, setWhatsappTelefono] = useState("")
  const [totalVendido, setTotalVendido] = useState(0)

  // Verificar si el usuario es admin
  const isAdmin = usuario?.rol === 'admin'

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
    const nuevaVenta = await agregarVentaService({
      cliente,
      productos: productosSeleccionados,
      total,
      metodoPago,
      telefono: telefono || null
    })

    // Preguntar si desea enviar por WhatsApp (solo si hay teléfono)
    if (telefono && nuevaVenta) {
      const enviarWhatsApp = confirm(`📱 ¿Deseas enviar el ticket de compra por WhatsApp?\n\n👤 Cliente: ${cliente}\n📞 Número destino: ${telefono}\n\n✅ El ticket será enviado DESDE tu WhatsApp de negocio HACIA el cliente.\n\n⚠️ Asegúrate de que WhatsApp Web esté conectado.`)
      if (enviarWhatsApp) {
        await enviarTicketWhatsApp(nuevaVenta, telefono)
      }
    }

    setCliente("")
    setTelefono("")
    setProductosSeleccionados([])
    setMetodoPago('efectivo')
    setShowModal(false)
    fetchVentasData()
  }

  const enviarTicketWhatsApp = async (venta: Venta, numeroTelefono: string) => {
    try {
      const ticketData = {
        cliente: venta.cliente,
        productos: venta.productos,
        total: venta.total,
        metodoPago: venta.metodoPago,
        fecha: venta.fecha
      }

      const response = await fetch('http://localhost:3001/api/whatsapp/send-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: numeroTelefono,
          ticketData
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert("✅ Ticket enviado por WhatsApp correctamente")
      } else {
        let errorMessage = "❌ Error enviando ticket por WhatsApp"
        
        if (result.message) {
          if (result.message.includes('WhatsApp no está conectado')) {
            errorMessage += "\n\n🔗 WhatsApp Web no está conectado"
            errorMessage += "\n\n📋 Para solucionarlo:"
            errorMessage += "\n1. Ve a la configuración de WhatsApp (botón verde)"
            errorMessage += "\n2. Escanea el código QR con el WhatsApp de tu NEGOCIO"
            errorMessage += "\n3. Una vez conectado, intenta enviar el ticket nuevamente"
            errorMessage += "\n\n💡 Recuerda: Tu WhatsApp de negocio envía, el del cliente recibe"
          } else if (result.message.includes('no está registrado')) {
            errorMessage += `\n\n📱 El número ${numeroTelefono} no tiene WhatsApp`
            errorMessage += "\n\n✅ Verifica que:"
            errorMessage += "\n• El número esté correcto (incluye código de país si es necesario)"
            errorMessage += "\n• El cliente tenga WhatsApp instalado"
            errorMessage += "\n• El número esté activo en WhatsApp"
          } else {
            errorMessage += `\n\nDetalle: ${result.message}`
          }
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error enviando ticket por WhatsApp:', error)
      alert("❌ Error conectando con WhatsApp.\n\nPosibles causas:\n• El servidor de WhatsApp no está disponible\n• La sesión de WhatsApp ha expirado\n• Problemas de conexión\n\nIntenta abrir la configuración de WhatsApp y verificar el estado de la conexión.")
    }
  }

  // Nueva función para abrir modal de WhatsApp desde la tabla
  const abrirModalWhatsApp = (venta: Venta) => {
    setSelectedVentaForWhatsApp(venta)
    setWhatsappTelefono(venta.telefono || "") // Pre-cargar teléfono si existe
    setShowWhatsAppTicketModal(true)
  }

  // Función para enviar ticket desde el modal
  const enviarTicketDesdeModal = async () => {
    if (!selectedVentaForWhatsApp || !whatsappTelefono.trim()) {
      alert("Por favor, introduce un número de teléfono válido")
      return
    }

    try {
      await enviarTicketWhatsApp(selectedVentaForWhatsApp, whatsappTelefono.trim())
      
      // Si el envío fue exitoso y la venta no tenía teléfono, actualizarla
      if (!selectedVentaForWhatsApp.telefono) {
        await editarVentaService(selectedVentaForWhatsApp._id, {
          cliente: selectedVentaForWhatsApp.cliente,
          telefono: whatsappTelefono.trim(),
          productos: selectedVentaForWhatsApp.productos,
          metodoPago: selectedVentaForWhatsApp.metodoPago,
          total: selectedVentaForWhatsApp.total
        })
        await fetchVentasData() // Refrescar datos
      }
      
      setShowWhatsAppTicketModal(false)
      setSelectedVentaForWhatsApp(null)
      setWhatsappTelefono("")
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const eliminarVenta = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta venta?")) return
    await eliminarVentaService(id)
    fetchVentasData()
  }

  const cancelarVenta = async (id: string) => {
    if (!confirm("¿Seguro que deseas cancelar esta venta? Esta acción restaurará el stock de los productos.")) return
    try {
      console.log("Cancelando venta con ID:", id)
      
      // Encontrar la venta antes de cancelarla
      const ventaCancelada = ventas.find(v => v._id === id)
      if (!ventaCancelada) {
        alert("No se pudo encontrar la venta")
        return
      }
      
      // Solo restar si la venta no estaba ya cancelada
      const debeRestarDelTotal = ventaCancelada.estado !== 'cancelada'
      
      await cancelarVentaService(id)
      console.log("Venta cancelada en el backend, actualizando UI...")
      
      // Actualizar estado local inmediatamente
      setVentas(prevVentas => 
        prevVentas.map(venta => 
          venta._id === id 
            ? { ...venta, estado: 'cancelada', fechaCancelacion: new Date().toISOString() }
            : venta
        )
      )
      
      // Actualizar el total vendido restando esta venta solo si no estaba ya cancelada
      if (debeRestarDelTotal) {
        console.log("Restando del total:", ventaCancelada.total)
        setTotalVendido(prev => prev - ventaCancelada.total)
      } else {
        console.log("Venta ya estaba cancelada, no se resta del total")
      }
      
      alert("Venta cancelada correctamente")
      console.log("Cancelación completada")
    } catch (error) {
      console.error("Error al cancelar venta:", error)
      alert("Error al cancelar la venta")
    }
  }

  const iniciarEdicion = (venta: Venta) => {
    setEditId(venta._id)
    setEditCliente(venta.cliente)
    setEditTelefono(venta.telefono || "") // Cargar teléfono existente
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
      telefono: editTelefono || undefined, // Incluir teléfono
      productos: editProductosSeleccionados,
      total,
      metodoPago: editMetodoPago
    })

    setEditId(null)
    setEditCliente("")
    setEditTelefono("") // Limpiar teléfono
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
    { key: "estado", label: "Estado" },
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            title="Configurar WhatsApp"
          >
            <span className="material-icons">phone_android</span>
            WhatsApp
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition flex items-center gap-2"
          >
            <span className="material-icons">add</span>
            Nueva Venta
          </button>
        </div>
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
          <tr key={venta._id} className={`border-b border-[#ececec] hover:bg-[#f3f4f6] transition ${
            venta.estado === 'cancelada' ? 'bg-red-50 opacity-70' : ''
          }`}>
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
            <td className="p-4">
              <VentaStatusBadge estado={venta.estado} />
            </td>
            <td className="p-4 flex gap-2">
              {/* Botón Editar - disponible para todos */}
              <button
                className={`p-1 rounded hover:bg-[#f3f4f6] ${
                  venta.estado === 'cancelada' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Editar"
                onClick={() => venta.estado !== 'cancelada' && iniciarEdicion(venta)}
                disabled={venta.estado === 'cancelada'}
              >
                <span className="material-icons text-base">edit</span>
              </button>
              
              {/* Botón WhatsApp */}
              <button
                className={`p-1 rounded hover:bg-[#f3f4f6] text-green-600 ${
                  venta.estado === 'cancelada' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Enviar por WhatsApp"
                onClick={() => venta.estado !== 'cancelada' && abrirModalWhatsApp(venta)}
                disabled={venta.estado === 'cancelada'}
              >
                <span className="material-icons text-base">message</span>
              </button>
              
              {/* Botón Eliminar - solo para administradores */}
              {isAdmin && (
                <button
                  className={`p-1 rounded hover:bg-[#f3f4f6] text-red-600 ${
                    venta.estado === 'cancelada' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Eliminar"
                  onClick={() => venta.estado !== 'cancelada' && eliminarVenta(venta._id)}
                  disabled={venta.estado === 'cancelada'}
                >
                  <span className="material-icons text-base">delete</span>
                </button>
              )}
              
              {/* Botón Cancelar - solo para administradores */}
              {isAdmin && venta.estado === 'completada' && (
                <button
                  className="p-1 rounded hover:bg-[#f3f4f6] text-orange-600"
                  title="Cancelar venta"
                  onClick={() => cancelarVenta(venta._id)}
                >
                  <span className="material-icons text-base">cancel</span>
                </button>
              )}
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="" maxWidth="650px">
        <div className="relative flex flex-col h-[65vh]">
          {/* Header del modal con progreso - FIJO */}
          <div className="pb-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <div className="p-1.5 bg-red-800/10 rounded-md">
                    <span className="material-icons text-red-800 text-base">shopping_cart</span>
                  </div>
                  Nueva Venta
                </h2>
                <p className="text-gray-600 text-xs mt-0.5">Registra una nueva venta en el sistema</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="material-icons text-gray-500 text-lg">close</span>
              </button>
            </div>
            
            {/* Indicador de progreso */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  cliente ? 'bg-green-500 text-white' : 'bg-red-800 text-white'
                }`}>
                  {cliente ? <span className="material-icons text-xs">check</span> : '1'}
                </div>
                <span className={`text-xs font-medium ${cliente ? 'text-green-600' : 'text-red-800'}`}>
                  Cliente
                </span>
              </div>
              
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                cliente ? 'bg-green-200' : 'bg-gray-200'
              }`}>
                <div className={`h-full rounded-full transition-all duration-300 ${
                  cliente ? 'bg-green-500 w-full' : 'bg-red-800 w-0'
                }`}></div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  productosSeleccionados.length > 0 ? 'bg-green-500 text-white' : 
                  cliente ? 'bg-red-800 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  {productosSeleccionados.length > 0 ? <span className="material-icons text-xs">check</span> : '2'}
                </div>
                <span className={`text-xs font-medium ${
                  productosSeleccionados.length > 0 ? 'text-green-600' : 
                  cliente ? 'text-red-800' : 'text-gray-500'
                }`}>
                  Productos
                </span>
              </div>
              
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                productosSeleccionados.length > 0 ? 'bg-green-200' : 'bg-gray-200'
              }`}>
                <div className={`h-full rounded-full transition-all duration-300 ${
                  productosSeleccionados.length > 0 ? 'bg-green-500 w-full' : 
                  cliente ? 'bg-red-800 w-0' : 'bg-gray-300 w-0'
                }`}></div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  cliente && productosSeleccionados.length > 0 ? 'bg-red-800 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  3
                </div>
                <span className={`text-xs font-medium ${
                  cliente && productosSeleccionados.length > 0 ? 'text-red-800' : 'text-gray-500'
                }`}>
                  Finalizar
                </span>
              </div>
            </div>
          </div>

          {/* Contenido del modal - SCROLLEABLE */}
          <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-2 max-h-80">
            {/* Cliente y Teléfono en la misma fila */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <span className="material-icons text-sm text-red-800">person</span>
                Información del Cliente
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-500 text-xs"
                  placeholder="Nombre del cliente"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  autoFocus
                />
                <input
                  className="px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-500 text-xs"
                  placeholder="Teléfono del cliente (para WhatsApp)"
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  title="Número de WhatsApp del cliente para enviar el ticket"
                />
              </div>
              
              {/* Nota explicativa sobre WhatsApp */}
              {telefono && (
                <div className="bg-green-50 border border-green-200 rounded-md p-2 mt-1">
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <span className="material-icons text-xs">info</span>
                    El ticket se enviará por WhatsApp al número: {telefono}
                  </p>
                </div>
              )}
            </div>

            {/* Selección de productos y método de pago */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <span className="material-icons text-sm text-red-800">inventory_2</span>
                Producto y Pago
              </label>
              <div className="grid grid-cols-12 gap-1.5 mb-2">
                <select
                  className="col-span-6 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all bg-white text-gray-800 text-xs"
                  value={articuloSeleccionado}
                  onChange={e => setArticuloSeleccionado(e.target.value)}
                  title="Seleccionar producto"
                >
                  <option value="">Seleccionar...</option>
                  {articulosDisponibles.map(art => (
                    <option key={art._id} value={art._id}>
                      {art.nombre} - ${art.precioUnitario?.toFixed(2)}
                    </option>
                  ))}
                </select>
                <input
                  className="col-span-2 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all bg-white text-gray-800 placeholder-gray-500 text-xs"
                  placeholder="Cant."
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                />
                <select
                  className="col-span-3 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all bg-white text-gray-800 text-xs"
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value as 'efectivo' | 'tarjeta' | 'transferencia')}
                  title="Método de pago"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <button
                  onClick={agregarProducto}
                  disabled={!articuloSeleccionado || !cantidad}
                  className="col-span-1 bg-red-800 hover:bg-red-900 disabled:bg-gray-300 text-white py-1.5 rounded-md transition-all flex items-center justify-center shadow-md disabled:shadow-none"
                >
                  <span className="material-icons text-xs">add</span>
                </button>
              </div>
            </div>

            {/* Lista de productos seleccionados con scroll */}
            {productosSeleccionados.length > 0 && (
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="material-icons text-sm text-red-800">shopping_bag</span>
                  Productos ({productosSeleccionados.length})
                </label>
                <div className="border border-gray-200 rounded-md bg-gray-50 max-h-28 overflow-y-auto">
                  <div className="p-1.5 space-y-1">
                    {productosSeleccionados.map((producto, index) => (
                      <div key={index} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded-md shadow-sm">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="material-icons text-red-800 text-xs">inventory_2</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate text-xs leading-tight">{producto.nombre}</p>
                            <p className="text-xs text-gray-600 leading-tight">
                              {producto.cantidad} x ${producto.precioUnitario.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-semibold text-gray-800 text-xs">
                            ${producto.subtotal.toFixed(2)}
                          </span>
                          <button
                            onClick={() => removerProducto(index)}
                            className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <span className="material-icons text-xs">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con total y botones - FIJO */}
          <div className="border-t border-gray-200 pt-2 flex-shrink-0">
            {productosSeleccionados.length > 0 && (
              <div className="mb-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-600">Total ({productosSeleccionados.length} productos)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">${calcularTotal().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium text-xs"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-1.5 bg-red-800 hover:bg-red-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-all font-medium shadow-md disabled:shadow-none flex items-center gap-1 text-xs"
                onClick={crearVenta}
                disabled={!cliente || productosSeleccionados.length === 0}
              >
                <span className="material-icons text-xs">shopping_cart_checkout</span>
                Crear Venta
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* modal o frame de editar venta */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Venta" maxWidth="600px">
        <div className="flex flex-col h-[70vh]">
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-80">
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

          {/* Teléfono para WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (WhatsApp)
              <span className="text-xs text-gray-500 ml-1">(opcional)</span>
            </label>
            <input
              className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Ej: 5551234567 (solo números)"
              value={editTelefono}
              onChange={e => setEditTelefono(e.target.value.replace(/\D/g, ''))}
              maxLength={15}
            />
            <p className="text-xs text-gray-500 mt-1">
              Se usará para enviar el ticket por WhatsApp al cliente
            </p>
          </div>

          {/* seleccionde productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Producto</label>
            <div className="flex gap-2">
              <select
                className="border border-[#ececec] p-2 rounded-lg flex-1 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={articuloSeleccionado}
                onChange={e => setArticuloSeleccionado(e.target.value)}
                title="Seleccionar producto"
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
              onChange={e => setEditMetodoPago(e.target.value as 'efectivo' | 'tarjeta' | 'transferencia')}
              title="Seleccionar método de pago"
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>

          </div>

          {/* Footer fijo con total y botones */}
          <div className="border-t pt-4 flex-shrink-0 space-y-4">
            {/* total */}
            {editProductosSeleccionados.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${calcularTotalEdit().toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* botones */}
            <div className="flex justify-end gap-2">
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
        </div>
      </Modal>

      {/* Modal para enviar ticket por WhatsApp */}
      <Modal 
        open={showWhatsAppTicketModal} 
        onClose={() => {
          setShowWhatsAppTicketModal(false)
          setSelectedVentaForWhatsApp(null)
          setWhatsappTelefono("")
        }} 
        title="Enviar Ticket por WhatsApp" 
        maxWidth="500px"
      >
        <div className="space-y-4">
          {selectedVentaForWhatsApp && (
            <>
              {/* Información de la venta */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">Detalles de la Venta</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Cliente:</strong> {selectedVentaForWhatsApp.cliente}</p>
                  <p><strong>Total:</strong> ${selectedVentaForWhatsApp.total.toFixed(2)}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedVentaForWhatsApp.fecha).toLocaleDateString('es-ES')}</p>
                  <p><strong>Productos:</strong> {selectedVentaForWhatsApp.productos.length} artículos</p>
                </div>
              </div>

              {/* Campo de teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de WhatsApp del Cliente
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  className="border border-[#ececec] p-3 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Ej: 5551234567 (solo números)"
                  value={whatsappTelefono}
                  onChange={e => setWhatsappTelefono(e.target.value.replace(/\D/g, ''))}
                  maxLength={15}
                  autoFocus
                />
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <p>• El número debe estar registrado en WhatsApp</p>
                  <p>• Se enviará el ticket completo con todos los detalles de la compra</p>
                  <p>• {selectedVentaForWhatsApp.telefono ? 'Este número se actualizará para futuras ventas' : 'Se guardará para futuras ventas de este cliente'}</p>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  onClick={() => {
                    setShowWhatsAppTicketModal(false)
                    setSelectedVentaForWhatsApp(null)
                    setWhatsappTelefono("")
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={enviarTicketDesdeModal}
                  disabled={!whatsappTelefono.trim()}
                >
                  <span className="material-icons text-sm">message</span>
                  Enviar Ticket
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de configuración de WhatsApp */}
      <WhatsAppManager 
        isOpen={showWhatsAppModal} 
        onClose={() => setShowWhatsAppModal(false)} 
      />
    </main>
  )
} 