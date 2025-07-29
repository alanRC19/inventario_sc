"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./login.css";

export default function AuthPage() {
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
    } catch (error) {
      console.error(error);
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

  return (
    <div className="login-container flex items-center justify-center relative">
      {/* Overlay difuminado */}
      <div className="absolute inset-0 bg-black/40 login-overlay"></div>
      
      {/* Contenedor del formulario */}
      <div className="relative z-10 bg-white/95 login-form rounded-2xl shadow-2xl border border-white/20 p-10 mx-4">
        {/* Logo y título */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <Image 
              src="/sc_logo.png" 
              alt="Logo Sagrado Corazón" 
              width={80}
              height={80}
              className="mx-auto rounded-full bg-orange-500 p-3"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Sistema de Inventario</h1>
          <p className="text-gray-600 text-base">Sagrado Corazón</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Correo electrónico</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons text-xl">
                email
              </span>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 text-gray-800 placeholder-gray-500 text-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-3">Contraseña</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 material-icons text-xl">
                lock
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-14 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 text-gray-800 placeholder-gray-500 text-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-3 shadow-lg text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span className="material-icons">login</span>
                <span>Iniciar sesión</span>
              </>
            )}
          </button>
        </form>

        {mensaje && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 text-red-700">
              <span className="material-icons text-lg">error</span>
              <span className="text-base">{mensaje}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            © 2025 Sagrado Corazón - Sistema de Inventario
          </p>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 loading-overlay flex items-center justify-center z-20 rounded-2xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Iniciando sesión...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 