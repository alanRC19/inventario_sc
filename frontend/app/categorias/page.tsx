"use client";
import { useEffect, useState, useRef } from "react";
import { Categoria, CategoriasPaginadas } from "@/domain/categorias/categoria.types";
import { fetchCategorias, agregarCategoria as agregarCategoriaService, eliminarCategoria as eliminarCategoriaService, editarCategoria as editarCategoriaService } from "@/domain/categorias/categoria.service";
import { Table, TableColumn } from "@/shared/components/Table";
import { Modal } from "@/shared/components/Modal";
import { SearchBar } from "@/shared/components/SearchBar";

type Articulo = {
  _id: string;
  nombre: string;
  categoria?: string;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCategoriasData = async (pageToFetch = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res: CategoriasPaginadas = await fetchCategorias(pageToFetch, 6, search);
      setCategorias(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (e) {
      setCategorias([]);
      setTotalPages(1);
      setTotal(0);
    }
    setLoading(false);
  };

  const fetchArticulos = async () => {
    const res = await fetch("http://localhost:3001/api/articulos");
    const data = await res.json();
    setArticulos(data.data || []);
  };

  const agregarCategoria = async () => {
    await agregarCategoriaService({ nombre });
    setNombre("");
    setShowModal(false);
    fetchCategoriasData();
  };

  const eliminarCategoria = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;
    await eliminarCategoriaService(id);
    fetchCategoriasData();
  };

  const iniciarEdicion = (categoria: Categoria) => {
    setEditId(categoria._id);
    setEditNombre(categoria.nombre);
  };

  const guardarEdicion = async (id: string) => {
    await editarCategoriaService(id, { nombre: editNombre });
    setEditId(null);
    setEditNombre("");
    fetchCategoriasData();
  };

  const filteredCategorias = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Definir columnas para la tabla
  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "registros", label: "Registros", align: "center" },
    { key: "acciones", label: "Acciones" },
  ];

  useEffect(() => {
    fetchCategoriasData(page, searchTerm);
    fetchArticulos();
  }, [page, searchTerm]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setModalMounted(true), 10);
    } else {
      setModalMounted(false);
    }
  }, [showModal]);

  return (
    <main className="p-8 w-full">
      {/* Título y botón agregar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-black">Categorías</h2>
          <p className="text-gray-600">Gestiona las categorías de tus productos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2 shadow"
        >
          <span className="material-icons text-lg">add</span>
          Nueva categoría
        </button>
      </div>

      {/* Texto y búsqueda fuera de la tabla */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <span className="text-2xl font-semibold text-[#18181b] tracking-tight">Lista de categorías</span>
        <SearchBar
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar categorías..."
        />
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={categorias || []}
        renderRow={(c) => {
          const registros = (articulos || []).filter(a => a.categoria === c.nombre).length;
          return (
            <tr key={c._id} className="border-b border-[#ececec] hover:bg-[#f3f4f6] transition">
              {editId === c._id ? (
                <>
                  <td className="p-4">
                    <input
                      className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                      value={editNombre}
                      onChange={e => setEditNombre(e.target.value)}
                    />
                  </td>
                  <td className="p-4 text-center align-middle">-</td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition"
                      onClick={() => guardarEdicion(c._id)}
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
                  <td className="p-4">{c.nombre}</td>
                  <td className="p-4 text-center align-middle">{registros}</td>
                  <td className="p-4 flex gap-2">
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6]"
                      title="Editar"
                      onClick={() => iniciarEdicion(c)}
                    >
                      <span className="material-icons text-base">edit</span>
                    </button>
                    <button
                      className="p-1 rounded hover:bg-[#f3f4f6] text-red-600"
                      title="Eliminar"
                      onClick={() => eliminarCategoria(c._id)}
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

      {/* Modal para agregar */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar categoría">
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowModal(false)}
          >Cancelar</button>
          <button
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            onClick={agregarCategoria}
            disabled={!nombre}
          >Agregar</button>
        </div>
      </Modal>
    </main>
  );
} 