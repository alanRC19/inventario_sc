import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

type UsuarioJWT = { nombre: string; rol: string; email: string; _id: string };

export function useAuth() {
  const [usuario, setUsuario] = useState<UsuarioJWT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          setUsuario(jwtDecode<UsuarioJWT>(token));
        } catch {
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setLoading(false);
    }
  }, []);

  return { usuario, isAuthenticated: !!usuario, loading };
} 