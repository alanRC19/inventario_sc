"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input" // <--- Importar Input
import { Label } from "@/components/ui/label" // <--- Importar Label
import { Loader2, QrCode, LogOut, CheckCircle, XCircle, Save } from "lucide-react" // <--- Importar Save
import { fetchWhatsappTicketSettings, saveWhatsappTicketSettings } from "@/domain/settings/settings.service" // <--- Importar servicios de configuración

export default function ConfiguracionWhatsAppPage() {
  const [status, setStatus] = useState<string>("cargando")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [message, setMessage] = useState<string>("")
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false)

  // Estados para la configuración del ticket
  const [companyName, setCompanyName] = useState<string>("")
  const [attentionHours, setAttentionHours] = useState<string>("")
  const [savingSettings, setSavingSettings] = useState<boolean>(false)
  const [settingsMessage, setSettingsMessage] = useState<string>("")

  const fetchWhatsAppStatus = async () => {
    if (!isLoggingOut) {
      setLoading(true)
      setMessage("")
    }
    try {
      const res = await fetch("http://localhost:3001/api/whatsapp/status")
      const data = await res.json()
      setStatus(data.status)
      setMessage(data.mensaje)

      if (data.status === "qr_pendiente") {
        const qrRes = await fetch("http://localhost:3001/api/whatsapp/qr")
        const qrData = await qrRes.json()
        if (qrData.success && qrData.qr) {
          setQrCode(qrData.qr)
        } else {
          setQrCode(null)
          setMessage(
            "QR no disponible. Asegúrate de que el servidor de WhatsApp esté ejecutándose y el cliente esté esperando un QR.",
          )
        }
      } else {
        setQrCode(null)
      }
    } catch (error) {
      console.error("Error al obtener el estado de WhatsApp:", error)
      setStatus("error")
      setMessage("Error al conectar con el servicio de WhatsApp. Asegúrate de que el backend esté corriendo.")
      setQrCode(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const settings = await fetchWhatsappTicketSettings()
      setCompanyName(settings.companyName)
      setAttentionHours(settings.attentionHours)
    } catch (error) {
      console.error("Error al cargar la configuración del ticket:", error)
      setSettingsMessage("Error al cargar la configuración del ticket.")
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    setIsLoggingOut(true)
    setMessage("Se está cerrando la sesión de WhatsApp, por favor espere...")
    setQrCode(null)

    try {
      const res = await fetch("http://localhost:3001/api/whatsapp/logout", {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await fetchWhatsAppStatus()
      } else {
        setMessage(`Error al cerrar sesión: ${data.mensaje}`)
      }
    } catch (error) {
      console.error("Error al cerrar sesión de WhatsApp:", error)
      setMessage("Error de red al intentar cerrar sesión.")
    } finally {
      setIsLoggingOut(false)
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMessage("")
    try {
      const result = await saveWhatsappTicketSettings({ companyName, attentionHours })
      if (result.success) {
        setSettingsMessage("Configuración guardada exitosamente.")
      } else {
        setSettingsMessage(`Error al guardar: ${result.message}`)
      }
    } catch (error) {
      console.error("Error al guardar la configuración:", error)
      setSettingsMessage("Error de red al intentar guardar la configuración.")
    } finally {
      setSavingSettings(false)
    }
  }

  useEffect(() => {
    fetchWhatsAppStatus()
    fetchSettings() // Cargar la configuración al montar el componente
    const interval = setInterval(fetchWhatsAppStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    if (isLoggingOut) {
      return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    }
    switch (status) {
      case "listo":
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case "qr_pendiente":
        return <QrCode className="h-8 w-8 text-yellow-500" />
      case "cargando":
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case "error":
      case "no_inicializado":
      case "inicializando_o_fallo":
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return null
    }
  }

  return (
    <main className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-black">Configuración de WhatsApp</h1>
        <p className="text-gray-600">Gestiona la conexión de WhatsApp para el envío de tickets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tarjeta de Estado de WhatsApp */}
        <Card className="w-full max-w-2xl mx-auto lg:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Estado del Cliente de WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoggingOut || loading ? (
              <div className="flex flex-col items-center justify-center p-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <p className="mt-2 text-gray-600">
                  {isLoggingOut ? "Se está cerrando la sesión, por favor espere..." : "Cargando estado..."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold text-black">{message}</p>

                {status === "qr_pendiente" && qrCode && (
                  <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
                    <p className="text-center text-gray-700">
                      Escanea este código QR con tu teléfono para vincular WhatsApp Web:
                    </p>
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}`}
                      alt="QR Code"
                      width={250}
                      height={250}
                      className="border p-2 rounded-md"
                    />
                    <p className="text-sm text-gray-500 text-center">
                      Abre WhatsApp en tu teléfono &gt; Configuración &gt; Dispositivos vinculados &gt; Vincular un
                      dispositivo.
                    </p>
                  </div>
                )}

                {status === "listo" && (
                  <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-green-50">
                    <p className="text-center text-green-700 font-medium">
                      ¡WhatsApp está conectado y listo para enviar mensajes!
                    </p>
                    <Button
                      onClick={handleLogout}
                      disabled={loading || isLoggingOut}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Cerrando..." : "Cerrar Sesión de WhatsApp"}
                    </Button>
                  </div>
                )}

                {(status === "error" || status === "no_inicializado" || status === "inicializando_o_fallo") && (
                  <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-red-50">
                    <p className="text-center text-red-700 font-medium">
                      Hubo un problema con la conexión de WhatsApp.
                    </p>
                    <p className="text-sm text-red-600 text-center">
                      Por favor, asegúrate de que el servidor de WhatsApp esté corriendo y que hayas ejecutado `npm run
                      auth-whatsapp` si es la primera vez o si la sesión expiró.
                    </p>
                    <Button
                      onClick={fetchWhatsAppStatus}
                      disabled={loading || isLoggingOut}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Loader2 className={loading || isLoggingOut ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                      Reintentar Conexión
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta de Configuración del Ticket */}
        <Card className="w-full max-w-2xl mx-auto lg:mx-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-6 w-6 text-gray-600" />
              Configuración del Ticket de WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej. Mi Tienda S.A. de C.V."
                disabled={savingSettings}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attentionHours">Horario de Atención</Label>
              <Input
                id="attentionHours"
                value={attentionHours}
                onChange={(e) => setAttentionHours(e.target.value)}
                placeholder="Ej. Lun-Vie 9:00-18:00"
                disabled={savingSettings}
              />
            </div>
            {settingsMessage && (
              <p className={`text-sm ${settingsMessage.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                {settingsMessage}
              </p>
            )}
            <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-full">
              {savingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar Configuración
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
