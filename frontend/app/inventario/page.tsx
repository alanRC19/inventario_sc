"use client"
import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Articulo, ArticulosPaginados } from "@/domain/inventario/inventario.types"
import { fetchArticulos, agregarArticulo as agregarArticuloService, eliminarArticulo as eliminarArticuloService, editarArticulo as editarArticuloService, obtenerProveedoresArticulo } from "@/domain/inventario/inventario.service"
import { Table, TableColumn } from "@/shared/components/Table"
import { Modal } from "@/shared/components/Modal"
import { SearchBar } from "@/shared/components/SearchBar"
import { StatusBadge } from "@/shared/components/StatusBadge"
import { calculateStockStatus } from "@/shared/utils/stockUtils"
import { createEntrada } from "@/domain/entradas/entrada.service";
import { fetchProveedores } from "@/domain/proveedores/proveedor.service";
import { Producto, EntradaArticulo } from "@/domain/entradas/entrada.types";

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
  const [modalMounted, setModalMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<{_id: string, nombre: string}[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [proveedoresDisponibles, setProveedoresDisponibles] = useState<{_id: string, nombre: string}[]>([])
  // Estado para el modal de entrada
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [entradaArticulos, setEntradaArticulos] = useState<EntradaArticulo[]>([]);
  const [entradaProveedor, setEntradaProveedor] = useState("");
  const [entradaFecha, setEntradaFecha] = useState("");
  const [proveedores, setProveedores] = useState<{ _id: string; nombre: string }[]>([]);
  const [entradaError, setEntradaError] = useState("");
  
  // Estados para modal de proveedores
  const [showProveedoresModal, setShowProveedoresModal] = useState(false);
  const [proveedoresArticulo, setProveedoresArticulo] = useState<{
    proveedorId: string;
    nombre: string;
    ultimoPrecio: number;
    ultimaCompra: string;
    totalCompras: number;
    contacto?: string;
    email?: string;
  }[]>([]);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<string>("");

  const fetchArticulosData = useCallback(async (pageToFetch = page, search = searchTerm) => {
    setLoading(true)
    try {
      const res: ArticulosPaginados = await fetchArticulos(pageToFetch, 6, search)
      setArticulos(res.data || [])
      setTotalPages(res.totalPages || 1)
      setTotal(res.total || 0)
    } catch {
      setArticulos([])
      setTotalPages(1)
      setTotal(0)
    }
    setLoading(false)
  }, [page, searchTerm])

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
      stock: 0,
      precioVenta: parseFloat(precioVenta),
      precioCompra: precioCompra ? parseFloat(precioCompra) : undefined,
      categoria,
      // proveedor se asignará cuando se haga una entrada
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
      precioCompra: editPrecioCompra ? parseFloat(editPrecioCompra) : undefined,
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
  }, [page, searchTerm, fetchArticulosData])

  // Cargar proveedores para el modal de entrada
  useEffect(() => {
    if (showEntradaModal) {
      fetchProveedores(1, 1000).then(res => setProveedores(res.data || []));
      if (articulos.length > 0) {
        setEntradaArticulos([
          { articuloId: articulos[0]._id, nombre: articulos[0].nombre, cantidad: 1, precioCompra: articulos[0].precioCompra || 0, subtotal: (articulos[0].precioCompra || 0) * 1 }
        ]);
      }
      setEntradaFecha(new Date().toISOString().split("T")[0]);
      setEntradaProveedor("");
      setEntradaError("");
    }
  }, [showEntradaModal, articulos]);

  // Función para manejar cambios en los artículos de la entrada
  const handleEntradaArticuloChange = (idx: number, field: keyof Producto, value: number | string) => {
    setEntradaArticulos(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } as EntradaArticulo : a));
  };
  // Agregar/quitar artículos en la entrada
  const handleAddEntradaArticulo = () => {
    setEntradaArticulos(prev => ([...prev, { 
      articuloId: articulos[0]?._id || "", 
      nombre: articulos[0]?.nombre || "",
      cantidad: 1, 
      precioCompra: articulos[0]?.precioCompra || 0,
      subtotal: (articulos[0]?.precioCompra || 0) * 1
    }]));
  };
  const handleRemoveEntradaArticulo = (idx: number) => {
    setEntradaArticulos(prev => prev.filter((_, i) => i !== idx));
  };

  const verProveedores = async (articulo: Articulo) => {
    try {
      const proveedores = await obtenerProveedoresArticulo(articulo._id);
      setProveedoresArticulo(proveedores);
      setArticuloSeleccionado(articulo.nombre);
      setShowProveedoresModal(true);
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
    }
  };
  // Guardar entrada
  const handleGuardarEntrada = async () => {
    setEntradaError("");
    if (!entradaProveedor || entradaArticulos.length === 0 || entradaArticulos.some(a => !a.articuloId || a.cantidad <= 0)) {
      setEntradaError("Completa todos los campos obligatorios.");
      return;
    }
    try {
      await createEntrada({
        proveedor: entradaProveedor,
        fecha: new Date(entradaFecha),
        productos: entradaArticulos.map(a => ({
          ...a,
          precioUnitario: a.precioCompra
        })),
        total: entradaArticulos.reduce((acc, curr) => acc + curr.subtotal, 0),
        tipo: 'compra',
        estado: 'pendiente',
        recibidoPor: 'usuario'  // TODO: Obtener el usuario actual
      });
      setShowEntradaModal(false);
      fetchArticulosData();
    } catch (e: Error | unknown) {
      let msg = "Error al registrar la entrada";
      if (e instanceof Error) {
        msg = e.message;
      }
      const err = e as { response?: { json: () => Promise<{ message: string }> } };
      if (err && err.response) {
        err.response.json().then((data) => {
          setEntradaError(data.message || msg);
        }).catch(() => setEntradaError(msg));
      } else {
        setEntradaError(msg);
      }
      console.error("Error al registrar entrada:", e);
    }
  };

  // Definir columnas para la tabla
  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "stock", label: "Stock" },
    { key: "precioVenta", label: "Precio de venta" },
    { key: "precioCompra", label: "Precio de compra" },
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
          <h2 className="text-3xl font-bold text-gray-900">Inventario</h2>
          <p className="text-gray-600">Gestiona los productos y existencias de tu inventario.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/inventario/movimientos"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition shadow"
          >
            <span className="material-icons text-lg">history</span>
            Historial de Movimientos
          </Link>
          <button
            onClick={() => setShowEntradaModal(true)}
            className="bg-green-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-800 transition flex items-center gap-2 shadow"
          >
            <span className="material-icons text-lg">add</span>
            Agregar entrada
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
          return (
            <tr key={a._id} className="border-b border-[#ececec] hover:bg-[#f3f4f6] transition">
              {editId === a._id ? (
                <>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                      placeholder="Nombre del artículo"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editStock}
                      onChange={e => setEditStock(e.target.value)}
                      placeholder="Stock"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editPrecioVenta}
                      onChange={e => setEditPrecioVenta(e.target.value)}
                      placeholder="Precio de venta"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      type="number"
                      value={editPrecioCompra}
                      onChange={e => setEditPrecioCompra(e.target.value)}
                      placeholder="Precio de compra"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editCategoria}
                      onChange={e => setEditCategoria(e.target.value)}
                      placeholder="Categoría"
                    />
                  </td>
                  <td className="p-4">
                    <StatusBadge estado={calculateStockStatus(parseInt(editStock) || 0)} />
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
                  <td className="p-4">${a.precioCompra?.toFixed(2) ?? '-'}</td>
                  <td className="p-4">{a.categoria}</td>
                  <td className="p-4">{a.proveedor}</td>
                  <td className="p-4">
                    <StatusBadge estado={calculateStockStatus(a.stock)} />
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6]"
                      title="Ver proveedores"
                      onClick={() => verProveedores(a)}
                    >
                      <span className="material-icons text-base">business</span>
                    </button>
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
          placeholder="Precio de venta"
          type="number"
          value={precioVenta}
          onChange={e => setPrecioVenta(e.target.value)}
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Precio de compra (referencia)"
          type="number"
          value={precioCompra}
          onChange={e => setPrecioCompra(e.target.value)}
        />
        <select
          title="Seleccionar categoría"
          aria-label="Seleccionar categoría"
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          value={categoria}
          onChange={e => setCategoria(e.target.value)}
        >
          <option value="">Selecciona una categoría</option>
          {categoriasDisponibles.map(cat => (
            <option key={cat._id} value={cat.nombre}>{cat.nombre}</option>
          ))}
        </select>
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowModal(false)}
          >Cancelar</button>
          <button
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            onClick={agregarArticulo}
            disabled={!nombre || !precioVenta}
          >Agregar</button>
        </div>
      </Modal>
      {/* Modal de agregar entrada */}
      <Modal open={showEntradaModal} onClose={() => setShowEntradaModal(false)} title="Registrar entrada al inventario" maxWidth="40rem">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Proveedor *</label>
          <select
            className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black mb-2"
            value={entradaProveedor}
            onChange={e => setEntradaProveedor(e.target.value)}
          >
            <option value="">Selecciona un proveedor</option>
            {proveedores.map(p => (
              <option key={p._id} value={p._id}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Fecha</label>
          <input
            type="date"
            title="Fecha de entrada"
            placeholder="Seleccionar fecha"
            className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black mb-2"
            value={entradaFecha}
            onChange={e => setEntradaFecha(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block font-semibold mb-2">Artículos *</label>
          {entradaArticulos.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <select
                title="Seleccionar artículo"
                aria-label="Seleccionar artículo"
                className="border border-[#ececec] p-2 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={item.articuloId}
                onChange={e => handleEntradaArticuloChange(idx, "articuloId", e.target.value)}
              >
                {articulos.map(a => (
                  <option key={a._id} value={a._id}>{a.nombre}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className="border border-[#ececec] p-2 rounded-lg w-24 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                value={item.cantidad}
                onChange={e => handleEntradaArticuloChange(idx, "cantidad", Number(e.target.value))}
                placeholder="Cantidad"
              />
              <button
                className="text-red-600 hover:text-red-800 px-2"
                onClick={() => handleRemoveEntradaArticulo(idx)}
                disabled={entradaArticulos.length === 1}
                title="Quitar artículo"
              >
                <span className="material-icons">remove_circle</span>
              </button>
            </div>
          ))}
          <button
            className="bg-gray-200 text-black px-3 py-1 rounded-lg hover:bg-gray-300 transition mt-2"
            onClick={handleAddEntradaArticulo}
            type="button"
          >
            <span className="material-icons text-base align-middle">add</span> Agregar otro artículo
          </button>
        </div>
        {entradaError && <div className="text-red-600 mb-2">{entradaError}</div>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowEntradaModal(false)}
          >Cancelar</button>
          <button
            className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition"
            onClick={handleGuardarEntrada}
            disabled={!entradaProveedor || entradaArticulos.length === 0 || entradaArticulos.some(a => !a.articuloId || a.cantidad <= 0)}
          >Registrar entrada</button>
        </div>
      </Modal>

      {/* Modal de proveedores */}
      <Modal 
        open={showProveedoresModal} 
        onClose={() => setShowProveedoresModal(false)} 
        title={`Proveedores de ${articuloSeleccionado}`}
        maxWidth="50rem"
      >
        {proveedoresArticulo.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="material-icons text-6xl mb-4 block">business_center</span>
            <p>Este artículo aún no tiene proveedores registrados.</p>
            <p className="text-sm mt-2">Los proveedores se asignan automáticamente cuando realizas entradas de inventario.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proveedoresArticulo.map((proveedor, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {proveedor.nombre || 'Proveedor no encontrado'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {proveedor.contacto && (
                        <p><span className="font-medium">Contacto:</span> {proveedor.contacto}</p>
                      )}
                      {proveedor.email && (
                        <p><span className="font-medium">Email:</span> {proveedor.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm font-medium text-gray-700">Último precio de compra</p>
                      <p className="text-lg font-bold text-green-600">${proveedor.ultimoPrecio?.toFixed(2)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-2 rounded border text-center">
                        <p className="text-gray-600">Total comprado</p>
                        <p className="font-semibold">{proveedor.totalCompras} unidades</p>
                      </div>
                      <div className="bg-white p-2 rounded border text-center">
                        <p className="text-gray-600">Última compra</p>
                        <p className="font-semibold">
                          {new Date(proveedor.ultimaCompra).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowProveedoresModal(false)}
          >
            Cerrar
          </button>
        </div>
      </Modal>

    </main>
  )
} 