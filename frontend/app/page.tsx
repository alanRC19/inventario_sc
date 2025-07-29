"use client"
import { useEffect } from "react"
import { useAuth } from "@/shared/utils/useAuth"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { usuario, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!usuario) {
        // Si no está autenticado, redirigir al login
        router.push('/auth')
      } else if (usuario.rol === 'admin') {
        // Si es admin, ir al dashboard de admin
        router.push('/dashboard/admin')
      } else {
        // Si es usuario normal, ir al dashboard de usuario
        router.push('/dashboard/usuario')
      }
    }
  }, [usuario, loading, router])

  // Mostrar loading mientras se determina la redirección
  return (
    <main className="p-8 w-full">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    </main>
  )
}