const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.qrCodeImage = null; // Para almacenar la imagen base64 del QR
    this.isInitializing = false;
    this.lastQRGenerated = null;
    this.sessionExpired = false;
    this.initializationAttempts = 0;
    this.maxAttempts = 3;
  }

  async initialize() {
    if (this.isInitializing) {
      return { success: false, message: 'Ya se está inicializando WhatsApp' };
    }

    if (this.client && this.isReady) {
      return { success: true, message: 'WhatsApp ya está conectado', status: this.getStatus() };
    }

    this.isInitializing = true;
    this.initializationAttempts++;

    if (this.initializationAttempts > this.maxAttempts) {
      this.isInitializing = false;
      return { 
        success: false, 
        message: 'Máximo número de intentos alcanzado. Reinicia el servidor para intentar nuevamente.' 
      };
    }

    try {
      // Limpiar cliente anterior si existe
      if (this.client) {
      // Si el cliente ya está autenticado pero isReady sigue en false, reinicializar el cliente
      if (this.client && this.client.info && !this.isReady) {
        console.warn('[WhatsAppService] Cliente autenticado pero isReady=false. Reinicializando cliente de WhatsApp...');
        try {
          await this.client.destroy();
        } catch (e) {
          console.error('Error destruyendo cliente previo:', e);
        }
        this.client = null;
        this.isReady = false;
        this.isInitializing = false;
        this.qrCode = null;
        this.qrCodeImage = null;
        this.sessionExpired = false;
        this.initializationAttempts = 0;
        // Volver a crear el cliente y listeners
        return await this.initialize();
      }
        await this.client.destroy();
        this.client = null;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          name: 'inventario-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', async (qr) => {
        console.log('\n🎯 ===============================');
        console.log('📱 CÓDIGO QR GENERADO PARA WHATSAPP');
        console.log('🎯 ===============================');
        console.log('📏 Longitud del QR string:', qr.length);
        console.log('\n📋 INSTRUCCIONES:');
        console.log('1. Abre WhatsApp en tu teléfono');
        console.log('2. Ve a Configuración → Dispositivos vinculados');
        console.log('3. Toca "Vincular un dispositivo"');
        console.log('4. Escanea el código QR desde el frontend o consola');
        console.log('🎯 ===============================\n');
        
        qrcode.generate(qr, { small: true });
        this.qrCode = qr;
        
        // Generar imagen base64 del QR para mostrar en el frontend
        try {
          console.log('🔄 Generando imagen QR para frontend...');
          this.qrCodeImage = await QRCode.toDataURL(qr, {
            width: 256,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          console.log('✅ Imagen QR generada exitosamente. Longitud:', this.qrCodeImage?.length || 0);
          console.log('📊 Disponible en: GET /api/whatsapp/status');
        } catch (error) {
          console.error('❌ Error generando imagen QR:', error);
          this.qrCodeImage = null;
        }
        
        this.lastQRGenerated = new Date();
        this.sessionExpired = false;
      });

      this.client.on('ready', () => {
        console.log('\n🎉 ===============================');
        console.log('✅ WHATSAPP WEB ESTÁ LISTO!');
        console.log('🎉 ===============================');
        this.client.info.then(info => {
          console.log(`📱 Conectado como: ${info.wid.user} (${info.pushname})`);
          console.log(`📞 Este número enviará los tickets a los clientes`);
          console.log(`🚀 Servicio listo para enviar mensajes`);
          console.log('🎉 ===============================\n');
        }).catch(err => console.error('Error obteniendo info:', err));
        // Forzar que isInitializing sea false si el cliente está listo
        this.isReady = true;
        this.qrCode = null;
        this.qrCodeImage = null;
        this.isInitializing = false;
        this.sessionExpired = false;
        this.initializationAttempts = 0;
        console.log('[WhatsAppService] Estado corregido: isReady=true, isInitializing=false');
      });

      this.client.on('authenticated', () => {
        console.log('✅ WhatsApp Web autenticado correctamente');
        // Si por alguna razón isInitializing sigue en true, lo forzamos a false
        if (this.isInitializing) {
          console.log('[WhatsAppService] Corrigiendo isInitializing a false tras autenticación');
          this.isInitializing = false;
        }
        this.sessionExpired = false;
      });

      this.client.on('auth_failure', (msg) => {
        console.error('\n❌ ===============================');
        console.error('❌ ERROR DE AUTENTICACIÓN WHATSAPP');
        console.error('❌ ===============================');
        console.error('📱 Mensaje:', msg);
        console.error('💡 Sugerencia: Regenera la sesión desde el frontend');
        console.error('❌ ===============================\n');
        this.isReady = false;
        this.sessionExpired = true;
        this.isInitializing = false;
      });

      this.client.on('disconnected', (reason) => {
        console.log('\n⚠️  ===============================');
        console.log('⚠️  WHATSAPP WEB DESCONECTADO');
        console.log('⚠️  ===============================');
        console.log('📱 Razón:', reason);
        console.log('💡 El servicio se puede reconectar desde el frontend');
        console.log('⚠️  ===============================\n');
        this.isReady = false;
        this.client = null;
        this.isInitializing = false;
        this.qrCode = null;
        
        // Marcar sesión como expirada si la razón es por sesión
        if (reason === 'NAVIGATION' || reason === 'LOGOUT') {
          this.sessionExpired = true;
        }
      });

      await this.client.initialize();
      
      return { 
        success: true, 
        message: 'WhatsApp inicializando correctamente',
        status: this.getStatus()
      };

    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
      this.isInitializing = false;
      this.sessionExpired = true;
      throw error;
    }
  }

  async sendTicket(phoneNumber, ticketData) {

    console.log('--- [WhatsAppService.sendTicket] ---');
    console.log('isReady:', this.isReady);
    if (!this.client) {
      console.log('El cliente de WhatsApp no está inicializado (this.client es null)');
    } else {
      console.log('Estado del cliente:', {
        authenticated: this.client.info ? true : false,
        info: this.client.info || null
      });
    }
    if (!this.isReady) {
      console.log('No se puede enviar ticket porque isReady es falso.');
      console.log('sessionExpired:', this.sessionExpired);
      console.log('isInitializing:', this.isInitializing);
      throw new Error('WhatsApp no está conectado. Por favor, escanea el código QR primero.');
    }

    try {
      console.log(`📱 Intentando enviar ticket a: ${phoneNumber}`);
      console.log(`📊 Datos del ticket: Cliente: ${ticketData.cliente}, Total: $${ticketData.total}`);
      
      // Formatear número de teléfono siguiendo la lógica que funcionaba
      let formattedNumber = phoneNumber.replace(/\D/g, ''); // Solo números
      
      // Validar que tenga al menos 11 dígitos (1 + 10 dígitos)
      if (formattedNumber.length < 10) {
        throw new Error('El número debe tener al menos 10 dígitos');
      }
      
      // Si no empieza con 521, agregar el código de país para México
      if (!formattedNumber.startsWith('521')) {
        // Si empieza con 1, asumir que es código de país + número mexicano
        if (formattedNumber.startsWith('1') && formattedNumber.length === 11) {
          formattedNumber = '52' + formattedNumber; // 52 + 1 + 10 dígitos
        } else {
          // Si no tiene código de país, agregar 521 (México + móvil)
          formattedNumber = '521' + formattedNumber;
        }
      }
      
      const chatId = formattedNumber + '@c.us';
      console.log(`🔢 Número formateado: ${formattedNumber}, Chat ID: ${chatId}`);

      // Verificar si el número existe en WhatsApp
      const numberExists = await this.client.isRegisteredUser(chatId);
      console.log(`✅ ¿Número registrado en WhatsApp?: ${numberExists}`);
      
      if (!numberExists) {
        throw new Error('El número de WhatsApp no está registrado');
      }

      // Obtener información de la cuenta conectada
      const info = await this.client.info;
      console.log(`📞 Enviando DESDE el número: ${info.wid.user} (${info.pushname})`);
      console.log(`📞 Enviando HACIA el número: ${formattedNumber}`);

      // Generar el mensaje del ticket
      const message = this.generateTicketMessage(ticketData);

      // Enviar el mensaje
      await this.client.sendMessage(chatId, message);
      
      console.log(`✅ Ticket enviado exitosamente de ${info.wid.user} hacia ${phoneNumber}`);
      return { success: true, message: 'Ticket enviado correctamente' };

    } catch (error) {
      console.error('Error enviando ticket:', error);
      throw error;
    }
  }

  generateTicketMessage(ticketData) {
    const { cliente, telefono, productos, total, metodoPago, fecha } = ticketData;
    
    let message = `🧾 *COMPROBANTE DE COMPRA*\n`;
    message += `═══════════════════════════\n\n`;
    
    message += `👤 *Cliente:* ${cliente}\n`;
    if (telefono) {
      message += `� *Teléfono:* ${telefono}\n`;
    }
    message += `�📅 *Fecha:* ${new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}\n`;
    message += `🕐 *Hora:* ${new Date(fecha).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}\n`;
    message += `💳 *Método de Pago:* ${metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1)}\n\n`;
    
    message += `═══════════════════════════\n`;
    message += `� *PRODUCTOS ADQUIRIDOS*\n`;
    message += `═══════════════════════════\n\n`;
    
    productos.forEach((producto, index) => {
      message += `${index + 1}. *${producto.nombre}*\n`;
      message += `   ▪️ Cantidad: ${producto.cantidad} pza(s)\n`;
      message += `   ▪️ Precio Unitario: $${(producto.precioVenta || producto.precioUnitario || 0).toFixed(2)}\n`;
      message += `   ▪️ Subtotal: $${(producto.subtotal || (producto.cantidad * (producto.precioVenta || producto.precioUnitario || 0))).toFixed(2)}\n`;
      if (index < productos.length - 1) {
        message += `   ─────────────────────\n`;
      }
      message += `\n`;
    });
    
    message += `═══════════════════════════\n`;
    message += `� *TOTAL A PAGAR: $${total.toFixed(2)}*\n`;
    message += `═══════════════════════════\n\n`;
    
    message += `🎉 *¡GRACIAS POR SU COMPRA!* 🎉\n\n`;
    message += `Esperamos que disfrute su(s) producto(s).\n`;
    message += `Su confianza en nosotros es muy importante.\n\n`;
    
    message += `─────────────────────────────\n`;
    message += `📍 *INFORMACIÓN DE CONTACTO*\n`;
    message += `─────────────────────────────\n`;
    message += `� *Horario de Atención:*\n`;
    message += `   Lunes a Viernes: 9:00 AM - 6:00 PM\n`;
    message += `   Sábados: 9:00 AM - 2:00 PM\n`;
    message += `   Domingos: Cerrado\n\n`;
    
    message += `📞 *Soporte y Consultas:*\n`;
    if (telefono) {
      message += `   WhatsApp: ${telefono}\n`;
    }
    message += `   Respuesta en horario laboral\n\n`;
    
    message += `✨ *¡Vuelva pronto!* ✨\n`;
    message += `*SC - Sistema de Control de Inventario*`;
    
    return message;
  }

  getPaymentMethodText(metodoPago) {
    const methods = {
      'efectivo': 'Efectivo 💵',
      'tarjeta': 'Tarjeta 💳',
      'transferencia': 'Transferencia 🏦'
    };
    return methods[metodoPago] || metodoPago;
  }

  getStatus() {
    const now = new Date();
    const qrAge = this.lastQRGenerated ? (now - this.lastQRGenerated) / 1000 : null;
    
    return {
      isReady: this.isReady,
      hasQR: !!this.qrCode,
      qrCode: this.qrCode,
      qrCodeImage: this.qrCodeImage, // Incluir la imagen base64 del QR
      isInitializing: this.isInitializing,
      sessionExpired: this.sessionExpired,
      qrAge: qrAge,
      initializationAttempts: this.initializationAttempts,
      maxAttempts: this.maxAttempts,
      needsReconnection: this.sessionExpired || (!this.isReady && !this.isInitializing && !this.qrCode)
    };
  }

  async regenerateSession() {
    console.log('Regenerando sesión de WhatsApp...');
    
    try {
      // Limpiar la sesión actual
      if (this.client) {
        try {
          await this.client.logout();
          console.log('Logout de WhatsApp completado');
        } catch (logoutError) {
          console.log('Error en logout, continuando con destroy:', logoutError.message);
        }
        
        try {
          await this.client.destroy();
          console.log('Cliente WhatsApp destruido');
        } catch (destroyError) {
          console.log('Error destruyendo cliente:', destroyError.message);
        }
        
        this.client = null;
      }
      
      // Resetear variables de estado
      this.isReady = false;
      this.qrCode = null;
      this.qrCodeImage = null;
      this.isInitializing = false;
      this.sessionExpired = false;
      this.initializationAttempts = 0;
      this.lastQRGenerated = null;
      
      // Esperar un momento para que los procesos se liberen
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpiar archivos de sesión de manera más segura para Windows
      await this.cleanSessionFiles();
      
      // Esperar otro momento antes de reinicializar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Inicializar nuevamente
      return await this.initialize();
      
    } catch (error) {
      console.error('Error regenerando sesión:', error);
      this.sessionExpired = true;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.qrCode = null;
      this.qrCodeImage = null;
      this.isInitializing = false;
      this.sessionExpired = false;
      this.initializationAttempts = 0;
      this.lastQRGenerated = null;
    }
  }

  async cleanSessionFiles() {
    const fs = require('fs').promises;
    const path = require('path');
    const sessionPath = path.join(__dirname, '.wwebjs_auth');
    
    try {
      // Verificar si el directorio existe
      await fs.access(sessionPath);
      
      // En Windows, intentar eliminar de manera más gradual
      console.log('Intentando limpiar archivos de sesión...');
      
      // Intentar con fs.rm (método más nuevo y robusto)
      try {
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log('Archivos de sesión eliminados con fs.rm');
        return;
      } catch (rmError) {
        console.log('fs.rm falló, intentando método alternativo:', rmError.message);
      }
      
      // Método alternativo: marcar para eliminación y reintentar
      const tempName = `${sessionPath}_old_${Date.now()}`;
      try {
        await fs.rename(sessionPath, tempName);
        console.log('Directorio de sesión renombrado para eliminación posterior');
        
        // Intentar eliminar en segundo plano
        setTimeout(async () => {
          try {
            await fs.rm(tempName, { recursive: true, force: true });
            console.log('Archivos de sesión eliminados de forma diferida');
          } catch (delayedError) {
            console.log('Error en eliminación diferida (no crítico):', delayedError.message);
          }
        }, 5000);
        
      } catch (renameError) {
        console.log('Error renombrando directorio:', renameError.message);
      }
      
    } catch (accessError) {
      console.log('No hay archivos de sesión para limpiar');
    }
  }
}

// Instancia singleton
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
