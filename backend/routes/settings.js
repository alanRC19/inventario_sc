const express = require("express")
const router = express.Router()
const { getDb } = require("../db")

// GET /api/settings/whatsapp-ticket - Obtener configuración del ticket de WhatsApp
router.get("/whatsapp-ticket", async (req, res) => {
  try {
    const db = getDb()
    // Intentamos encontrar un documento de configuración. Usaremos un ID fijo para que siempre sea el mismo documento.
    const settings = await db.collection("app_settings").findOne({ _id: "whatsapp_ticket_settings" })

    if (settings) {
      res.json({ success: true, data: settings })
    } else {
      // Si no hay configuración, devolvemos valores por defecto
      res.json({
        success: true,
        data: {
          _id: "whatsapp_ticket_settings",
          companyName: "Tu Empresa", // Valor por defecto
          attentionHours: "Lun-Vie 9:00-18:00", // Valor por defecto
        },
      })
    }
  } catch (error) {
    console.error("Error al obtener configuración de WhatsApp:", error)
    res.status(500).json({ success: false, message: "Error al obtener configuración", error: error.message })
  }
})

// POST /api/settings/whatsapp-ticket - Guardar/Actualizar configuración del ticket de WhatsApp
router.post("/whatsapp-ticket", async (req, res) => {
  try {
    const db = getDb()
    const { companyName, attentionHours } = req.body

    if (!companyName || !attentionHours) {
      return res
        .status(400)
        .json({ success: false, message: "Nombre de la empresa y horario de atención son requeridos." })
    }

    const result = await db.collection("app_settings").updateOne(
      { _id: "whatsapp_ticket_settings" }, // ID fijo para el documento de configuración
      { $set: { companyName, attentionHours } },
      { upsert: true }, // Crea el documento si no existe
    )

    res.json({ success: true, message: "Configuración guardada exitosamente.", result })
  } catch (error) {
    console.error("Error al guardar configuración de WhatsApp:", error)
    res.status(500).json({ success: false, message: "Error al guardar configuración", error: error.message })
  }
})

module.exports = router
