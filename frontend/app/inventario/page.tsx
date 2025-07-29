"use client"
import { useEffect, useState, useRef } from "react"
import { Articulo, ArticulosPaginados } from "@/domain/inventario/inventario.types"
import { fetchArticulos, agregarArticulo as agregarArticuloService, eliminarArticulo as eliminarArticuloService, editarArticulo as editarArticuloService, agregarEntrada } from "@/domain/inventario/inventario.service"
import { Table, TableColumn } from "@/shared/components/Table"
import { Modal } from "@/shared/components/Modal"
import { SearchBar } from "@/shared/components/SearchBar"
import { StatusBadge } from "@/shared/components/StatusBadge"
import { EntradaModal, EntradaData } from "@/shared/components/EntradaModal"
import { calculateStockStatus } from "@/shared/utils/stockUtils"

export default function InventarioPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([])
  const [nombre, setNombre] = useState("")
  const [stock, setStock] = useState("")
  const [precioVenta, setPrecioVenta] = useState("")
  const [precioCompra, setPrecioCompra] = useState("")
  const [categoria, setCategoria] = useState("")
  const [proveedor, setProveedor] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState("")
  const [editStock, setEditStock] = useState("")
  const [editPrecioVenta, setEditPrecioVenta] = useState("")
  const [editPrecioCompra, setEditPrecioCompra] = useState("")
  const [editCategoria, setEditCategoria] = useState("")
  const [editProveedor, setEditProveedor] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [modalMounted, setModalMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<{_id: string, nombre: string}[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState<{_id: string, nombre: string}[]>([])

  const fetchArticulosData = async (pageToFetch = page, search = searchTerm) => {
    setLoading(true)
    try {
      const res: ArticulosPaginados = await fetchArticulos(pageToFetch, 6, search)
      setArticulos(res.data || [])
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || 0)
    } catch (e) {
      setArticulos([])
      setTotalPages(1)
      setTotal(0)
    }
    setLoading(false)
  }

  const fetchCategoriasDisponibles = async () => {
    const res = await fetch("http://localhost:3001/api/categorias?limit=1000");
    const data = await res.json();
    setCategoriasDisponibles(data.data || data);
  }

  const fetchProveedoresDisponibles = async () => {
    const res = await fetch("http://localhost:3001/api/proveedores?limit=1000");
    const data = await res.json();
    setProveedoresDisponibles(data.data || data);
  }

  const agregarArticulo = async () => {
    await agregarArticuloService({
      nombre,
      stock: parseInt(stock),
      precioVenta: parseFloat(precioVenta),
      precioCompra: parseFloat(precioCompra),
      categoria,
      proveedor,
    });
    setNombre("");
    setStock("");
    setPrecioVenta("");
    setPrecioCompra("");
    setCategoria("");
    setProveedor("");
    setShowModal(false);
    fetchArticulosData();
  }

  const eliminarArticulo = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este artículo?")) return;
    await eliminarArticuloService(id);
    fetchArticulosData();
  }

  const iniciarEdicion = (articulo: Articulo) => {
    setEditId(articulo._id)
    setEditNombre(articulo.nombre)
    setEditStock(articulo.stock.toString())
    setEditPrecioVenta(articulo.precioVenta?.toString() || "")
    setEditPrecioCompra(articulo.precioCompra?.toString() || "")
    setEditCategoria(articulo.categoria || "")
    setEditProveedor(articulo.proveedor || "")
  }

  const guardarEdicion = async (id: string) => {
    await editarArticuloService(id, {
      nombre: editNombre,
      stock: parseInt(editStock),
      precioVenta: parseFloat(editPrecioVenta),
      precioCompra: parseFloat(editPrecioCompra),
      categoria: editCategoria,
      proveedor: editProveedor,
    });
    setEditId(null);
    setEditNombre("");
    setEditStock("");
    setEditPrecioVenta("");
    setEditPrecioCompra("");
    setEditCategoria("");
    setEditProveedor("");
    fetchArticulosData();
  }

  const handleAgregarEntrada = async (entradaData: EntradaData) => {
    try {
      await agregarEntrada(entradaData);
      setShowEntradaModal(false);
      fetchArticulosData(); // Recargar la lista para ver el stock actualizado
      alert("Entrada agregada exitosamente. El stock ha sido actualizado.");
    } catch (error) {
      console.error("Error al agregar entrada:", error);
      alert("Error al agregar la entrada. Por favor intenta de nuevo.");
    }
  }

  // Animación de entrada del modal
  useEffect(() => {
    if (showModal) {
      fetchCategoriasDisponibles();
      fetchProveedoresDisponibles();
      setTimeout(() => setModalMounted(true), 10)
    } else {
      setModalMounted(false)
    }
  }, [showModal])

  useEffect(() => {
    fetchArticulosData(page, searchTerm)
  }, [page, searchTerm])

  // Definir columnas para la tabla
  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "stock", label: "Stock" },
    { key: "precioVenta", label: "Precio Venta" },
    { key: "precioCompra", label: "Precio Compra" },
    { key: "categoria", label: "Categoría" },
    { key: "proveedor", label: "Proveedor" },
    { key: "estado", label: "Estado" },
    { key: "acciones", label: "Acciones" },
  ];

  return (
    <main className="p-8 w-full">
      {/* Título y botón agregar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-card">Inventario</h2>
          <p className="text-muted">Gestiona los productos y existencias de tu inventario.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/inventario/movimientos"
            className="bg-gray-200 hover:bg-gray-300 text-black font-semibold px-4 py-2 rounded flex items-center gap-2 transition"
          >
            <span className="material-icons text-lg">history</span>
            Ver historial de movimientos
          </a>
          <button
            onClick={() => setShowEntradaModal(true)}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow"
          >
            <span className="material-icons text-lg">add_box</span>
            Agregar Entrada
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2 shadow"
          >
            <span className="material-icons text-lg">add</span>
            Nuevo artículo
          </button>
        </div>
      </div>

      {/* Texto y búsqueda fuera de la tabla */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <span className="text-2xl font-semibold text-card tracking-tight">Lista de artículos</span>
        <SearchBar
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar artículos..."
        />
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={articulos || []}
        renderRow={(a) => {
          // Calcular estado basado en stock
          const estado = calculateStockStatus(a.stock);
          return (
            <tr key={a._id} className="border-b border-[#ececec] hover:bg-[#f3f4f6] transition">
              {editId === a._id ? (
                <>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editStock}
                      onChange={e => setEditStock(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editPrecioVenta}
                      onChange={e => setEditPrecioVenta(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editPrecioCompra}
                      onChange={e => setEditPrecioCompra(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editCategoria}
                      onChange={e => setEditCategoria(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editProveedor}
                      onChange={e => setEditProveedor(e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <StatusBadge estado={estado as any} />
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition"
                      onClick={() => guardarEdicion(a._id)}
                    >
                      Guardar
                    </button>
                    <button
                      className="bg-gray-200 text-black px-3 py-1 rounded-lg hover:bg-gray-300 transition"
                      onClick={() => setEditId(null)}
                    >
                      Cancelar
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="p-4">{a.nombre}</td>
                  <td className="p-4">{a.stock}</td>
                  <td className="p-4">${a.precioVenta?.toFixed(2)}</td>
                  <td className="p-4">${a.precioCompra?.toFixed(2)}</td>
                  <td className="p-4">{a.categoria}</td>
                  <td className="p-4">{a.proveedor}</td>
                  <td className="p-4">
                    <StatusBadge estado={estado as any} />
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6]"
                      title="Editar"
                      onClick={() => iniciarEdicion(a)}
                    >
                      <span className="material-icons text-base">edit</span>
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6] text-red-600"
                      title="Eliminar"
                      onClick={() => eliminarArticulo(a._id)}
                    >
                      <span className="material-icons text-base">delete</span>
                    </button>
                  </td>
                </>
              )}
            </tr>
          );
        }}
      />

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

      {/* Modal de agregar artículo */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar artículo">
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoFocus
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Stock"
          type="number"
          value={stock}
          onChange={e => setStock(e.target.value)}
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Precio de venta"
          type="number"
          value={precioVenta}
          onChange={e => setPrecioVenta(e.target.value)}
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Precio de compra"
          type="number"
          value={precioCompra}
          onChange={e => setPrecioCompra(e.target.value)}
        />
        <select
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        >
          <option value="">Selecciona una categoría</option>
          {categoriasDisponibles.map(cat => (
            <option key={cat._id} value={cat.nombre}>{cat.nombre}</option>
          ))}
        </select>
        {/* Proveedor eliminado del modal */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowModal(false)}
          >Cancelar</button>
          <button
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            onClick={agregarArticulo}
            disabled={!nombre || !stock || !precioVenta || !precioCompra}
          >Agregar</button>
        </div>
      </Modal>

      {/* Modal de agregar entrada */}
      <EntradaModal
        open={showEntradaModal}
        onClose={() => setShowEntradaModal(false)}
        onSubmit={handleAgregarEntrada}
        articulos={articulos}
      />
    </main>
  )
} 