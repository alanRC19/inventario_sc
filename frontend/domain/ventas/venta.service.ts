// Funciones de acceso a datos y lógica de negocio para Ventas
import type { Venta, VentasPaginadas, NuevaVenta } from "./venta.types"

const API_URL = "http://localhost:3001/api/ventas"

export async function fetchVentas(
  page = 1,
  limit = 6,
  search = "",
  fechaInicio = "",
  fechaFin = "",
): Promise<VentasPaginadas> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.append("search", search)
  if (fechaInicio) params.append("fechaInicio", fechaInicio)
  if (fechaFin) params.append("fechaFin", fechaFin)

  const res = await fetch(`${API_URL}?${params.toString()}`)
  return res.json()
}

export async function agregarVenta(data: NuevaVenta): Promise<any> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  return res.json()
}

export async function eliminarVenta(id: string): Promise<void> {
  await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
}

export async function obtenerVenta(id: string): Promise<Venta> {
  const res = await fetch(`${API_URL}/${id}`)
  return res.json()
}

export async function editarVenta(id: string, data: NuevaVenta): Promise<void> {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
}

// Función para verificar estado de WhatsApp
export async function verificarEstadoWhatsApp(): Promise<{ listo: boolean; cliente: string }> {
  const res = await fetch("http://localhost:3001/api/whatsapp/status")
  return res.json()
}

// Función para reenviar ticket por WhatsApp
export async function reenviarTicketWhatsApp(ventaId: string, telefono: string): Promise<any> {
  const res = await fetch(`${API_URL}/${ventaId}/reenviar-whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono }),
  })
  return res.json()
}
