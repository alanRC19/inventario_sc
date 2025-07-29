require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
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
const authRoutes = require("./routes/auth") // <--- NUEVA IMPORTACIÓN PARA AUTH
const usuariosRoutes = require("./routes/usuarios") // <--- NUEVA IMPORTACIÓN PARA USUARIOS
const movimientosRoutes = require("./routes/movimientos") // <--- NUEVA IMPORTACIÓN PARA MOVIMIENTOS

// Usar rutas
app.use("/api/articulos", articulosRoutes)
app.use("/api/categorias", categoriasRoutes)
app.use("/api/proveedores", proveedoresRoutes)
app.use("/api/reportes", reportesRoutes)
app.use("/api/ventas", ventasRoutes)
app.use("/api/whatsapp", whatsappRoutes)
app.use("/api/settings", settingsRoutes) // <--- NUEVA RUTA
app.use("/api/auth", authRoutes) // <--- NUEVA RUTA PARA AUTH
app.use("/api/usuarios", usuariosRoutes) // <--- NUEVA RUTA PARA USUARIOS
app.use("/api/movimientos", movimientosRoutes) // <--- NUEVA RUTA PARA MOVIMIENTOS

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
      auth: "/api/auth", // <--- NUEVO ENDPOINT PARA AUTH
      usuarios: "/api/usuarios", // <--- NUEVO ENDPOINT PARA USUARIOS
      movimientos: "/api/movimientos", // <--- NUEVO ENDPOINT PARA MOVIMIENTOS
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
    // Conectar a MongoDB con cliente nativo
    await connectToDatabase()
    console.log("✅ Conectado a MongoDB (cliente nativo)")

    // Conectar a MongoDB con Mongoose
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/inventario"
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("✅ Conectado a MongoDB (Mongoose)")

    // Inicializar cliente de WhatsApp
    console.log("📱 Inicializando cliente de WhatsApp...")
    try {
      // await initializeWhatsAppClient() // Comentado temporalmente
      console.log("⚠️ Cliente de WhatsApp deshabilitado temporalmente")
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
