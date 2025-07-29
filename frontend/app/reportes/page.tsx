"use client"
import { useEffect, useState } from "react"
import { ReporteDetallado, SolicitudArticulo, ArticuloNoVendido } from "@/domain/reportes/reporte.types"
import { obtenerReporteGeneral, obtenerArticulosNoVendidos, agregarSolicitudArticulo, obtenerSolicitudesArticulos, actualizarEstadoSolicitud } from "@/domain/reportes/reporte.service"
import { DateRangeFilter } from "@/shared/components/DateRangeFilter"
import { Modal } from "@/shared/components/Modal"
import jsPDF from "jspdf"

export default function ReportesPage() {
  const [reporte, setReporte] = useState<ReporteDetallado | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [articulosNoVendidos, setArticulosNoVendidos] = useState<ArticuloNoVendido[]>([]);
  const [loadingNoVendidos, setLoadingNoVendidos] = useState(true);
  const [solicitudes, setSolicitudes] = useState<SolicitudArticulo[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [showModalSolicitud, setShowModalSolicitud] = useState(false);
  
  // Estados para nueva solicitud
  const [nombreArticulo, setNombreArticulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const fetchSolicitudes = async () => {
    setLoadingSolicitudes(true);
    try {
      const res = await obtenerSolicitudesArticulos();
      setSolicitudes(res.data || []);
    } catch (error) {
      console.error("Error obteniendo solicitudes:", error);
      setSolicitudes([]);
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const crearSolicitud = async () => {
    if (!nombreArticulo || !cliente) {
      alert("Nombre del artículo y cliente son requeridos");
      return;
    }

    try {
      await agregarSolicitudArticulo({
        nombre: nombreArticulo,
        descripcion,
        cliente,
        telefono,
        observaciones
      });

      // Limpiar formulario
      setNombreArticulo("");
      setDescripcion("");
      setCliente("");
      setTelefono("");
      setObservaciones("");
      setShowModalSolicitud(false);

      // Recargar solicitudes
      fetchSolicitudes();
      
      alert("Solicitud agregada exitosamente");
    } catch (error) {
      console.error("Error creando solicitud:", error);
      alert("Error al crear la solicitud");
    }
  };

  const cambiarEstadoSolicitud = async (id: string, nuevoEstado: string) => {
    try {
      await actualizarEstadoSolicitud(id, nuevoEstado);
      fetchSolicitudes(); // Recargar solicitudes
      alert("Estado actualizado exitosamente");
    } catch (error) {
      console.error("Error actualizando estado:", error);
      alert("Error al actualizar el estado");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Cargar reportes y artículos no vendidos (dependen de fechas)
      setLoading(true);
      setLoadingNoVendidos(true);
      
      try {
        const [reporteData, articulosData] = await Promise.all([
          obtenerReporteGeneral(fechaInicio || undefined, fechaFin || undefined),
          obtenerArticulosNoVendidos(fechaInicio || undefined, fechaFin || undefined)
        ]);
        
        setReporte(reporteData);
        setArticulosNoVendidos(articulosData.data || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setReporte(null);
        setArticulosNoVendidos([]);
      } finally {
        setLoading(false);
        setLoadingNoVendidos(false);
      }
    };

    loadData();
  }, [fechaInicio, fechaFin]);

  useEffect(() => {
    // Cargar solicitudes (no depende de fechas)
    const loadSolicitudes = async () => {
      setLoadingSolicitudes(true);
      try {
        const res = await obtenerSolicitudesArticulos();
        setSolicitudes(res.data || []);
      } catch (error) {
        console.error("Error obteniendo solicitudes:", error);
        setSolicitudes([]);
      } finally {
        setLoadingSolicitudes(false);
      }
    };

    loadSolicitudes();
  }, []);

  // exportar a pdf
  const exportarPDF = () => {
    if (!reporte) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Reporte de Ventas e Inventario", 14, 18);
    doc.setFontSize(12);
    let y = 30;
    doc.text(`Total Ventas: ${reporte.estadisticasGenerales.totalVentas}`, 14, y);
    y += 8;
    doc.text(`Ingresos Totales: $${reporte.estadisticasGenerales.totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14, y);
    y += 8;
    doc.text(`Valor Inventario: $${reporte.estadisticasGenerales.valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 14, y);
    y += 8;
    doc.text(`Artículos: ${reporte.estadisticasGenerales.totalArticulos}`, 14, y);
    y += 8;
    doc.text(`Stock Bajo: ${reporte.estadisticasGenerales.articulosStockBajo}`, 14, y);
    y += 8;
    doc.text(`Sin Stock: ${reporte.estadisticasGenerales.articulosSinStock}`, 14, y);
    y += 12;
    doc.setFontSize(14);
    doc.text("Productos Más Vendidos:", 14, y);
    y += 8;
    doc.setFontSize(12);
    reporte.productosMasVendidos.forEach((producto, i) => {
      doc.text(`${i + 1}. ${producto.nombre} - ${producto.cantidadVendida} unidades - $${producto.ingresosGenerados.toFixed(2)}`, 16, y);
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    y += 8;
    doc.setFontSize(14);
    doc.text("Clientes Más Frecuentes:", 14, y);
    y += 8;
    doc.setFontSize(12);
    reporte.clientesMasFrecuentes.forEach((cliente, i) => {
      doc.text(`${i + 1}. ${cliente.nombre} - ${cliente.cantidadCompras} compras - $${cliente.totalGastado.toFixed(2)}`, 16, y);
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("reporte.pdf");
  };

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
        <h1 className="text-3xl font-bold mb-2 text-card">Reportes</h1>
        <p className="text-muted">Análisis detallado de ventas e inventario</p>
      </div>

      {/* filtros de fecha */}
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

      <div className="mb-4 flex justify-end">
        <button
          onClick={exportarPDF}
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2 shadow"
        >
          Generar PDF
        </button>
      </div>

      {/* estadisticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Total Ventas</p>
              <p className="text-3xl font-bold text-card mt-2">
                {estadisticasGenerales?.totalVentas ?? 0}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">point_of_sale</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Ventas registradas en el período
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Ingresos Totales</p>
              <p className="text-3xl font-bold text-card mt-2">
                ${estadisticasGenerales?.totalIngresos?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">attach_money</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Ingresos generados en el período
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Valor Inventario</p>
              <p className="text-3xl font-bold text-card mt-2">
                ${estadisticasGenerales?.valorInventario?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) ?? '0.00'}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">inventory_2</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Valor total del inventario actual
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Artículos</p>
              <p className="text-3xl font-bold text-card mt-2">
                {estadisticasGenerales?.totalArticulos ?? 0}
              </p>
            </div>
            <span className="material-icons text-2xl text-card bg-transparent">category</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Total de productos en inventario
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Stock Bajo</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {estadisticasGenerales?.articulosStockBajo ?? 0}
              </p>
            </div>
            <span className="material-icons text-2xl text-yellow-600 bg-transparent">warning</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Productos con stock menor a 5 unidades
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-app border border-app p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted uppercase tracking-wider">Sin Stock</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {estadisticasGenerales?.articulosSinStock ?? 0}
              </p>
            </div>
            <span className="material-icons text-2xl text-red-600 bg-transparent">error</span>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted">
              Productos agotados
            </p>
          </div>
        </div>
      </div>

      {/* grafcicas y Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ventas por periodo*/}
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Ventas Últimos 7 Días</h3>
          <div className="space-y-3">
            {(ventasPorPeriodo ?? []).map((periodo, index) => (
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

        {/* articulos mas vendidos */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {(productosMasVendidos ?? []).map((producto, index) => (
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

        {/* clientes frecuentes */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Clientes Más Frecuentes</h3>
          <div className="space-y-3">
            {(clientesMasFrecuentes ?? []).map((cliente, index) => (
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

        {/* reporte de ventas mensuales */}
        <div className="bg-card rounded-xl shadow-app border border-app p-6">
          <h3 className="text-lg font-semibold mb-4">Reporte Mensual</h3>
          <div className="space-y-3">
            {(reporteMensual ?? []).map((mes, index) => (
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

      {/* Apartado de artículos no vendidos */}
      <div className="bg-card rounded-xl shadow-app border border-app p-6 mb-8 mt-8">
        <h2 className="text-xl font-bold mb-4 text-card">
          Artículos no vendidos
          {(fechaInicio || fechaFin) && (
            <span className="text-sm font-normal text-muted ml-2">
              {fechaInicio && fechaFin ? `(${fechaInicio} a ${fechaFin})` : 
               fechaInicio ? `(desde ${fechaInicio})` : 
               `(hasta ${fechaFin})`}
            </span>
          )}
        </h2>
        {loadingNoVendidos ? (
          <div className="text-gray-500">Cargando...</div>
        ) : articulosNoVendidos.length === 0 ? (
          <div className="text-green-600">
            {(fechaInicio || fechaFin) ? 
              "Todos los artículos han tenido al menos una venta en el período seleccionado." :
              "Todos los artículos han tenido al menos una venta."
            }
          </div>
        ) : (
          <div className="space-y-3">
            {articulosNoVendidos.map((art) => (
              <div key={art._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{art.nombre}</p>
                  <p className="text-sm text-gray-600">
                    Categoría: {art.categoria || '-'} | Proveedor: {art.proveedor || '-'}
                  </p>
                </div>
                <p className="font-semibold text-gray-800">
                  Stock: {art.stock}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de artículos solicitados */}
      <div className="bg-card rounded-xl shadow-app border border-app p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-card">Artículos Solicitados</h2>
          <button
            onClick={() => setShowModalSolicitud(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center gap-2 shadow"
          >
            <span className="material-icons text-sm">add</span>
            Nueva Solicitud
          </button>
        </div>
        
        {loadingSolicitudes ? (
          <div className="text-gray-500">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <span className="material-icons text-4xl mb-2">inbox</span>
            <p>No hay solicitudes de artículos</p>
            <p className="text-sm">Agrega una nueva solicitud usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.map((solicitud) => (
              <div key={solicitud._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{solicitud.nombre}</h3>
                    {solicitud.descripcion && (
                      <p className="text-gray-600 text-sm mb-2">{solicitud.descripcion}</p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <p><span className="font-medium">Cliente:</span> {solicitud.cliente}</p>
                      {solicitud.telefono && (
                        <p><span className="font-medium">Teléfono:</span> {solicitud.telefono}</p>
                      )}
                      <p><span className="font-medium">Fecha:</span> {new Date(solicitud.fecha || '').toLocaleDateString('es-ES')}</p>
                      <p><span className="font-medium">Estado:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                          solicitud.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          solicitud.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                          solicitud.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {solicitud.estado === 'en_proceso' ? 'En Proceso' : 
                           solicitud.estado === 'completada' ? 'Completada' :
                           solicitud.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                        </span>
                      </p>
                    </div>
                    {solicitud.observaciones && (
                      <p className="text-gray-600 text-sm mt-2">
                        <span className="font-medium">Observaciones:</span> {solicitud.observaciones}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4 items-end">
                    <select
                      value={solicitud.estado}
                      onChange={(e) => cambiarEstadoSolicitud(solicitud._id!, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm mb-2"
                      title="Cambiar estado de solicitud"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="completada">Completada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
                        onClick={() => {
                          setNombreArticulo(solicitud.nombre);
                          setDescripcion(solicitud.descripcion || "");
                          setCliente(solicitud.cliente);
                          setTelefono(solicitud.telefono || "");
                          setObservaciones(solicitud.observaciones || "");
                          setShowModalSolicitud(true);
                          // Aquí podrías agregar un estado para saber si es edición
                        }}
                        title="Editar"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition"
                        onClick={async () => {
                          if (window.confirm('¿Eliminar esta solicitud?')) {
                            // Aquí deberías llamar a una función para eliminar la solicitud
                            // await eliminarSolicitudArticulo(solicitud._id!);
                            // fetchSolicitudes();
                            alert('Funcionalidad de eliminar aún no implementada');
                          }
                        }}
                        title="Eliminar"
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* alertas de inventario*/}
      {((estadisticasGenerales?.articulosStockBajo ?? 0) > 0 || (estadisticasGenerales?.articulosSinStock ?? 0) > 0) && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Alertas de Inventario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(estadisticasGenerales?.articulosStockBajo ?? 0) > 0 && (
              <div className="flex items-center gap-3">
                <span className="material-icons text-yellow-600">warning</span>
                <div>
                  <p className="font-medium text-yellow-800">
                    {(estadisticasGenerales?.articulosStockBajo ?? 0)} productos con stock bajo
                  </p>
                  <p className="text-sm text-yellow-700">Revisar inventario</p>
                </div>
              </div>
            )}
            {(estadisticasGenerales?.articulosSinStock ?? 0) > 0 && (
              <div className="flex items-center gap-3">
                <span className="material-icons text-red-600">error</span>
                <div>
                  <p className="font-medium text-red-800">
                    {(estadisticasGenerales?.articulosSinStock ?? 0)} productos sin stock
                  </p>
                  <p className="text-sm text-red-700">Reabastecer urgentemente</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para nueva solicitud */}
      <Modal open={showModalSolicitud} onClose={() => setShowModalSolicitud(false)} title="Nueva Solicitud de Artículo" maxWidth="400px">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Artículo *
            </label>
            <input
              type="text"
              value={nombreArticulo}
              onChange={(e) => setNombreArticulo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Nombre del producto solicitado"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowModalSolicitud(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={crearSolicitud}
              disabled={!nombreArticulo}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Crear Solicitud
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
} 