"use client";
import { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import { Proveedor, ProveedoresPaginados } from "@/domain/proveedores/proveedor.types";
import { fetchProveedores, agregarProveedor as agregarProveedorService, eliminarProveedor as eliminarProveedorService, editarProveedor as editarProveedorService } from "@/domain/proveedores/proveedor.service";
import { Table, TableColumn } from "@/shared/components/Table";
import { Modal } from "@/shared/components/Modal";
import { SearchBar } from "@/shared/components/SearchBar";

const API_URL = "http://localhost:3001/api/proveedores";

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editContacto, setEditContacto] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchProveedoresData = async (pageToFetch = page, search = searchTerm) => {
    setLoading(true);
    try {
      const res: ProveedoresPaginados = await fetchProveedores(pageToFetch, 6, search);
      setProveedores(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (e) {
      setProveedores([]);
      setTotalPages(1);
      setTotal(0);
    }
    setLoading(false);
  };

  const agregarProveedor = async () => {
    await agregarProveedorService({ nombre, contacto, telefono });
    setNombre("");
    setContacto("");
    setTelefono("");
    setShowModal(false);
    fetchProveedoresData();
  };

  const eliminarProveedor = async (id: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar este proveedor?`)) return;
    await eliminarProveedorService(id);
    fetchProveedoresData();
  };

  const iniciarEdicion = (proveedor: Proveedor) => {
    setEditId(proveedor._id);
    setEditNombre(proveedor.nombre);
    setEditContacto(proveedor.contacto || "");
    setEditTelefono(proveedor.telefono || "");
  };

  const guardarEdicion = async (id: string) => {
    await editarProveedorService(id, { nombre: editNombre, contacto: editContacto, telefono: editTelefono });
    setEditId(null);
    setEditNombre("");
    setEditContacto("");
    setEditTelefono("");
    fetchProveedoresData();
  };

  useEffect(() => {
    if (showModal) {
      setTimeout(() => setModalMounted(true), 10);
    } else {
      setModalMounted(false);
    }
  }, [showModal]);

  useEffect(() => {
    fetchProveedoresData(page, searchTerm);
  }, [page, searchTerm]);

  // Definir columnas para la tabla
  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "contacto", label: "Contacto" },
    { key: "info", label: "Información" },
    { key: "acciones", label: "Acciones" },
  ];

  return (
    <main className="p-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-black">Proveedores</h2>
          <p className="text-gray-600">Gestiona los proveedores de tus productos.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2 shadow"
        >
          <span className="material-icons text-lg">add</span>
          Nuevo proveedor
        </button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <span className="text-2xl font-semibold text-[#18181b] tracking-tight">Lista de proveedores</span>
        <SearchBar
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar proveedores..."
        />
      </div>
      <Table
        columns={columns}
        data={proveedores || []}
        renderRow={(p) => (
          <tr key={p._id} className="border-b border-[#ececec] hover:bg-[#f3f4f6] transition">
            {editId === p._id ? (
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
                    value={editContacto}
                    onChange={e => setEditContacto(e.target.value)}
                  />
                </td>
                <td className="p-4">
                  <input
                    className="border border-[#ececec] p-2 rounded-lg w-full text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    value={editTelefono}
                    onChange={e => setEditTelefono(e.target.value)}
                  />
                </td>
                <td className="p-4 flex gap-2">
                  <button
                    className="bg-black text-white px-3 py-1 rounded-lg hover:bg-gray-900 transition"
                    onClick={() => guardarEdicion(p._id)}
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
                <td className="p-4">{p.nombre}</td>
                <td className="p-4">{p.contacto}</td>
                <td className="p-4">{p.telefono ? `Tel: ${p.telefono}` : "-"}</td>
                <td className="p-4 flex gap-2">
                  <button
                    className="p-1 rounded hover:bg-[#f3f4f6]"
                    title="Editar"
                    onClick={() => iniciarEdicion(p)}
                  >
                    <span className="material-icons text-base">edit</span>
                  </button>
                  <button
                    className="p-1 rounded hover:bg-[#f3f4f6] text-red-600"
                    title="Eliminar"
                    onClick={() => eliminarProveedor(p._id)}
                  >
                    <span className="material-icons text-base">delete</span>
                  </button>
                </td>
              </>
            )}
          </tr>
        )}
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Agregar proveedor">
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoFocus
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Contacto"
          value={contacto}
          onChange={e => setContacto(e.target.value)}
        />
        <input
          className="border border-[#ececec] p-2 rounded-lg w-full mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="Teléfono"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowModal(false)}
          >Cancelar</button>
          <button
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
            onClick={agregarProveedor}
            disabled={!nombre}
          >Agregar</button>
        </div>
      </Modal>
    </main>
  );
} 