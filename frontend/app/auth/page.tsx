"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje("");
    if (!email.trim() || !password.trim()) {
      setMensaje("Por favor, completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      // Login
      const res = await fetch("http://localhost:3001/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setMensaje("");
        setLoading(true);
        setTimeout(() => window.location.href = "/", 1000);
      } else {
        setMensaje(data.error || "Error al iniciar sesión");
      }
    } catch (e) {
      setMensaje("Error de red");
    }
    setLoading(false);
  };

  // Redirigir si ya hay token
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  // Botón de logout (solo visible si hay token)
  const handleLogout = () => {
    localStorage.removeItem("token");
    alert("Sesión cerrada correctamente");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app">
      <div className="bg-card rounded-xl shadow-app border border-app p-8 w-full max-w-md relative">
        <h1 className="text-2xl font-bold mb-4 text-card text-center">Iniciar Sesión</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Email</label>
            <input
              type="email"
              className="border border-app p-2 rounded-lg w-full text-card bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Contraseña</label>
            <input
              type="password"
              className="border border-app p-2 rounded-lg w-full text-card bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary text-white font-semibold py-2 px-4 rounded-lg transition"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Iniciar sesión"}
          </button>
        </form>
        {mensaje && <div className="mt-4 text-center text-sm text-red-600">{mensaje}</div>}
        {loading && (
          <div className="absolute inset-0 bg-card bg-opacity-70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
} 