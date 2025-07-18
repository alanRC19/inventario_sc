const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const path = require("path")

console.log("🔐 Iniciando proceso de autenticación de WhatsApp...")
console.log("📱 Asegúrate de tener tu teléfono cerca para escanear el código QR")

const sessionPath = path.join(__dirname, ".wwebjs_sessions")
console.log(`📁 Usando directorio de sesión: ${sessionPath}`)

const client = new Client({
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
    headless: false, // Mostrar navegador para autenticación
  },
})

client.on("loading_screen", (percent, message) => {
  console.log(`🔄 Cargando... ${percent}% - ${message}`)
})

client.on("qr", (qr) => {
  console.log("\n📱 Escanea este código QR con WhatsApp Web:")
  console.log("1. Abre WhatsApp en tu teléfono")
  console.log("2. Ve a Configuración > Dispositivos vinculados")
  console.log("3. Toca 'Vincular un dispositivo'")
  console.log("4. Escanea el código QR que aparece abajo:\n")

  qrcode.generate(qr, { small: true })
})

client.on("ready", () => {
  console.log("\n✅ ¡WhatsApp autenticado exitosamente!")
  console.log("🎉 Sesión guardada correctamente")
  console.log("💡 Ya puedes cerrar esta ventana")
  console.log("🚀 Inicia el servidor con: npm run dev")

  // Cerrar el proceso después de la autenticación exitosa
  setTimeout(() => {
    console.log("🔒 Cerrando proceso de autenticación...")
    client.destroy()
    process.exit(0)
  }, 3000)
})

client.on("authenticated", () => {
  console.log("🔒 Sesión autenticada y guardada correctamente")
})

client.on("auth_failure", (msg) => {
  console.error("❌ Error de autenticación:", msg)
  console.log("💡 Intenta ejecutar el script nuevamente")
  process.exit(1)
})

client.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp desconectado:", reason)
  if (reason === "LOGOUT") {
    console.log("🔄 Sesión cerrada, necesitas autenticar nuevamente")
  }
})

// Manejar cierre del proceso
process.on("SIGINT", () => {
  console.log("\n🛑 Cerrando cliente de WhatsApp...")
  client.destroy()
  process.exit(0)
})

console.log("🔄 Inicializando cliente para autenticación...")
client.initialize()
