const express = require('express');
const router = express.Router();
const whatsappService = require('../whatsappService');

// Inicializar WhatsApp Web
router.post('/initialize', async (req, res) => {
  try {
    const result = await whatsappService.initialize();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error inicializando WhatsApp', 
      error: error.message 
    });
  }
});

// Regenerar sesión (limpiar y volver a crear)
router.post('/regenerate', async (req, res) => {
  try {
    const result = await whatsappService.regenerateSession();
    res.json({ 
      success: true, 
      message: 'Sesión regenerada correctamente',
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error regenerando sesión', 
      error: error.message 
    });
  }
});

// Obtener estado de WhatsApp y código QR
router.get('/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json(status);
});

// Enviar ticket por WhatsApp
router.post('/send-ticket', async (req, res) => {
  try {
    const { phoneNumber, ticketData } = req.body;
    console.log('--- [WhatsApp/send-ticket] ---');
    console.log('Body recibido:', req.body);
    if (!phoneNumber || !ticketData) {
      console.log('Falta phoneNumber o ticketData');
      return res.status(400).json({
        success: false,
        message: 'Número de teléfono y datos del ticket son requeridos',
        phoneNumber,
        ticketData
      });
    }
    if (typeof phoneNumber !== 'string' || phoneNumber.length < 10) {
      console.log('Número de teléfono inválido:', phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'El número de teléfono es inválido',
        phoneNumber
      });
    }
    if (typeof ticketData !== 'object' || !ticketData.cliente) {
      console.log('ticketData inválido:', ticketData);
      return res.status(400).json({
        success: false,
        message: 'ticketData inválido',
        ticketData
      });
    }
    const result = await whatsappService.sendTicket(phoneNumber, ticketData);
    res.json(result);
  } catch (error) {
    console.error('Error en /send-ticket:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error
    });
  }
});

// Desconectar WhatsApp
router.post('/disconnect', async (req, res) => {
  try {
    await whatsappService.disconnect();
    res.json({ 
      success: true, 
      message: 'WhatsApp desconectado correctamente' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error desconectando WhatsApp', 
      error: error.message 
    });
  }
});

module.exports = router;
