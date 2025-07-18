// Script para verificar el estado de WhatsApp sin iniciar el servidor completo
const { initializeWhatsAppClient, isWhatsAppClientReady } = require("./whatsappClient")

async function checkWhatsApp() {
  console.log("🔍 Verificando estado de WhatsApp...")

  try {
    await initializeWhatsAppClient()
    console.log("✅ WhatsApp está listo y funcionando")
    process.exit(0)
  } catch (error) {
    console.log("❌ WhatsApp no está listo:", error.message)
    console.log("💡 Ejecuta: npm run auth-whatsapp")
    process.exit(1)
  }
}

checkWhatsApp()
