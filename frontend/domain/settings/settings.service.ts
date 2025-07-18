interface WhatsappTicketSettings {
  companyName: string
  attentionHours: string
}

const API_URL = "http://localhost:3001/api/settings/whatsapp-ticket"

export async function fetchWhatsappTicketSettings(): Promise<WhatsappTicketSettings> {
  const res = await fetch(API_URL)
  const data = await res.json()
  if (!data.success) {
    throw new Error(data.message || "Error al obtener la configuración del ticket de WhatsApp")
  }
  return data.data
}

export async function saveWhatsappTicketSettings(
  settings: WhatsappTicketSettings,
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  })
  const data = await res.json()
  return data
}
