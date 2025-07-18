const express = require("express")
const cors = require("cors")
const { connectToDatabase } = require("./db")
const { initializeWhatsAppClient } = require("./whatsappClient")

const app = express()
const PORT = process.env.PORT || 3001 // Asegúrate de que sea 3001

// Middlewares
app.use(cors())
app.use(express.json())

// Importar rutas existentes
const articulosRoutes = require("./routes/articulos")
const categoriasRoutes = require("./routes/categorias")
const proveedoresRoutes = require("./routes/proveedores")
const reportesRoutes = require("./routes/reportes")

// Importar nuevas rutas
const ventasRoutes = require("./routes/ventas")
const whatsappRoutes = require("./routes/whatsapp")
const settingsRoutes = require("./routes/settings") // <--- NUEVA IMPORTACIÓN

// Usar rutas
app.use("/api/articulos", articulosRoutes)
app.use("/api/categorias", categoriasRoutes)
app.use("/api/proveedores", proveedoresRoutes)
app.use("/api/reportes", reportesRoutes)
app.use("/api/ventas", ventasRoutes)
app.use("/api/whatsapp", whatsappRoutes)
app.use("/api/settings", settingsRoutes) // <--- NUEVA RUTA

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "API de Inventario funcionando correctamente",
    endpoints: {
      articulos: "/api/articulos",
      categorias: "/api/categorias",
      proveedores: "/api/proveedores",
      reportes: "/api/reportes",
      ventas: "/api/ventas",
      whatsapp: "/api/whatsapp",
      settings: "/api/settings", // <--- NUEVO ENDPOINT
    },
  })
})

// Ruta para verificar estado de WhatsApp
app.get("/api/status", (req, res) => {
  const { isWhatsAppClientReady } = require("./whatsappClient")
  res.json({
    server: "OK",
    whatsapp: isWhatsAppClientReady() ? "Listo" : "No listo",
    timestamp: new Date().toISOString(),
  })
})

// Inicializar servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await connectToDatabase()
    console.log("✅ Conectado a MongoDB")

    // Inicializar cliente de WhatsApp
    console.log("📱 Inicializando cliente de WhatsApp...")
    try {
      await initializeWhatsAppClient()
      console.log("✅ Cliente de WhatsApp inicializado correctamente")
    } catch (error) {
      console.log("⚠️ Cliente de WhatsApp no pudo inicializarse:", error.message)
      console.log("💡 El servidor funcionará, pero WhatsApp no estará disponible")
      console.log("🔧 Ejecuta 'npm run auth-whatsapp' para autenticar")
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
      console.log(`📱 WhatsApp Service disponible en /api/whatsapp`)
      console.log(`🔍 Estado del servidor: http://localhost:${PORT}/api/status`)
      console.log(`📋 Endpoints disponibles: http://localhost:${PORT}/`)
    })
  } catch (error) {
    console.error("❌ Error iniciando servidor:", error)
    process.exit(1)
  }
}

startServer()
