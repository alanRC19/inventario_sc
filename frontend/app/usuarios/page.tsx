'use client';
import { useEffect, useState } from "react";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import { Modal } from "@/shared/components/Modal";
import { Table, TableColumn } from "@/shared/components/Table";

interface Usuario {
  _id?: string;
  nombre: string;
  email: string;
  rol: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("usuario");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState("usuario");
  const [usuarioActual, setUsuarioActual] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3001/api/usuarios", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setUsuarios(data.data || []);
    setLoading(false);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:3001/api/usuarios/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre, email, password, rol })
    });
    const data = await res.json();
    if (res.ok) {
      setMensaje("Usuario creado correctamente");
      setNombre(""); setEmail(""); setPassword(""); setRol("usuario");
      fetchUsuarios();
      setShowModal(false); // Close modal on success
    } else {
      setMensaje(data.error || "Error al crear usuario");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
    // Obtener usuario logueado
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUsuarioActual(payload.email);
        } catch {}
      }
    }
  }, []);

  const iniciarEdicion = (u: Usuario) => {
    setEditId(u._id!);
    setEditNombre(u.nombre);
    setEditEmail(u.email);
    setEditRol(u.rol);
  };

  const guardarEdicion = async (id: string) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: editNombre, email: editEmail, rol: editRol })
    });
    if (res.ok) {
      setEditId(null);
      setEditNombre("");
      setEditEmail("");
      setEditRol("usuario");
      fetchUsuarios();
    } else {
      alert("Error al editar usuario");
    }
    setLoading(false);
  };

  const eliminarUsuario = async (id: string, email: string) => {
    if (usuarioActual && email === usuarioActual) {
      alert("No puedes eliminar tu propio usuario.");
      return;
    }
    if (!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:3001/api/usuarios/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchUsuarios();
    } else {
      alert("Error al eliminar usuario");
    }
    setLoading(false);
  };

  // Definir columnas para la tabla
  const columns: TableColumn[] = [
    { key: "nombre", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "rol", label: "Rol" },
    { key: "acciones", label: "Acciones" },
  ];

  return (
    <ProtectedRoute requiredRole="admin">
      <>
        <h1 className="text-3xl font-bold text-card mb-4">Gestión de Usuarios</h1>
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="bg-black text-white px-5 py-2 rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2 shadow"
          >
            <span className="material-icons text-lg">add</span>
            Nuevo usuario
          </button>
        </div>
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Crear nuevo usuario">
          <form className="space-y-3" onSubmit={handleCrear}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input className="border border-[#ececec] p-2 rounded-lg w-full" value={nombre} onChange={e => setNombre(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="border border-[#ececec] p-2 rounded-lg w-full" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" className="border border-[#ececec] p-2 rounded-lg w-full" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select className="border border-[#ececec] p-2 rounded-lg w-full" value={rol} onChange={e => setRol(e.target.value)} required>
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                className="bg-muted text-app px-4 py-2 rounded-lg hover:bg-muted transition border border-app"
                onClick={() => setShowModal(false)}
              >Cancelar</button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary transition"
                disabled={loading}
              >{loading ? "Procesando..." : "Crear usuario"}</button>
            </div>
          </form>
          {mensaje && <div className="mt-4 text-center text-sm text-red-600">{mensaje}</div>}
        </Modal>
        <h2 className="text-lg font-semibold mb-2 text-card">Usuarios registrados</h2>
        {loading ? <div className="text-center text-muted">Cargando...</div> : (
          <Table
            columns={columns}
            data={usuarios}
            renderRow={u => (
              <tr key={u._id} className="border-b border-app hover:bg-muted transition">
                {editId === u._id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        className="border border-app p-2 rounded-lg w-full text-card bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editNombre}
                        onChange={e => setEditNombre(e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className="border border-app p-2 rounded-lg w-full text-card bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="border border-app p-2 rounded-lg w-full text-card bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                        value={editRol}
                        onChange={e => setEditRol(e.target.value)}
                      >
                        <option value="usuario">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary transition"
                        onClick={() => guardarEdicion(u._id!)}
                        disabled={loading}
                      >Guardar</button>
                      <button
                        className="bg-muted text-app px-3 py-1 rounded-lg hover:bg-muted transition border border-app"
                        onClick={() => setEditId(null)}
                        disabled={loading}
                      >Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-card">{u.nombre}</td>
                    <td className="px-4 py-2 text-card">{u.email}</td>
                    <td className="px-4 py-2 text-card">{u.rol}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="p-1 rounded hover:bg-muted"
                        title="Editar"
                        onClick={() => iniciarEdicion(u)}
                        disabled={loading}
                      >
                        <span className="material-icons text-base">edit</span>
                      </button>
                      <button
                        className="p-1 rounded hover:bg-muted text-red-600"
                        title="Eliminar"
                        onClick={() => eliminarUsuario(u._id!, u.email)}
                        disabled={loading || !!(usuarioActual && u.email === usuarioActual)}
                      >
                        <span className="material-icons text-base">delete</span>
                      </button>
                    </td>
                  </>
                )}
              </tr>
            )}
          />
        )}
      </>
    </ProtectedRoute>
  );
} 