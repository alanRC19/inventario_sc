const fs = require('fs').promises;
const path = require('path');

async function cleanupWhatsAppSession() {
  console.log('🧹 Iniciando limpieza manual de sesión de WhatsApp...');
  
  const sessionPath = path.join(__dirname, '.wwebjs_auth');
  
  try {
    // Verificar si el directorio existe
    await fs.access(sessionPath);
    console.log('📁 Directorio de sesión encontrado');
    
    // Intentar con fs.rm primero
    try {
      await fs.rm(sessionPath, { recursive: true, force: true });
      console.log('✅ Archivos de sesión eliminados exitosamente con fs.rm');
      return;
    } catch (rmError) {
      console.log('⚠️ fs.rm falló:', rmError.message);
    }
    
    // Método alternativo: renombrar y eliminar después
    const tempName = `${sessionPath}_cleanup_${Date.now()}`;
    try {
      await fs.rename(sessionPath, tempName);
      console.log('📝 Directorio renombrado temporalmente');
      
      // Esperar un poco y luego eliminar
      setTimeout(async () => {
        try {
          await fs.rm(tempName, { recursive: true, force: true });
          console.log('✅ Archivos eliminados de forma diferida');
        } catch (delayedError) {
          console.log('❌ Error en eliminación diferida:', delayedError.message);
          console.log('💡 Puedes eliminar manualmente la carpeta:', tempName);
        }
      }, 2000);
      
    } catch (renameError) {
      console.log('❌ Error renombrando directorio:', renameError.message);
      console.log('💡 Puedes eliminar manualmente la carpeta:', sessionPath);
    }
    
  } catch (accessError) {
    console.log('ℹ️ No hay archivos de sesión para limpiar');
  }
  
  console.log('🔄 Limpieza completada. Ahora puedes reiniciar el servidor.');
  console.log('📋 Para reiniciar: node index.js');
}

// Ejecutar la limpieza
cleanupWhatsAppSession().catch(console.error);
