const express = require("express")
const router = express.Router()
const {
  enviarMensajeWhatsApp,
  enviarTicketVenta,
  obtenerEstadoCliente,
  getQrCode, // Nueva importación
  logoutWhatsAppClient, // Nueva importación
  setQrCodeCallback, // Nueva importación
} = require("../services/whatsappService")

// Ruta para verificar el estado del cliente de WhatsApp
router.get("/status", (req, res) => {
  try {
    const estado = obtenerEstadoCliente()
    res.json(estado)
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener estado del cliente",
      error: error.message,
    })
  }
})

// Ruta para enviar mensaje genérico por WhatsApp
router.post("/send", async (req, res) => {
  try {
    const { telefono, mensaje } = req.body

    if (!telefono || !mensaje) {
      return res.status(400).json({
        success: false,
        mensaje: "Teléfono y mensaje son requeridos",
      })
    }

    const resultado = await enviarMensajeWhatsApp(telefono, mensaje)

    if (resultado.success) {
      res.json(resultado)
    } else {
      res.status(400).json(resultado)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor",
      error: error.message,
    })
  }
})

// Ruta para enviar ticket de venta por WhatsApp
router.post("/send-ticket", async (req, res) => {
  try {
    const { venta, telefono } = req.body

    if (!venta || !telefono) {
      return res.status(400).json({
        success: false,
        mensaje: "Datos de venta y teléfono son requeridos",
      })
    }

    const resultado = await enviarTicketVenta(venta, telefono)

    if (resultado.success) {
      res.json(resultado)
    } else {
      res.status(400).json(resultado)
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error al enviar ticket",
      error: error.message,
    })
  }
})

// Ruta para obtener el QR code
router.get("/qr", (req, res) => {
  try {
    const qr = getQrCode()
    if (qr) {
      res.json({ success: true, qr: qr })
    } else {
      res.status(404).json({ success: false, mensaje: "QR no disponible o cliente ya autenticado." })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error al obtener el QR",
      error: error.message,
    })
  }
})

// Ruta para cerrar sesión de WhatsApp
router.post("/logout", async (req, res) => {
  try {
    const resultado = await logoutWhatsAppClient()
    res.json(resultado)
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: "Error al cerrar sesión",
      error: error.message,
    })
  }
})

module.exports = router
