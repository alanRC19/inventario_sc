"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, X } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onRegisterClick?: () => void
}

// Simple Button component
const Button = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    {...props}
  >
    {children}
  </button>
)

// Simple Input component
const Input = ({ className = "", ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white/40 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
)

// Simple Card components
const Card = ({ children, className = "", ...props }: any) => (
  <div className={`rounded-lg border bg-transparent text-gray-900 shadow-sm ${className}`} {...props}>
    {children}
  </div>
)

const CardHeader = ({ children, className = "", ...props }: any) => (
  <div className={`flex flex-col space-y-1.5 p-6 bg-transparent ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ children, className = "", ...props }: any) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
)

const CardContent = ({ children, className = "", ...props }: any) => (
  <div className={`p-6 pt-0 bg-transparent ${className}`} {...props}>
    {children}
  </div>
)

export default function LoginModal({ isOpen, onClose, onRegisterClick }: LoginModalProps) {
  const router = useRouter();
  const [form, setForm] = useState({ user: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch('http://localhost:4001/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: form.user,
          password: form.password
        })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.usuario))
        onClose();
        router.push('/');
      } else {
        setError(data.message || 'Error en el login')
      }
    } catch (error) {
      console.error('Error en login:', error)
      setError('Error de conexión. Verifica tu conexión a internet.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none backdrop-blur-md">
        <img src="/sc_iglesia.png" alt="Fondo SC Iglesia" className="w-full h-full object-cover" />
      </div>
      <div className="w-full max-w-md backdrop-blur-md bg-black/60 rounded-xl shadow-xl border border-black/60">
        <Card className="shadow-none relative rounded-xl border-0 bg-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Logo centrado */}
          <div className="flex justify-center mt-6 mb-2">
            <img src="/sc_logo.png" alt="Logo" className="h-16 w-16 object-contain rounded-full shadow" />
          </div>
          
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-black">Iniciar Sesión</CardTitle>
            <p className="text-black-500">Accede a tu cuenta para continuar</p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100/40 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-black-500">Usuario</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="user"
                    type="text"
                    placeholder="Tu nombre de usuario"
                    value={form.user}
                    onChange={handleChange}
                    className="pl-10 bg-white border border-[#ececec] text-black focus:ring-black rounded-lg"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-black-500">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={form.password}
                    onChange={handleChange}
                    className="pl-10 bg-white border border-[#ececec] text-black focus:ring-black rounded-lg"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
              <div className="mt-2">
                <button
                  type="button"
                  className="text-sm text-blue-700 hover:underline font-medium"
                  onClick={onRegisterClick}
                >
                  ¿No tienes cuenta? Regístrate
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 