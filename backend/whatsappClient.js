const { Client, LocalAuth } = require("whatsapp-web.js")
const path = require("path")
const fs = require("fs").promises

let client = null
let isClientReady = false
let isInitializing = false
let qrCodeData = null // Para almacenar el último QR generado
let qrCodeCallback = null // Para notificar cuando hay un nuevo QR

const initializeWhatsAppClient = () => {
  return new Promise((resolve, reject) => {
    if (client && isClientReady) {
      console.log("[WhatsApp Client] Cliente ya listo, omitiendo inicialización.")
      resolve(client)
      return
    }

    if (isInitializing) {
      console.log("[WhatsApp Client] Inicialización en progreso, esperando...")
      // Esperar hasta que termine la inicialización
      const checkReady = setInterval(() => {
        if (isClientReady) {
          clearInterval(checkReady)
          resolve(client)
        }
      }, 1000)
      return
    }

    isInitializing = true
    console.log("[WhatsApp Client] Iniciando cliente de WhatsApp...")

    const sessionPath = path.join(__dirname, ".wwebjs_sessions")
    console.log(`[WhatsApp Client] Usando sesión en: ${sessionPath}`)

    client = new Client({
      authStrategy: new LocalAuth({
        clientId: "inventario_app_v2",
        dataPath: sessionPath,
      }),
      puppeteer: {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        headless: true, // Cambiar a true para producción
      },
    })

    client.on("loading_screen", (percent, message) => {
      console.log(`[WhatsApp Client] Cargando... ${percent}% - ${message}`)
    })

    client.on("authenticated", () => {
      console.log("✅ [WhatsApp Client] Cliente autenticado correctamente.")
    })

    client.on("qr", (qr) => {
      console.log("⚠️ [WhatsApp Client] Se requiere autenticación.")
      console.log("💡 La sesión ha expirado o no existe.")
      console.log("🔧 Ejecuta: npm run auth-whatsapp o escanea el QR en la interfaz de configuración.")
      qrCodeData = qr // Almacenar el QR
      if (qrCodeCallback) {
        qrCodeCallback(qr) // Notificar a cualquier listener
      }
      isInitializing = false
      reject(new Error("Autenticación requerida"))
    })

    client.on("ready", () => {
      console.log("✅ [WhatsApp Client] Cliente listo para enviar mensajes!")
      isClientReady = true
      isInitializing = false
      qrCodeData = null // Limpiar el QR una vez que está listo
      if (qrCodeCallback) {
        qrCodeCallback(null) // Notificar que el QR ya no es necesario
      }
      resolve(client)
    })

    client.on("auth_failure", (msg) => {
      console.error("❌ [WhatsApp Client] Fallo de autenticación:", msg)
      isClientReady = false
      isInitializing = false
      reject(new Error(`Fallo de autenticación: ${msg}`))
    })

    client.on("disconnected", (reason) => {
      console.log("⚠️ [WhatsApp Client] Cliente desconectado:", reason)
      isClientReady = false
      isInitializing = false
      qrCodeData = null // Limpiar el QR al desconectarse

      // Solo reintentar si no fue una desconexión intencional
      if (reason !== "LOGOUT") {
        setTimeout(() => {
          console.log("[WhatsApp Client] Reintentando conexión...")
          initializeWhatsAppClient()
        }, 5000)
      }
    })

    console.log("[WhatsApp Client] Inicializando cliente...")
    // Re-introduce un pequeño retraso antes de inicializar
    setTimeout(() => {
      client.initialize().catch((error) => {
        console.error("[WhatsApp Client] Error en initialize:", error)
        isInitializing = false
        reject(error)
      })
    }, 1000) // Retraso de 1 segundo
  })
}

const destroyWhatsAppClient = async () => {
  if (client) {
    console.log("[WhatsApp Client] Destruyendo cliente de WhatsApp...")
    try {
      await client.destroy()
      console.log("🛑 [WhatsApp Client] Cliente de WhatsApp destruido.")

      // Eliminar manualmente el directorio de la sesión
      const sessionFolderPath = path.join(__dirname, ".wwebjs_sessions", "session-inventario_app_v2")
      console.log(`🗑️ [WhatsApp Client] Intentando eliminar directorio de sesión: ${sessionFolderPath}`)
      await fs.rm(sessionFolderPath, { recursive: true, force: true })
      console.log("✅ [WhatsApp Client] Directorio de sesión eliminado.")
    } catch (error) {
      console.error("❌ [WhatsApp Client] Error al destruir o eliminar sesión:", error)
    } finally {
      client = null
      isClientReady = false
      isInitializing = false
      qrCodeData = null // Crucial: reset QR data on destroy
    }
  }
}

const setQrCodeCallback = (callback) => {
  qrCodeCallback = callback
}

module.exports = {
  getWhatsAppClient: () => client,
  isWhatsAppClientReady: () => isClientReady,
  initializeWhatsAppClient,
  getQrCodeData: () => qrCodeData,
  destroyWhatsAppClient,
  setQrCodeCallback,
}
