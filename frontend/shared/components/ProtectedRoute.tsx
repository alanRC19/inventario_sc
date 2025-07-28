"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../utils/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string; // "admin" o "usuario"
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { usuario, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace("/auth");
      } else if (requiredRole && usuario?.rol !== requiredRole) {
        router.replace("/"); // O a una página de acceso denegado
      }
    }
  }, [isAuthenticated, loading, requiredRole, usuario, router]);

  if (loading || !isAuthenticated || (requiredRole && usuario?.rol !== requiredRole)) {
    return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  }
  return <>{children}</>;
} 