const {
  getWhatsAppClient,
  isWhatsAppClientReady,
  initializeWhatsAppClient,
  getQrCodeData,
  destroyWhatsAppClient,
  setQrCodeCallback,
} = require("../whatsappClient")
const { getDb } = require("../db") // <--- Importar getDb

// Función para formatear el ticket de WhatsApp (ahora acepta parámetros de configuración)
function generarTicketWhatsApp(venta, companyName = "Tu Empresa", attentionHours = "Lun-Vie 9:00-18:00") {
  const fecha = new Date(venta.fecha).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const metodoPagoEmoji = {
    efectivo: "💵",
    tarjeta: "💳",
    transferencia: "🏦",
  }

  let ticket = `🧾 *TICKET DE VENTA*\n\n`
  ticket += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  ticket += `👤 *Cliente:* ${venta.cliente}\n`
  ticket += `📅 *Fecha:* ${fecha}\n\n`
  ticket += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  ticket += `📦 *PRODUCTOS:*\n`
  venta.productos.forEach((producto, index) => {
    ticket += `${index + 1}. *${producto.nombre}*\n`
    ticket += `   Cantidad: ${producto.cantidad}\n`
    ticket += `   Precio unit: $${producto.precioUnitario.toFixed(2)}\n`
    ticket += `   Subtotal: $${producto.subtotal.toFixed(2)}\n\n`
  })
  ticket += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  ticket += `💰 *TOTAL: $${venta.total.toFixed(2)}*\n`
  ticket += `${metodoPagoEmoji[venta.metodoPago]} *Método de pago:* ${venta.metodoPago.charAt(0).toUpperCase() + venta.metodoPago.slice(1)}\n\n`
  ticket += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  ticket += `✨ *¡Gracias por tu compra en ${companyName}!*\n` // <--- PERSONALIZABLE
  ticket += `📞 Para dudas o aclaraciones, contáctanos\n`
  ticket += `🕐 Horario de atención: ${attentionHours}` // <--- PERSONALIZABLE

  return ticket
}

// Función para formatear número de teléfono (sin cambios)
function formatearTelefono(telefono) {
  let numeroLimpio = telefono.replace(/[^\d+]/g, "")
  if (numeroLimpio.startsWith("+")) {
    numeroLimpio = numeroLimpio.substring(1)
  }
  if (numeroLimpio.length === 10 && !numeroLimpio.startsWith("52")) {
    numeroLimpio = "52" + numeroLimpio
  }
  return numeroLimpio + "@c.us"
}

// Función principal para enviar mensaje por WhatsApp (sin cambios en la lógica de envío)
async function enviarMensajeWhatsApp(telefono, mensaje) {
  try {
    if (!isWhatsAppClientReady()) {
      console.log("[WhatsApp Service] Cliente no listo para enviar mensajes. Requiere autenticación.")
      throw new Error("Cliente de WhatsApp no está listo. Por favor, autentica el cliente primero.")
    }

    const client = getWhatsAppClient()
    if (!client) {
      throw new Error("Cliente de WhatsApp no disponible después de la verificación de estado.")
    }

    const chatId = formatearTelefono(telefono)
    console.log(`[WhatsApp Service] Enviando mensaje a: ${chatId}`)

    const isRegistered = await client.isRegisteredUser(chatId)
    if (!isRegistered) {
      throw new Error("El número no está registrado en WhatsApp")
    }

    await client.sendMessage(chatId, mensaje)
    console.log(`[WhatsApp Service] ✅ Mensaje enviado exitosamente a ${telefono}`)

    return {
      success: true,
      mensaje: "Mensaje enviado exitosamente",
    }
  } catch (error) {
    console.error("[WhatsApp Service] Error enviando mensaje:", error.message)
    return {
      success: false,
      mensaje: error.message,
    }
  }
}

// Función para enviar ticket de venta (ahora obtiene la configuración)
async function enviarTicketVenta(venta, telefono) {
  try {
    const db = getDb()
    const settings = await db.collection("app_settings").findOne({ _id: "whatsapp_ticket_settings" })
    const companyName = settings?.companyName || "Tu Empresa"
    const attentionHours = settings?.attentionHours || "Lun-Vie 9:00-18:00"

    const ticketMensaje = generarTicketWhatsApp(venta, companyName, attentionHours)
    return await enviarMensajeWhatsApp(telefono, ticketMensaje)
  } catch (error) {
    console.error("[WhatsApp Service] Error al preparar y enviar ticket:", error.message)
    return {
      success: false,
      mensaje: `Error al preparar y enviar ticket: ${error.message}`,
    }
  }
}

// Función para obtener el QR code (sin cambios)
function getQrCode() {
  return getQrCodeData()
}

// Función para cerrar sesión de WhatsApp (sin cambios)
async function logoutWhatsAppClient() {
  try {
    await destroyWhatsAppClient()
    console.log("[WhatsApp Service] Cliente destruido. Re-inicializando para generar nuevo QR si es necesario...")
    await initializeWhatsAppClient().catch((err) => {
      console.warn(
        "[WhatsApp Service] initializeWhatsAppClient rechazó después de logout (esperado si se emite QR):",
        err.message,
      )
    })
    return { success: true, mensaje: "Sesión de WhatsApp cerrada exitosamente. Esperando nuevo QR." }
  } catch (error) {
    console.error("[WhatsApp Service] Error al cerrar sesión:", error.message)
    return { success: false, mensaje: `Error al cerrar sesión: ${error.message}` }
  }
}

// Función para verificar estado del cliente (sin cambios)
function obtenerEstadoCliente() {
  const client = getWhatsAppClient()
  let status = "desconocido"
  const qr = getQrCodeData()

  if (isWhatsAppClientReady()) {
    status = "listo"
  } else if (qr) {
    status = "qr_pendiente"
  } else if (client) {
    status = "inicializando_o_fallo"
  } else {
    status = "no_inicializado"
  }

  return {
    listo: isWhatsAppClientReady(),
    status: status,
    qr: qr,
    mensaje:
      status === "listo"
        ? "Cliente de WhatsApp listo para enviar mensajes."
        : status === "qr_pendiente"
          ? "Escanea el código QR para autenticar."
          : status === "inicializando_o_fallo"
            ? "Cliente inicializando o con fallo de autenticación. Revisa los logs del servidor."
            : "Cliente de WhatsApp no inicializado.",
  }
}

module.exports = {
  enviarMensajeWhatsApp,
  enviarTicketVenta,
  generarTicketWhatsApp,
  obtenerEstadoCliente,
  formatearTelefono,
  getQrCode,
  logoutWhatsAppClient,
  setQrCodeCallback,
}
